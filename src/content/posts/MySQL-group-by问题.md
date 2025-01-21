---
title: MySQL ONLY_FULL_GROUP_BY模式配置与SQL优化指南
author: Jinx
date: 2023-12-06
slug: mysql-only-full-group-by-configuration
featured: true
draft: false
categories:
  - database
tags:
  - GROUP BY
  - SQL优化
  - MySQL配置
  - sql_mode
description: 深入解析MySQL ONLY_FULL_GROUP_BY模式导致的查询报错问题，包括sql_mode配置说明、临时与永久解决方案，以及GROUP BY语句的最佳实践和优化建议
---

某天，生产报错，故搜索原因。

<!-- more -->

![image.png](/static/img/17886b52ba03a1a3bd91e40c5f55ac95.image.webp)
得到数据库重启，原来的配置文件不生效了，即sql_mode标准化。

ONLY_FULL_GROUP_BY官方说明：
Reject queries for which the select list, HAVING condition, or ORDER BY list refer to nonaggregated columns that are neither named in the GROUP BY clause nor are functionally dependent on (uniquely determined by) GROUP BY columns.

拒绝选择列表、 HAVING条件或ORDER BY列表引用非聚合列的查询，这些列既不在GROUP BY子句中命名，也不在功能上依赖于（唯一确定的） GROUP BY列。（谷歌翻译）

## 原因分析

假设你安装的是MySql 5.7以后的版本，比如5.7.21，默认情况下，sql_mode里的only_full_group_by是被打开的：

```sql
select version();

select @@GLOBAL.sql_mode;
```

因为是老项目，可能之前项目中的某些sql书写并不规范。

## 解决方法

### 1.命令行更改数据库的sqlMode

命令更改

```sql
SET @@SESSION.sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
SET @@SESSION.sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

```

注意事项：如果仍然报错，请打开新会话执行查询语句。

还要值得注意的是，上面关闭only_full_group_by的方式是临时的，如果重启了MySql服务器，only_full_group_by又被打开了.

### 2.修改配置文件

可以通过在/etc/my.cnf文件添加以下内容，来永久关闭only_full_group_by：

```sh
sql_mode = "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
```

修改完毕后，记得重启MySql。

如果重启后也不会生效，检查下sql_mode的位置是不是不对（放在最后是不会生效的）：

![image.png](/static/img/885b983bd84925dc818cae41a39afd5b.image.webp)

### 3.重构问题代码

- 将非聚合列添加到GROUP BY子句中：将SELECT语句中的非聚合列添加到GROUP BY子句中，以确保每个分组都包含这些列的唯一值。

```sql
SELECT column1, column2, SUM(column3)
FROM your_table
GROUP BY column1, column2;
```

遇到稍微复杂的查询参考

```sql
SELECT
  CASE
    WHEN zd.order_type = 0 THEN zp.supplier_id
    ELSE msup.supplier_id
  END AS supplierId,
  SUM(sales_amount) AS totalSales
FROM
  your_table
GROUP BY
  CASE
    WHEN zd.order_type = 0 THEN zp.supplier_id
    ELSE msup.supplier_id
  END;
```

- 使用聚合函数：将非聚合列作为聚合函数的参数，以便在每个分组中对它们进行聚合计算。

```sql
SELECT column1, column2, MAX(column3)
FROM your_table
GROUP BY column1, column2;
```

聚合函数包括SUM(),MIN(),MAX(),AVG(),COUNT(),GROUP_CONCAT

- 使用ANY_VALUE函数：如果你确定在每个分组中非聚合列的值是相同的，可以使用ANY_VALUE函数来选择任意一个值。

```sql
SELECT column1, column2, ANY_VALUE(column3)
FROM your_table
GROUP BY column1, column2;
```
