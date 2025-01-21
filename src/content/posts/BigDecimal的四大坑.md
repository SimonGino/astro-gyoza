---
author: Jinx
date: 2024-07-12
title: 不掌握BigDecimal的四大坑你敢用吗
slug: four-major-pitfalls-of-bigdecimal-usage
featured: true
draft: false
categories:
  - java
description: Dare You Use BigDecimal Without Knowing Its Four Major Pitfalls?
---

### 大纲：不掌握BigDecimal的四大坑你敢用吗？

#### 1. 浮点精度的坑

- **问题描述**：使用`BigDecimal`进行比较时，可能会遇到浮点精度的问题。
- **示例代码**：
  ```java
  BigDecimal num1 = new BigDecimal("0.1");
  BigDecimal num2 = new BigDecimal("0.10");
  System.out.println(num1.equals(num2)); // false
  System.out.println(num1.compareTo(num2)); // 0
  ```
- **原因分析**：`equals`方法不仅比较值，还比较精度。如果精度不同，即使数值相同，`equals`也会返回`false`。
- **解决方法**：使用`compareTo`方法进行数值比较，使用`equals`方法进行严格精度比较。

#### 2. 设置精度的坑

- **问题描述**：在进行除法运算时，如果不设置精度，可能会抛出`ArithmeticException`。
- **示例代码**：
  ```java
  BigDecimal num1 = new BigDecimal("1");
  BigDecimal num2 = new BigDecimal("3");
  BigDecimal result = num1.divide(num2); // 默认舍入模式为 UNNECESSARY，会抛出 ArithmeticException
  ```
- **异常原因**：默认舍入模式为`UNNECESSARY`，当结果无法精确表示时会抛出异常。
- **解决方法**：设置精度和舍入模式：
  ```java
  BigDecimal result = num1.divide(num2, 2, RoundingMode.HALF_UP); // 输出：0.33
  ```

#### 3. 初始化的坑

- **问题描述**：使用`double`构造`BigDecimal`时会丢失精度。
- **示例代码**：
  ```java
  BigDecimal num = new BigDecimal(0.1); // 使用双精度浮点数构造
  System.out.println(num); // 输出: 0.1000000000000000055511151231257827021181583404541015625
  BigDecimal num2 = new BigDecimal("0.1"); // 使用字符串构造
  System.out.println(num2); // 输出: 0.1
  ```
- **原因分析**：`double`在内存中是以二进制形式存储的，转换为十进制时会有精度损失。
- **解决方法**：使用字符串构造方法或`BigDecimal.valueOf`方法初始化。

#### 4. 转字符串的坑

- **问题描述**：`toString()`方法可能会使用科学计数法表示大数。
- **示例代码**：
  ```java
  BigDecimal a = BigDecimal.valueOf(89382389312389594.33822312317952678768725);
  System.out.println(a.toString()); // 输出：8.93823893123896E+16
  String str = a.setScale(2, RoundingMode.HALF_UP).toString();
  System.out.println(str); // 输出: 89382389312389600.00
  ```
- **解决方法**：
  - 使用`toPlainString()`方法，不使用科学计数法。
  - 使用`toEngineeringString()`方法，使用工程计数法。

#### 5. 总结

- **推荐使用场景**：金融、货币、税收等需要高精度计算的场景。
- **性能考虑**：使用`BigDecimal`可能会带来性能损失，需谨慎使用。
- **最佳实践**：
  - 使用`compareTo`进行数值比较。
  - 在进行除法运算时设置精度和舍入模式。
  - 使用字符串构造方法或`BigDecimal.valueOf`进行初始化。
  - 使用`toPlainString`或`toEngineeringString`进行字符串转换。

通过以上分析，可以更好地理解和使用`BigDecimal`，避免在使用过程中遇到的常见问题。
