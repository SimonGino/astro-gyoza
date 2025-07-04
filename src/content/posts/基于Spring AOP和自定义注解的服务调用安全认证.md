---
title: 基于Spring AOP和自定义注解的服务调用安全认证
author: Jinx
date: 2025-07-05
slug: service-auth
featured: false
draft: false
category: java
tags:
  - AOP
  - 注解
  - 安全认证
description: 本文介绍如何基于Spring AOP和自定义注解实现服务间调用的安全认证，为你的Java应用保驾护航。
---

### 使用AOP和自定义注解实现服务间调用的安全认证

在现代微服务架构中，服务之间的通信安全至关重要。我们需要一种机制来确保只有经过授权的应用程序（服务）才能调用敏感的API。本文将介绍一种基于Spring AOP和自定义注解的优雅实现，它能够以最小的代码侵入性，为我们的服务提供灵活、可配置的调用权限控制。

#### 设计目标

我们的目标是构建一个权限拦截器，它应具备以下特点：

1.  **非侵入性**：业务代码应尽可能少地关心权限校验的逻辑。
2.  **灵活性**：可以轻松地为任何服务方法启用或禁用权限检查。
3.  **可配置性**：允许动态配置哪些应用可以调用本服务。
4.  **高性能**：校验逻辑不应成为服务的性能瓶颈。

#### 实现方案

我们将通过三个核心部分来实现这一功能：

1.  **自定义注解 (`@SkcServiceAuth`)**：一个标记注解，用于标识需要进行权限检查的方法。
2.  **AOP切面 (`SkcServiceAuthChecker`)**：拦截所有被 `@SkcServiceAuth` 标记的方法，并执行核心校验逻辑。
3.  **动态配置与缓存**：从数据字典中读取授权应用列表，并使用Redis进行缓存以提高性能。

---

#### 第一步：创建自定义注解

首先，我们定义一个注解 `@SkcServiceAuth`，它将作为我们AOP切点的目标。

```java
package com.digiwin.kai.skc.annotation;

import java.lang.annotation.*;

/**
 * 技能服务权限检查注解
 * 用于标记需要进行权限检查的方法
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface SkcServiceAuth {
    /**
     * 是否需要检查权限
     * @return 默认true
     */
    boolean check() default true;
}
```

这个注解非常简单，它只能用于方法上。它包含一个 `check()` 属性，默认为 `true`。这提供了一个方便的开关，允许开发者在不移除注解的情况下，临时禁用特定方法的权限检查，非常适合调试或特殊场景。

---

#### 第二步：实现AOP切面

这是我们功能的核心。`SkcServiceAuthChecker` 是一个Spring AOP切面，它会拦截所有使用了 `@SkcServiceAuth` 注解的方法。

```java
package com.digiwin.kai.skc.aop;

// ... imports ...

@Aspect
@Component
@Slf4j
public class SkcServiceAuthChecker {
    // ... fields ...

    // 1. 定义切点，目标是所有使用 @SkcServiceAuth 注解的方法
    @Pointcut("@annotation(com.digiwin.kai.skc.annotation.SkcServiceAuth)")
    public void skcServiceAuthPointcut() {
    }

    // 2. 定义环绕通知，在这里实现我们的校验逻辑
    @Around("skcServiceAuthPointcut() && @annotation(skcServiceAuth)")
    public Object doAround(ProceedingJoinPoint joinPoint, SkcServiceAuth skcServiceAuth) throws Throwable {
        // 如果注解明确设置为false，则直接放行
        if (!skcServiceAuth.check()) {
            return joinPoint.proceed();
        }

        // 忽略匿名访问及非标准服务接口
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AllowAnonymous allowAnonymous = AnnotationUtils.findAnnotation(method, AllowAnonymous.class);
        if (allowAnonymous != null) {
            return joinPoint.proceed();
        }

        // 3. 获取调用方的AppId
        String requestAppId = getRequestAppId();

        // 4. 获取本服务允许的AppId列表
        String[] enabledAppIds = getEnableAppIds();

        // 5. 执行校验
        if (enabledAppIds != null && enabledAppIds.length > 0 && !ArrayUtils.contains(enabledAppIds, requestAppId)) {
            log.warn("app [{}] is not allowed. allowed apps is [{}]", requestAppId, String.join(",", enabledAppIds));
            throw new DWRuntimeException("illegal_request");
        }

        log.info("app [{}] is allowed.", requestAppId);
        return joinPoint.proceed();
    }

    // ... helper methods ...
}
```

`doAround` 方法的逻辑清晰明了：

1.  检查注解的 `check` 属性。
2.  获取调用方的身份标识 `requestAppId`。
3.  获取本服务配置的“白名单” `enabledAppIds`。
4.  判断调用方是否在白名单内，如果不在，则抛出异常，中断请求；如果在，则调用 `joinPoint.proceed()` 放行，让原始方法继续执行。

