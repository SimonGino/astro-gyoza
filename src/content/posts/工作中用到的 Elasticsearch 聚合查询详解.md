---
title: 工作中用到的 Elasticsearch 聚合查询详解
author: Jinx
date: 2025-08-23
slug: elasticsearch-aggs-examples
featured: false
draft: false
category: elasticsearch
tags:
  - Elasticsearch
  - 聚合
  - 查询语句
  - date_histogram
  - terms
  - cardinality
  - value_count
description: 基于实际示例系统讲解 Elasticsearch 聚合（aggs），包括按天的日期直方图、terms 分组、value_count 计数与 cardinality 去重计数的用途与参数，并给出层级结构与返回样例，便于快速上手与实战应用。
---

# Elasticsearch 聚合(aggs)详细说明

## 1. 聚合的基本概念

聚合类似于SQL中的GROUP BY + 聚合函数，用于对数据进行分组、统计、计算等操作。

## 2. 查询中各个聚合的含义

### 🕐 `daily_stats` - 日期直方图聚合

```json
"daily_stats": {
  "date_histogram": {
    "field": "createTime",
    "calendar_interval": "day",
    "time_zone": "Asia/Shanghai",
    "format": "yyyy-MM-dd"
  }
}
```

**作用：**

- 按天对数据进行分桶(bucket)
- 每一天的数据会被放入一个桶中
- 相当于SQL的：`GROUP BY DATE(createTime)`

**参数说明：**

- `field`: 用于分桶的时间字段
- `calendar_interval`: 按日历天分桶
- `time_zone`: 时区设置
- `format`: 日期格式

### 📊 `createName_stats` - Terms聚合

```json
"createName_stats": {
  "terms": {
    "field": "createName.keyword",
    "size": 100
  }
}
```

**作用：**

- 在每个日期桶内，再按createName分组
- 找出每天各个createName的数据
- 相当于SQL的：`GROUP BY createName`

**参数说明：**

- `field`: 分组字段
- `size`: 返回前100个不同的createName

### 🔢 `call_count` - 值计数聚合

```json
"call_count": {
  "value_count": {
    "field": "id.keyword"
  }
}
```

**作用：**

- 统计每个分组中id字段的数量（非空值）
- 相当于SQL的：`COUNT(id)`

### 👥 `unique_users` - 基数聚合

```json
"unique_users": {
  "cardinality": {
    "field": "userId.keyword"
  }
}
```

**作用：**

- 统计每个分组中userId的唯一值数量
- 相当于SQL的：`COUNT(DISTINCT userId)`

## 3. 整体查询逻辑

```
第一层：按天分组 (daily_stats)
├── 2025-08-01
│   ├── 第二层：按createName分组 (createName_stats)
│   │   ├── createName1
│   │   │   ├── call_count: 调用次数
│   │   │   └── unique_users: 独立用户数
│   │   └── createName2
│   │       ├── call_count: 调用次数
│   │       └── unique_users: 独立用户数
│   ├── total_calls: 当天总调用数
│   └── total_unique_users: 当天总独立用户数
├── 2025-08-02
│   └── ... (同样的结构)
└── ...
```

## 4. 返回结果示例

```json
{
  "aggregations": {
    "daily_stats": {
      "buckets": [
        {
          "key_as_string": "2025-08-01",
          "key": 1722470400000,
          "doc_count": 150,
          "createName_stats": {
            "buckets": [
              {
                "key": "张三",
                "doc_count": 80,
                "call_count": { "value": 80 },
                "unique_users": { "value": 15 }
              },
              {
                "key": "李四",
                "doc_count": 70,
                "call_count": { "value": 70 },
                "unique_users": { "value": 12 }
              }
            ]
          },
          "total_calls": { "value": 150 },
          "total_unique_users": { "value": 25 }
        }
      ]
    }
  }
}
```

## 5. 聚合的层次关系

- **父聚合**：`daily_stats` (按天分组)
  - **子聚合**：`createName_stats` (按创建人分组)
    - **孙聚合**：`call_count` (调用次数统计)
    - **孙聚合**：`unique_users` (独立用户数统计)
  - **子聚合**：`total_calls` (每天总调用数)
  - **子聚合**：`total_unique_users` (每天总独立用户数)

## 6. 常用聚合类型

| 聚合类型         | 用途           | SQL等价                 |
| ---------------- | -------------- | ----------------------- |
| `terms`          | 按字段值分组   | `GROUP BY`              |
| `date_histogram` | 按时间间隔分组 | `GROUP BY DATE()`       |
| `value_count`    | 计数非空值     | `COUNT(field)`          |
| `cardinality`    | 唯一值计数     | `COUNT(DISTINCT field)` |
| `sum`            | 求和           | `SUM(field)`            |
| `avg`            | 平均值         | `AVG(field)`            |
| `max/min`        | 最大/最小值    | `MAX(field)/MIN(field)` |

## 7.完整json

```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "tenantId.keyword": "CK0450"
          }
        },
        {
          "range": {
            "createTime": {
              "gte": "2025-08-01T00:00:00",
              "lte": "2025-08-31T23:59:59",
              "time_zone": "Asia/Shanghai"
            }
          }
        }
      ]
    }
  },
  "aggs": {
    "daily_stats": {
      "date_histogram": {
        "field": "createTime",
        "calendar_interval": "day",
        "time_zone": "Asia/Shanghai",
        "format": "yyyy-MM-dd"
      },
      "aggs": {
        "createName_stats": {
          "terms": {
            "field": "createName.keyword",
            "size": 100
          },
          "aggs": {
            "call_count": {
              "value_count": {
                "field": "id.keyword"
              }
            },
            "unique_users": {
              "cardinality": {
                "field": "userId.keyword"
              }
            }
          }
        },
        "total_calls": {
          "value_count": {
            "field": "id.keyword"
          }
        },
        "total_unique_users": {
          "cardinality": {
            "field": "userId.keyword"
          }
        }
      }
    }
  }
}
```
