---
title: 基于RRateLimiter实现分布式限流
author: Jinx
date: 2025-07-01
slug: rrate-limiter
featured: false
draft: false
category: database
tags:

  - 限流
  - redis
  - ratelimiter
    description: 本文介绍如何基于Redisson的RRateLimiter实现分布式令牌桶限流，为你的Java应用保驾护航。
---

<!-- more -->

## 1. 背景：为什么需要分布式限流

在现代微服务架构中，单个服务通常会部署多个实例。当需要对某个API或服务进行流量控制时，传统的单机限流无法满足需求，因为它不能在多个实例间共享流量配额。

这时，**分布式限流**就显得至关重要。它能确保所有实例共享同一个计数器，从而实现精准的全局流量控制。本文将介绍一种基于 **Redis** 和 **Redisson** 的 `RRateLimiter` 实现的分布式限流方案。

## 2. 核心思想：令牌桶算法

本方案采用**令牌桶算法**，其工作原理如下：

- **令牌桶**：一个固定容量的桶，系统会以恒定的速率向桶里放入令牌。
- **处理请求**：当一个请求到达时，它必须从桶里获取一个令牌。如果获取成功，请求被处理；如果桶里没有令牌，请求将被拒绝或等待。
- **应对突发流量**：如果桶里有剩余的令牌，系统可以应对短时间的突发流量，这些突发请求会消耗桶中积累的令牌。

| 关键参数   | 解释                                                                        |
| :--------- | :-------------------------------------------------------------------------- |
| `rate`     | **令牌生成速率**：每秒向桶中添加的令牌数，决定了系统的平均处理能力（QPS）。 |
| `capacity` | **桶容量**：令牌桶能存储的最大令牌数，决定了系统能应对的突发流量上限。      |

## 3. 具体实现

我们将使用 Redisson 客户端中的 `RRateLimiter` 来实现分布式令牌桶。

### 3.1. 依赖配置

首先，确保你的Java项目中已引入Redisson的依赖。

### 3.2. 定义限流配置

我们可以将不同应用的限流规则配置在属性文件中，方便管理和动态调整。

```properties
# 默认限流规则
traffic.limit.rate.default=100      # 默认恢复速率: 100 QPS
traffic.limit.capacity.default=100  # 默认桶容量: 100

# 应用A的限流规则
traffic.limit.rate.app-a=10         # 恢复速率: 10 QPS
traffic.limit.capacity.app-a=20     # 桶容量: 20

# 应用B的限流规则
traffic.limit.rate.app-b=200        # 恢复速率: 200 QPS
traffic.limit.capacity.app-b=400    # 桶容量: 400
```

### 3.3. 流量控制服务

下面是限流服务的核心代码，它封装了 `RRateLimiter` 的初始化和令牌获取逻辑。

```java
/**
 * 流量控制服务
 * 基于Redisson的RRateLimiter实现分布式令牌桶限流
 */
@Slf4j
@Service
public class TrafficLimitService {

    @Autowired
    private RedissonClient redissonClient;

    /**
     * 用于缓存RRateLimiter对象的Map，避免重复创建
     */
    private final ConcurrentHashMap<String, RRateLimiter> rateLimiterMap = new ConcurrentHashMap<>();

    /**
     * 尝试获取1个令牌，默认超时时间100ms
     *
     * @param appId 应用ID
     * @return 是否获取成功
     */
    public boolean tryAcquire(String appId) {
        return tryAcquire(appId, 1, 100, TimeUnit.MILLISECONDS);
    }

    /**
     * 尝试获取指定数量的令牌
     *
     * @param appId     应用ID
     * @param permits   要获取的令牌数量
     * @param timeout   超时时间
     * @param timeUnit  时间单位
     * @return 是否获取成功
     */
    public boolean tryAcquire(String appId, int permits, long timeout, TimeUnit timeUnit) {
        if (appId == null || appId.isEmpty()) {
            appId = "default";
        }

        RRateLimiter rateLimiter = getRateLimiter(appId);
        try {
            // 尝试获取令牌
            return rateLimiter.tryAcquire(permits, timeout, timeUnit);
        } catch (Exception e) {
            log.error("获取令牌时发生异常, appId: {}, 错误: {}", appId, e.getMessage(), e);
            // 异常时默认放行，保证系统可用性
            return true;
        }
    }

    /**
     * 获取或创建RRateLimiter实例
     *
     * @param appId 应用ID
     * @return RRateLimiter实例
     */
    private RRateLimiter getRateLimiter(String appId) {
        return rateLimiterMap.computeIfAbsent(appId, key -> {
            String rateLimiterKey = TrafficLimitConstant.getTrafficLimitKey(key);
            RRateLimiter rateLimiter = redissonClient.getRateLimiter(rateLimiterKey);

            // 从配置中获取该应用的令牌桶参数
            int rate = TrafficLimitConstant.getRate(key);
            int capacity = TrafficLimitConstant.getCapacity(key);

            try {
                // 尝试设置令牌桶的速率和容量
                // RateType.OVERALL: 所有实例共享同一个速率
                boolean initialized = rateLimiter.trySetRate(RateType.OVERALL, rate, 1, RateIntervalUnit.SECONDS);
                rateLimiter.trySetCapacity(capacity);

                if (initialized) {
                    log.info("成功初始化令牌桶, appId: {}, 恢复速率: {}/s, 桶容量: {}", key, rate, capacity);
                }
            } catch (Exception e) {
                log.error("初始化令牌桶失败, appId: {}, 错误: {}", key, e.getMessage(), e);
            }

            return rateLimiter;
        });
    }
}
```