---

#### 第三步：获取身份与动态配置

切面逻辑依赖两个关键的辅助方法：`getRequestAppId()` 和 `getEnableAppIds()`。

##### 获取调用方AppId

`getRequestAppId` 方法负责从HTTP请求头中解析出调用方应用的ID。在这里，我们约定调用方必须在 `Digi-Middleware-Auth-App` 请求头中携带一个JWT，其中包含了它的`id`信息。

```java
// ...existing code...
    // 获取应用id 900142：请求头参数Digi-Middleware-Auth-App不合法
    protected String getRequestAppId() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (Objects.isNull(requestAttributes))
            return appId;

        HttpServletRequest request = ((ServletRequestAttributes) requestAttributes).getRequest();
        String appToken = request.getHeader("Digi-Middleware-Auth-App");
        if (StringUtils.isEmpty(appToken))
            return appId;

        String[] jwt = appToken.split("\\.");
        Assert.isTrue(jwt.length == 3, DWApplicationMessageResourceBundleUtils.getString(AUTH_APP_NOT_INVALID));

        JSONObject jwtPayload = parseObject(jwt[1]);
        String appId = jwtPayload.getString("id");
        Assert.isTrue(StringUtils.isNotBlank(appId),
                DWApplicationMessageResourceBundleUtils.getString(AUTH_APP_NOT_INVALID));

        return appId;
    }
// ...existing code...
```

##### 动态获取授权列表并缓存

`getEnableAppIds` 方法是实现动态配置和高性能的关键。它采用“缓存优先”策略。

```java
// ...existing code...
    protected String[] getEnableAppIds() {
        // 1. 尝试从 Redis 缓存读取
        String cached = redisTemplate.opsForValue().get(TOKEN_KEY);
        if (cached != null && !cached.isEmpty()) {
            return cached.split(",");
        }

        // 2. 缓存未命中，从数据字典（数据库）中查询
        SystemDataDictionaryEntity systemDataDictionary = dictionaryMapper.getSystemDataDictionary(TOKEN_KEY,
                GlobalConstants.LANGUAGE_ZH_CN);
        List<String> enabledAppIds = new ArrayList<>();

        if (systemDataDictionary != null && systemDataDictionary.getValue() != null) {
            enabledAppIds.addAll(Arrays.asList(systemDataDictionary.getValue().split(",")));
        }

        // 始终信任自身
        enabledAppIds.add(appId);
        enabledAppIds = enabledAppIds.stream().distinct().collect(Collectors.toList());

        // 3. 将结果写入 Redis，并设置1分钟过期时间
        if (!enabledAppIds.isEmpty()) {
            redisTemplate.opsForValue().set(TOKEN_KEY, String.join(",", enabledAppIds), 1, TimeUnit.MINUTES);
        }

        return enabledAppIds.toArray(new String[0]);
    }
// ...existing code...
```

这个方法的逻辑是：

1.  首先尝试从Redis获取`kai:skc:enabledAppIds`这个key的值。
2.  如果Redis中没有，就从数据库（通过`SystemDataDictionaryMapper`）中读取配置。
3.  将当前应用自身的`appId`也加入到信任列表，并进行去重。
4.  最后，将最新的列表存入Redis，并设置一个较短的过期时间（例如1分钟）。这样既能保证配置更改后可以快速生效，又能极大减少数据库的访问压力。

---

#### 如何使用？

得益于AOP和注解，使用这个功能变得异常简单。开发者只需要在需要保护的Service方法上添加 `@SkcServiceAuth` 注解即可。

```java
import com.digiwin.kai.skc.annotation.SkcServiceAuth;
import com.digiwin.app.service.restful.DWRequestMapping;
import org.springframework.stereotype.Service;

@Service
public class MyBusinessService {

    @SkcServiceAuth // 启用权限检查
    @DWRequestMapping(path = "/some/sensitive/operation", method = "POST")
    public void doSensitiveOperation(String params) {
        // 业务逻辑...
        // 只有合法的AppId才能执行到这里
    }

    @SkcServiceAuth(check = false) // 临时禁用权限检查
    @DWRequestMapping(path = "/some/public/operation", method = "GET")
    public String doPublicOperation() {
        // 任何AppId都可以调用
        return "Hello, World!";
    }
}
```

#### 总结

通过结合使用自定义注解和Spring AOP，我们成功构建了一个强大而灵活的服务调用认证系统。它将安全校验逻辑与业务逻辑完全解耦，使得代码更清晰、更易于维护。同时，通过引入Redis缓存和动态配置，系统在保证安全的同时，也兼顾了高性能和灵活性，是微服务治理中的一个优秀实践。
