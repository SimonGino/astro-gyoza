---
title: 基于Redis和Spring AOP实现防重复提交机制
author: Jinx
date: 2024-10-24 15:55:22
slug: redis-spring-aop-prevent-duplicate-submit
featured: true
draft: false
tags:
  - Redis
  - Spring
  - AOP
  - Java
  - 分布式锁
categories:
  - Java后端开发
  - 分布式系统
  - 架构设计
keywords:
  - Redis
  - Spring AOP
  - 防重复提交
  - 分布式锁
  - Redisson
  - 切面编程
description: 本文详细介绍如何使用Redis分布式锁和Spring AOP实现一个优雅的防重复提交解决方案，包含完整的代码实现、原理讲解和实战案例。
---

> 在Web应用程序开发中，防止用户重复提交表单是一个常见的需求。本文将详细介绍如何使用Redis分布式锁和Spring AOP来实现一个优雅的防重复提交解决方案。

# 基于Redis和Spring AOP实现防重复提交机制

## 引言

在Web应用程序开发中，防止用户重复提交表单是一个常见的需求。重复提交可能会导致数据重复、资源浪费，甚至引发业务异常。本文将详细介绍如何使用Redis分布式锁和Spring AOP来实现一个优雅的防重复提交解决方案。

## 整体架构

该解决方案包含以下核心组件：

1. 自定义注解 `@NoRepeatSubmit`：用于标记需要防重复提交的方法
2. Redis分布式锁配置：使用Redisson客户端实现
3. 切面处理类：实现防重复提交的核心逻辑

## 详细实现

### 1. 自定义注解

首先创建一个注解，用于标记需要防重复提交的方法：

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface NoRepeatSubmit {
    /**
     * 锁持续时间（秒）
     */
    int seconds() default 30;

    /**
     * 特定的锁标识位置
     */
    String location() default "";

    /**
     * 锁标识参数位置
     */
    int paramIndex() default 0;

    /**
     * 锁标识参数名称（优先于paramIndex）
     */
    String paramName() default "";
}
```

### 2. Redis配置类

配置Redisson客户端：

```java
@Configuration
public class RedissonConfiguration {
    @Value("${spring.redis.host}")
    private String host;
    @Value("${spring.redis.port}")
    private String port;
    @Value("${spring.redis.database}")
    private int database;
    @Value("${spring.redis.password}")
    private String password;
    @Value("${spring.redis.timeout}")
    private int timeout;

    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        SingleServerConfig singleServerConfig = config.useSingleServer();
        singleServerConfig.setAddress(String.format("redis://%s:%s", host, port))
                .setDatabase(database)
                .setTimeout(timeout);

        if (!StringUtils.isEmpty(password)) {
            singleServerConfig.setPassword(password);
        }
        return Redisson.create(config);
    }
}
```

### 3. 分布式锁组件

创建Redis分布式锁的管理组件：

```java
@Component
public class RedisLockComponent {
    private static final Logger LOGGER = LoggerFactory.getLogger(RedisLockComponent.class);
    private static final String LOCK_FLAG = ":LOCK";

    private final RedissonClient redissonClient;

    public RedisLockComponent(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
    }

    /**
     * 获取锁
     * @param lockName 锁名称
     * @param expireTime 过期时间
     * @param timeUnit 时间单位
     * @return 是否获取成功
     */
    public boolean getLock(String lockName, int expireTime, TimeUnit timeUnit) {
        try {
            RLock lock = redissonClient.getLock(lockName + LOCK_FLAG);
            return lock.tryLock(3, expireTime, timeUnit);
        } catch (Exception e) {
            LOGGER.warn("线程:[{}]获取锁:[{}]失败", Thread.currentThread().getName(), lockName, e);
            return false;
        }
    }

    /**
     * 释放锁
     * @param lockName 锁名称
     */
    public void releaseLock(String lockName) {
        try {
            RLock lock = redissonClient.getLock(lockName + LOCK_FLAG);
            if (lock.tryLock()) {
                lock.unlock();
            }
        } catch (Exception e) {
            LOGGER.warn("线程:[{}]释放锁:[{}]失败", Thread.currentThread().getName(), lockName, e);
        }
    }
}
```

### 4. 切面实现

实现防重复提交的核心切面：

```java
@Aspect
@Component
public class NoRepeatSubmitAspect {
    private static final String REPEAT_LOCK_PREFIX = "RepeatLock";

