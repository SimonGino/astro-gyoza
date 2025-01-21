---
title: Filter、Interceptor、Spring AOP 的执行顺序
author: Jinx
date: 2025-01-03
slug: filter-interceptor-spring-aop-execution-order
featured: true
draft: false
categories:
  - java
tags:
  - Filter
  - Interceptor
  - Spring AOP
description: 详细介绍Filter、Interceptor、Spring AOP的执行顺序
---

## 引言

Filter、Interceptor 和 Spring AOP 的执行顺序。这个问题看似简单，实则涉及了 Spring 框架中请求处理的核心机制。今天，让我们通过实例来深入理解这三者的区别和联系。

## 请求处理流程图

在开始详细讲解之前，先看一张图来理解它们在请求处理过程中的位置：

```plaintext
Request  -->  Filter  -->  Interceptor  -->  AOP  -->  Controller
   ↑                                                       |
   |                                                       |
   └───────────────────────────────────────────────────────┘
```

## Filter：请求的第一道防线

### 什么是 Filter？

Filter 是 JavaEE 的标准，是请求处理的第一道关卡。它可以对所有进入容器的请求进行预处理，也可以对响应进行后处理。

### 实战示例

让我们来看一个简单的日志记录过滤器：

```java
@Component
@WebFilter(urlPatterns = "/*")
public class RequestLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;

        // 记录请求开始时间
        long startTime = System.currentTimeMillis();
        log.info("开始处理请求: {} {}", req.getMethod(), req.getRequestURI());

        // 继续处理请求
        chain.doFilter(request, response);

        // 记录请求处理时间
        log.info("请求处理完成，耗时: {}ms", System.currentTimeMillis() - startTime);
    }
}
```

## Interceptor：Spring MVC 的好帮手

### 为什么需要 Interceptor？

相比 Filter，Interceptor 是 Spring MVC 框架自己的组件，能够访问 Spring 的上下文，可以调用 Spring 的Bean。

### 实战示例

下面是一个权限检查拦截器：

```java
@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
            Object handler) throws Exception {
        // 检查用户是否登录
        String token = request.getHeader("Authorization");
        if (StringUtils.isEmpty(token)) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return false;
        }
        return true;
    }
}
```

## AOP：面向切面的神器

### AOP 的独特之处

AOP 允许我们在不修改原有代码的情况下，为方法添加新的行为。它工作在方法调用层面，是最接近业务代码的。

### 实战示例

一个方法执行时间统计切面：

```java
@Aspect
@Component
public class MethodTimeAspect {

    @Around("@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    public Object timeCalculator(ProceedingJoinPoint point) throws Throwable {
        long startTime = System.currentTimeMillis();

        Object result = point.proceed();

        log.info("方法 {} 执行耗时: {}ms",
            point.getSignature().getName(),
            System.currentTimeMillis() - startTime);

        return result;
    }
}
```

## 执行顺序详解

让我们通过一个完整的请求示例来看看它们的执行顺序：

```text
1. Filter#doFilter 开始
2. Interceptor#preHandle
3. AOP 环绕通知开始
4. Controller 方法执行
5. AOP 环绕通知结束
6. Interceptor#postHandle
7. Interceptor#afterCompletion
8. Filter#doFilter 结束
```

## 如何选择？

在实际开发中，如何选择使用哪种技术呢？这里有一些建议：

- **使用 Filter 当：**

  - 需要处理所有请求（包括静态资源）
  - 需要在请求到达 Spring 上下文之前进行处理
  - 需要对 ServletRequest 或 ServletResponse 进行修改

- **使用 Interceptor 当：**

  - 需要访问 Spring 上下文
  - 只需要处理 Spring MVC 的请求
  - 需要对 Controller 的请求进行前置或后置处理

- **使用 AOP 当：**
  - 需要处理特定方法的调用
  - 需要在方法调用前后执行额外逻辑
  - 需要统一处理某些注解标记的方法

## 总结

Filter、Interceptor 和 AOP 各有特色，都是 Spring 生态系统中重要的组件：

- Filter 工作在 Servlet 容器级别
- Interceptor 工作在 Spring MVC 框架级别
- AOP 工作在 Spring 容器级别

理解它们的执行顺序和适用场景，能够帮助我们更好地设计和实现各种横切关注点的功能。
