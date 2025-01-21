---
title: Redisson分布式锁的看门狗机制探究
author: Jinx
date: 2024-11-28
slug: redisson-distributed-lock-watchdog
featured: true
draft: false
categories:
  - java
tags:
  - Redisson
  - 分布式锁
  - 看门狗机制
  - Spring AOP
  - Redis
description: 深入分析Redisson分布式锁实现中的看门狗机制,探讨其对锁过期时间的影响,以及如何正确配置以实现预期的锁行为
---

以下是优化后的文章格式，主要是改善了排版、标题层级和代码块的清晰度，方便阅读：

## 问题背景

在一个使用Spring AOP实现防重复提交功能的项目中，我们发现了一个有趣的现象：通过 `@KaiNoRepeatSubmit` 注解设置的锁过期时间（10秒）并没有生效，而是始终保持30秒才过期。这引发了我们对Redisson分布式锁实现机制的深入探究。

## 问题分析过程

### 1. 初始实现

最初的实现使用了Spring AOP的环绕通知和后置通知：

```java
@Around(value = "noRepeatSubmitPoint(kaiNoRepeatSubmit)")
public Object judgeRepeatSubmit(ProceedingJoinPoint joinPoint, KaiNoRepeatSubmit kaiNoRepeatSubmit) throws Throwable {
    String key = getRequestKey(joinPoint, kaiNoRepeatSubmit);
    long seconds = kaiNoRepeatSubmit.seconds(); // 设置为10秒
    if (!kaiRedissonLockComponent.getLock(key, seconds, TimeUnit.SECONDS)) {
        return new DWServiceResult(false, "重复请求");
    }
    return joinPoint.proceed();
}

@After(value = "noRepeatSubmitPoint(kaiNoRepeatSubmit)")
public void afterMethod(JoinPoint joinPoint, KaiNoRepeatSubmit kaiNoRepeatSubmit) {
    kaiRedissonLockComponent.removeLock(getRequestKey(joinPoint, kaiNoRepeatSubmit));
}
```

### 2. 问题发现

通过日志观察，我们发现：

- 锁的获取是成功的
- 业务方法执行完成后锁被释放
- 但锁的实际过期时间仍然是30秒
- 这与我们设置的10秒明显不符

### 3. 深入分析

进一步研究发现这与Redisson的看门狗（WatchDog）机制有关：

#### Redisson默认配置

- 看门狗超时时间为30秒
- 会在锁的过期时间剩余1/3时自动续期
- 续期时会将过期时间重置为30秒

#### 实际执行流程

- **时间点1**: 00:00:00 - 在 `@Around` 中设置10秒锁
  - Redisson同时启动看门狗线程
- **时间点2**: 00:00:01 - 业务方法执行完成
  - `@After` 执行，调用 `removeLock`
- **时间点3**: 00:00:01 - 看门狗线程仍在运行
  - 锁的过期时间被重置为30秒

## 解决方案

### 1. 配置修改

在Redisson配置中禁用看门狗机制：

```java
@Bean
public RedissonClient redissonClient() {
    Config config = new Config();
    // ... 其他配置 ...
    config.setLockWatchdogTimeout(0L); // 禁用看门狗
    return Redisson.create(config);
}
```

### 2. 锁实现优化

修改锁的获取方式，避免看门狗干扰：

```java
public boolean getLock(String lockName, long expireTime, TimeUnit timeUnit) {
    try {
        RLock lock = redissonClient.getLock(lockName + LOCK_FLAG);
        return lock.tryLock(0, expireTime, timeUnit);
    } catch (Exception e) {
        LOGGER.warn("获取锁失败", e);
        return false;
    }
}
```

### 3. 移除手动释放

删除 `@After` 注解方法，让锁自然过期：

```java
@Around(value = "noRepeatSubmitPoint(kaiNoRepeatSubmit)")
public Object judgeRepeatSubmit(ProceedingJoinPoint joinPoint, KaiNoRepeatSubmit kaiNoRepeatSubmit) throws Throwable {
    String key = getRequestKey(joinPoint, kaiNoRepeatSubmit);
    if (!kaiRedissonLockComponent.getLock(key, kaiNoRepeatSubmit.seconds(), TimeUnit.SECONDS)) {
        return new DWServiceResult(false, "重复请求");
    }
    return joinPoint.proceed();
}
```

## 经验总结

1. **Redisson的看门狗机制是一把双刃剑**：

- **优点**: 防止分布式锁因节点宕机而无法释放
- **缺点**: 可能干扰预期的锁行为

2. **正确使用分布式锁需要**：

- 理解底层实现机制
- 根据业务需求选择合适的配置
- 避免过度设计

3. **实践建议**：

- 明确锁的使用场景
- 选择合适的过期策略
- 做好监控和日志记录

## 参考资料

- [Redisson官方文档](https://github.com/redisson/redisson/wiki/8.-分布式锁和同步器)
- [Redis分布式锁实现原理](https://redis.io/topics/distlock)

---

这个优化版更注重清晰的结构、代码的突出显示以及段落的分隔，以提升文章的可读性和逻辑性。
