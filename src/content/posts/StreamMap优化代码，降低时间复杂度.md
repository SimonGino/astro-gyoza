---
title: 使用Stream Map 优化代码，降低时间复杂度
author: Jinx
date: 2025-01-10
slug: stream-map-optimization
featured: false
draft: false
category: java
tags:
  - Stream
  - Map
description: 详细介绍Stream Map 优化代码，降低时间复杂度
---

<!-- more -->

# Stream Map 优化代码，降低时间复杂度

## 场景介绍

我们的项目中有一个常见的需求：在两张表中查找相同 ID 的数据。最初，我们采用的是两层 `for` 循环嵌套的方式来实现这一功能。这种方法虽然直观，但在数据量较大时，性能问题就变得十分明显。具体来说，我们有两个列表：`userList` 和 `userMemoList`。我们需要遍历 `userList`，根据每个用户的 `userId`，从 `userMemoList` 中查找并取出对应的 `content` 值进行后续处理。

## 未优化的代码

最初的实现方式非常直接，通过两层 `for` 循环进行匹配。这种方法的时间复杂度为 O(n\*m)，其中 n 和 m 分别为两个列表的长度。在数据量较大时，这种嵌套循环会导致性能急剧下降。具体代码如下：

```java
public static void nestedLoop(List<User> userTestList, List<UserMemo> userMemoTestList) {
    for (User user : userTestList) {
        Long userId = user.getUserId();
        for (UserMemo userMemo : userMemoTestList) {
            if (userId.equals(userMemo.getUserId())) {
                String content = userMemo.getContent();
                // System.out.println("模拟数据content 业务处理......" + content); // 避免打印影响测试结果
            }
        }
    }
}
```

这段代码在处理大量数据时，耗时非常长，达到了数万毫秒。

## break 优化

新同事首先尝试了一种简单的优化方法：当每个 `userId` 在 `userMemoList` 中只有一条数据时，找到匹配项后直接 `break` 跳出内循环。这种方法虽然仍然需要遍历较多次，但相比嵌套循环略有改善。具体代码如下：

```java
public static void breakOptimizedLoop(List<User> userTestList, List<UserMemo> userMemoTestList) {
    for (User user : userTestList) {
        Long userId = user.getUserId();
        for (UserMemo userMemo : userMemoTestList) {
            if (userId.equals(userMemo.getUserId())) {
                String content = userMemo.getContent();
                // System.out.println("模拟数据content 业务处理......" + content); // 避免打印影响测试结果
                break; // 找到匹配项后跳出内循环
            }
        }
    }
}
```

## 使用 Map 优化

新同事的真正魔法在于他引入了 `Map` 来优化代码。他首先将 `userMemoList` 转换为一个 `Map`，其中 `userId` 作为键，`content` 作为值。这样，在遍历 `userList` 时，可以直接通过 `Map` 的 `get` 方法快速获取对应的 `content` 值。这种方法的时间复杂度显著降低，通常在数百毫秒级别。具体代码如下：

```java
public static void mapOptimizedLoop(List<User> userTestList, List<UserMemo> userMemoTestList) {
    Map<Long, String> contentMap = userMemoTestList.stream().collect(Collectors.toMap(UserMemo::getUserId, UserMemo::getContent));

    for (User user : userTestList) {
        Long userId = user.getUserId();
        String content = contentMap.get(userId);

        if (StringUtils.hasLength(content)) {
            // System.out.println("模拟数据content 业务处理......" + content); // 避免打印影响测试结果
        }
    }
}
```

## 原理分析

两层 `for` 循环嵌套的时间复杂度为 O(n\*m)，其中 n 和 m 分别为两个列表的长度。使用 `Map` 后，`get` 操作的时间复杂度接近 O(1)，整体时间复杂度降为 O(n+m)，避免了内循环的重复遍历。`HashMap` 的 `get` 方法内部使用了 `getNode` 方法来查找键值对。`getNode` 方法利用哈希表结构，快速定位到目标键值对。虽然在极端情况下（所有键的哈希值都相同），`getNode` 的时间复杂度会退化为 O(n)，但在实际应用中，哈希冲突的概率很低，`HashMap` 的 `get` 操作效率通常很高。因此无需过于担心 O(n) 的最坏情况。

## 总结

通过这次优化，我们不仅显著提高了代码的执行效率，还学到了一些宝贵的优化技巧。以下是几种优化方法的对比：

| 优化方法           | 时间复杂度 | 适用场景                           | 性能提升                 |
| ------------------ | ---------- | ---------------------------------- | ------------------------ |
| 未优化（嵌套循环） | O(n \* m)  | 数据量较小时可接受                 | 最低，耗时数万毫秒       |
| `break` 优化       | O(n \* m)  | 数据量较小，且 `userId` 唯一时适用 | 略有提升，减少内循环次数 |
| `Map` 优化         | O(n + m)   | 数据量大，且需要高效匹配时适用     | 显著提升，耗时百毫秒级   |