### 3.4. 使用示例

在需要限流的地方，只需调用 `tryAcquire` 方法即可。

```java
private boolean checkTrafficLimit(String appId) {
    // 尝试获取1个令牌
    boolean acquired = trafficLimitService.tryAcquire(appId);

    if (!acquired) {
        log.warn("流量限制被触发, appId: {}", appId);
        // 这里可以返回429 Too Many Requests
    }

    return acquired;
}
```

#### 方法签名和参数解释

```java
boolean initialized = rateLimiter.trySetRate(RateType.OVERALL, ratePerSecond, 1, RateIntervalUnit.SECONDS);
```

#### 参数详解

1. **`RateType.OVERALL`** - 限流类型

   - `OVERALL`: 全局限流，所有客户端共享同一个限流配额
   - `PER_CLIENT`: 每个客户端独立限流
   - 这里使用`OVERALL`实现分布式限流，多个应用实例共享同一个限流配额

2. **`ratePerSecond`** - 令牌产生速率

   - 表示每秒向令牌桶中添加的令牌数量
   - 这是**令牌的恢复速率**，控制平均QPS
   - 例如：`ratePerSecond = 100` 表示每秒产生100个令牌

3. **`1`** - 时间间隔数量

   - 与下一个参数配合使用，表示时间间隔的数量
   - 这里是1，表示1个时间单位

4. **`RateIntervalUnit.SECONDS`** - 时间单位
   - 定义时间间隔的单位
   - `SECONDS`: 秒
   - `MINUTES`: 分钟
   - `HOURS`: 小时
   - 配合参数3，`1 + SECONDS` = 1秒

#### 为什么传入ratePerSecond？

##### 令牌桶算法的核心概念

```java
// 从配置中获取两个关键参数
int rateLimit = TrafficLimitConstant.getRateLimit(key);        // 桶容量（未在此处直接使用）
int ratePerSecond = TrafficLimitConstant.getRatePerSecond(key); // 恢复速率
```

**`ratePerSecond`是令牌桶算法中的关键参数**：

1. **控制平均流量**: 决定系统的平均QPS上限
2. **令牌补充速度**: 每秒向桶中添加多少个令牌
3. **长期稳定性**: 保证长时间运行下的流量控制

#### 举例说明

假设配置如下：

```properties
traffic.limit.recovery.kai-wis=10  # 每秒恢复10个令牌
```

那么初始化时：

```java
// 意思是：每1秒钟，向令牌桶中添加10个令牌
rateLimiter.trySetRate(RateType.OVERALL, 10, 1, RateIntervalUnit.SECONDS);
```

## 4. 方案优势总结

- **精确的分布式控制**：基于Redis实现，确保所有服务实例共享限流配额，控制精准。
- **灵活的令牌桶算法**：既能平滑限流，又能应对突发流量，提升用户体验。
- **差异化配置**：可为不同业务、不同应用设置独立的限流策略，隔离影响。
- **高可用设计**：在限流服务（如Redis）出现异常时，默认放行请求，避免影响核心业务。
- **易于监控和调整**：限流参数集中配置，易于实时监控和动态调整。