    private final RedisLockComponent redisLockComponent;

    public NoRepeatSubmitAspect(RedisLockComponent redisLockComponent) {
        this.redisLockComponent = redisLockComponent;
    }

    @Pointcut("@annotation(noRepeatSubmit)")
    public void noRepeatSubmitPoint(NoRepeatSubmit noRepeatSubmit) {}

    @Around(value = "noRepeatSubmitPoint(noRepeatSubmit)",
            argNames = "joinPoint,noRepeatSubmit")
    public Object handleRepeatSubmit(ProceedingJoinPoint joinPoint,
            NoRepeatSubmit noRepeatSubmit) throws Throwable {
        String key = generateLockKey(joinPoint, noRepeatSubmit);
        int seconds = noRepeatSubmit.seconds();

        if (!redisLockComponent.getLock(key, seconds, TimeUnit.SECONDS)) {
            return Result.error("请勿重复提交");
        }

        try {
            return joinPoint.proceed();
        } finally {
            redisLockComponent.releaseLock(key);
        }
    }

    private String generateLockKey(JoinPoint joinPoint, NoRepeatSubmit noRepeatSubmit) {
        String urlPath = noRepeatSubmit.location();
        if (StringUtils.isBlank(urlPath)) {
            HttpServletRequest request =
                ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
            urlPath = request.getRequestURI();
        }

        // 获取方法参数
        Map<String, Object> paramMap = new HashMap<>();
        Object[] argValues = joinPoint.getArgs();
        String[] argNames = ((MethodSignature)joinPoint.getSignature()).getParameterNames();
        for (int i = 0; i < argNames.length; i++) {
            paramMap.put(argNames[i], argValues[i]);
        }

        // 获取锁的唯一标识
        String paramValue;
        String paramName = noRepeatSubmit.paramName();
        if (StringUtils.isNotBlank(paramName)) {
            paramValue = String.valueOf(paramMap.get(paramName));
        } else {
            paramValue = String.valueOf(argValues[noRepeatSubmit.paramIndex()]);
        }

        // 组装锁的key
        String userId = getCurrentUserId();  // 获取当前用户ID的方法
        return String.format("%s:%s:%s:%s",
            REPEAT_LOCK_PREFIX, userId, urlPath.replaceAll("/", "_"), paramValue);
    }
}
```

### 5. 统一返回结果类

```java
@Data
@AllArgsConstructor
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }
}
```

## 使用示例

```java
@RestController
@RequestMapping("/order")
public class OrderController {

    @PostMapping("/submit")
    @NoRepeatSubmit(seconds = 30, paramName = "orderId")
    public Result<String> submitOrder(@RequestBody OrderRequest request) {
        // 订单处理逻辑
        return Result.success("订单提交成功");
    }
}
```

## 工作原理

1. 当标注了 `@NoRepeatSubmit` 的方法被调用时，切面会拦截该调用
2. 根据以下信息生成唯一的锁键：
   - 用户ID
   - 请求路径
   - 指定的参数值
3. 尝试获取Redis分布式锁
4. 如果获取锁成功：
   - 执行原方法
   - 方法执行完成后释放锁
5. 如果获取锁失败：
   - 返回重复提交的错误信息

## 方案优势

1. **分布式支持**：可以在集群环境下正常工作
2. **灵活配置**：可自定义锁定时间和锁标识生成规则
3. **代码解耦**：通过AOP实现，对业务代码无侵入
4. **性能高效**：基于Redis的分布式锁实现，性能好
5. **使用简单**：只需添加注解即可使用

## 注意事项

1. 合理设置锁的过期时间，避免锁时间过长影响用户体验
2. 需要考虑Redis的可用性，建议添加Redis集群
3. 重复提交的判断依据要根据业务场景合理设置
4. 建议添加相应的监控指标，及时发现潜在问题

## 总结

通过Redis分布式锁和Spring AOP的结合，我们实现了一个简单而强大的防重复提交解决方案。这种实现方式具有良好的扩展性和维护性，可以根据实际业务需求进行定制化改造。

在实际应用中，还可以考虑添加以下功能：

1. 自定义重复提交的判断逻辑
2. 添加白名单机制
3. 实现更细粒度的锁控制
4. 添加更多的监控指标
