---
title: Spring @Transactional注解最佳实践指南
author: Jinx
date: 2024-09-23
slug: spring-transactional-annotation-best-practices
featured: true
draft: false
categories:
  - java
tags:
  - 事务管理
  - Spring注解
  - 性能优化
  - 数据一致性
description: 深入解析Spring @Transactional注解的使用陷阱与最佳实践，包括事务传播属性详解、常见失效场景分析、异常处理策略以及性能优化建议
---

### @Transactional 注解

#### 问题分类

1. **不必要**

- **无需事务的业务**: 例如查询或HTTP请求方法。
- **事务范围过大**: 将注解加在类或抽象类上，导致所有方法被事务管理。

2. **不生效**

- **方法权限问题**: 不应在 `private` 方法上使用 `@Transactional`。
- **被 `final` 或 `static` 修饰的方法**: 这些方法不会被代理。
- **同类内部方法调用**: 事务不会生效，因为调用不经过代理。
- **Bean 未被 Spring 管理**: 必须由 Spring 管理。
- **异步线程调用**: 事务状态不跨线程传递。

3. **不回滚**

- **用错传播属性**: 如 `REQUIRED`, `MANDATORY`, `NEVER`, `REQUIRES_NEW`, `NESTED`, `SUPPORTS`, `NOT_SUPPORTED`。
- **自己吞了异常**: 捕获异常后未重新抛出。
- **事务无法捕获的异常**: 如 `Exception` 而非 `RuntimeException`。
- **自定义异常范围问题**: 异常类型未正确设置。

#### 传播属性详解

- `REQUIRED`: 默认行为，根据当前事务状态决定是否创建新事务。
- `MANDATORY`: 必须在事务中调用，否则抛出异常。
- `NEVER`: 非事务性执行，存在事务则抛出异常。
- `REQUIRES_NEW`: 总是创建新事务，挂起当前事务。
- `NESTED`: 嵌套事务，子事务依赖父事务。
- `SUPPORTS`: 支持事务，不存在则非事务方式执行。
- `NOT_SUPPORTED`: 非事务方式执行，存在事务则挂起。

#### 总结

- 正确理解和使用 `@Transactional` 注解对于确保事务正确回滚和性能优化至关重要。
- 应避免不必要的事务使用，确保事务注解在正确的方法上生效，并正确处理异常以保证事务能够按预期回滚。
