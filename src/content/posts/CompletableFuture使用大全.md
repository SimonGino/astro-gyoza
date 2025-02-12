---
title: Java CompletableFuture异步编程完全指南
author: Jinx
date: 2024-09-20
slug: java-completablefuture-guide
featured: true
draft: false
category: java
tags:
  - 异步编程
  - 并发编程
  - 线程池
  - 回调机制
description: 深入解析Java CompletableFuture的使用方法，包括异步任务创建、任务组合、异常处理、线程池配置等核心特性，并通过实际案例展示其在高并发场景下的最佳实践
---

### CompletableFuture使用大全

#### 1. CompletableFuture基本概述

- **用途**：用于异步调用，内部封装线程池，简化多线程和高并发处理。
- **特点**：封装了Future，具有回调功能，可在任务完成后继续进行下一个动作。

> Runnable就是没有返回结果的行为。
>
> Callable是有返回结果的行为。
>
> Future 异步封装Callable和Runnable，委托给线程池执行后，需要取回执行的结果
>
> CompletableFuture 封装了Future，使其拥有了回调的功能，在某个行为完成之后，可以继续进行下一个动作。

#### 2. API方法分类与记忆规律

- **创建类**：
  - `completeFuture`：创建默认返回值的CompletableFuture。
  - `runAsync`：异步执行无返回值。
  - `supplyAsync`：异步执行有返回值。
  - `anyOf`：任意一个执行完成即可进行下一步。
  - `allOf`：所有任务完成才进行下一步。
- **状态取值类**：
  - `join`：合并结果，等待。
  - `get`：合并等待结果，可增加超时时间。
  - `getNow`：如果结果计算完成或异常则返回，否则返回指定值。
  - `isCancelled`、`isCompletedExceptionally`、`isDone`：状态检查方法。
- **控制类**：用于主动控制CompletableFuture的完成行为。
  - `complete`、`completeExceptionally`、`cancel`：控制完成、异常和取消。
- **接续类**：注入回调行为，是CompletableFuture的核心特性。
  - `thenApply`、`thenApplyAsync`
  - `thenAccept`、`thenAcceptAsync`
  - `thenRun`、`thenRunAsync`
  - `thenCombine`、`thenCombineAsync`
  - `thenAcceptBoth`、`thenAcceptBothAsync`
  - `runAfterBoth`、`runAfterBothAsync`
  - `applyToEither`、`applyToEitherAsync`
  - `acceptEither`、`acceptEitherAsync`
  - `runAfterEither`、`runAfterEitherAsync`
  - `thenCompose`、`thenComposeAsync`
  - `whenComplete`、`whenCompleteAsync`
  - `handle`、`handleAsync`
  - `exceptionally`
    > 1.入口函数`supplyAsync()`代表一个异步的有返回值的函数，之所以异步，是与主线程区别，从线程池中的拿一个线程来执行。
    >
    > 2.`thenApply()`和`thenAccept()`没有`Async`，意味着是和前面的任务共用一个线程，从执行结果上我们也可以看到线程名称相同。
    >
    > 3.`thenApply()`需要接收上一个任务的返回值，并且自己也要有返回值。
    >
    > 4.`thenAccept()`需要接收上一个任务的返回值，但是它不需要返回值。
    >
    > 5.`thenApplyAsync()`和`thenRunAsync()`分别表示里面的任务都是异步执行的，和执行前面的任务不是同一个线程；
    >
    > 6.`thenRunAsync()`需要传入一个既不需要参数，也没有返回值的任务；

#### 3. 创建CompletableFuture

- **异步任务**：无返回值和有返回值的异步任务。
- **组合任务**：使用`anyOf`和`allOf`组合任务。

#### 4. 取值与状态

- **常用方法**：`join()`、`get()`、`get(1, TimeUnit.Hours)`等。

#### 5. 控制CompletableFuture执行

- **完成**：`future.complete("米饭")`
- **异常**：`future.completeExceptionally()`
- **取消**：`future.cancel(false)`

#### 6. 接续行为

- **接续方式1**：通过`thenAcceptAsync`、`thenRunAsync`等方法接续行为。
- **接续方式2**：组合多个CompletableFuture，如`thenCombineAsync`、`thenAcceptBothAsync`等。
- **接续方式3**：结果处理，如`whenCompleteAsync`、`handleAsync`、`exceptionally`。

#### 7. 代码示例

- **异步任务示例**：

  ```java
  CompletableFuture future = CompletableFuture.supplyAsync(() -> {
      System.out.println("电饭煲开始做饭");
      try {
          TimeUnit.SECONDS.sleep(3);
      } catch (InterruptedException e) {
          e.printStackTrace();
      }
      return "白米饭";
  }).thenAccept(result -> {
      System.out.println("开始吃米饭");
  });
  System.out.println("我先去搞点牛奶和鸡蛋");
  future.join();
  ```

- **组合任务示例**：

  ```java
  List<CompletableFuture<YoutubeVideoEntity>> futures = subVideosList.stream()
      .map(item ->
          CompletableFuture.supplyAsync(() -> this.getRetry(item), ThreadPoolHolder.BG_CRAWLER_POOL)
      ).collect(Collectors.toList());
  List<YoutubeVideoEntity> videoEntities = futures.stream().map(CompletableFuture::join)
      .filter(item -> item != null && item.getVideoId() != null).collect(Collectors.toList());
  ```

  ```java
  private List<String> getUserPermissions(String createId, boolean isFromGetUserRoleList) throws Exception {
          List<String> permissions = new ArrayList<>();

          long startTime = System.currentTimeMillis();

          CompletableFuture<List<String>> userRolesFuture = CompletableFuture.supplyAsync(() -> {
              try {
                  long roleStartTime = System.currentTimeMillis();
                  List<String> roles = testRelayBiz.queryUserRoleList(createId);
                  long roleEndTime = System.currentTimeMillis();
                  log.info("queryUserRoleList execution time: {} ms", roleEndTime - roleStartTime);
                  return roles;
              } catch (Exception e) {
                  throw new CompletionException("Error fetching user roles", e);
              }
          }, asyncExecutor).exceptionally(ex -> {
              log.error("Exception in querying user roles: {}", ex.getMessage());
              return Collections.emptyList();
          });

          CompletableFuture<Boolean> isAdminFuture = CompletableFuture.supplyAsync(() -> {
              try {
                  long adminStartTime = System.currentTimeMillis();
                  boolean isAdmin = testRelayBiz.getSystemIsAdmin();
                  long adminEndTime = System.currentTimeMillis();
                  log.info("getSystemIsAdmin execution time: {} ms", adminEndTime - adminStartTime);
                  return isAdmin;
              } catch (Exception e) {
                  throw new CompletionException("Error checking system admin status", e);
              }
          }, asyncExecutor).exceptionally(ex -> {
              log.error("Exception in checking system admin status: {}", ex.getMessage());
              return false;
          });

          // 等待所有异步任务完成
          CompletableFuture.allOf(userRolesFuture, isAdminFuture).join();

          List<String> userRoles = userRolesFuture.get();
          Boolean systemIsAdmin = isAdminFuture.get();

          if (CollectionUtils.isNotEmpty(userRoles) && UserRoleNameConstant.checkUserRole(userRoles)) {
              permissions.addAll(assemblePermissions(systemIsAdmin, isFromGetUserRoleList));
          }

          long endTime = System.currentTimeMillis();
          log.info("Total getUserPermissions execution time: {} ms", endTime - startTime);

          return permissions;
      }
  ```

> `CompletableFuture`没有现成的api实现快速失败的功能，所以我们只能结合`allOf()`和`anyOf()`来逻辑来自定义方法完成快速失败的逻辑；
>
> 1.我们需要额外创建一个CompletableFuture来监听所有的CompletableFuture，一旦其中一个CompletableFuture产生异常，我们就设置额外的CompletableFuture立即完成。
>
> 2.把所有的CompletableFuture和额外的CompletableFuture放在`anyOf()`方法中，这样一旦额外的CompletableFuture完成，说明产生异常了；否则就需要等待所有的CompletableFuture完成。
