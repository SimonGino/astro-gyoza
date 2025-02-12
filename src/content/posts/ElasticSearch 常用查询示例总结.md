---
title: ElasticSearch 常用查询示例指南
author: Jinx
date: 2024-12-25
slug: elasticsearch-query-examples-guide
featured: false
draft: false
category: database
tags:
  - ElasticSearch
  - 搜索引擎
  - 数据查询
  - 性能优化
description: 总结了19个常用的ElasticSearch查询示例，包含基础查询、结构化查询、高级查询和聚合查询等，并提供性能优化建议和错误处理方案
---

<!-- more -->

# ElasticSearch 常用查询示例指南

## 简介

本文总结了19个常用的ElasticSearch查询示例，包含具体的API调用和请求体结构，帮助开发者快速掌握ElasticSearch的查询功能。

## 基础查询

### 1. 基本匹配查询

```json
POST /index/_search
{
    "query": {
        "match" : {
            "title" : "elasticsearch guide"
        }
    },
    "size": 2,
    "from": 0,
    "_source": ["title", "summary", "publish_date"],
    "highlight": {
        "fields" : {
            "title" : {}
        }
    }
}
```

### 2. 多字段查询

```json
POST /index/_search
{
    "query": {
        "multi_match" : {
            "query": "elasticsearch guide",
            "fields": ["title", "summary^3"]
        }
    }
}
```

- `^3`表示提升该字段的权重

### 3. 布尔查询

```json
POST /index/_search
{
    "query": {
        "bool": {
            "must": [
                { "match": { "title": "elasticsearch" }},
                { "match": { "authors": "clinton gormely" }}
            ],
            "must_not": [
                { "match": { "authors": "radu gheorge" }}
            ],
            "should": [
                { "match": { "title": "solr" }}
            ]
        }
    }
}
```

## 结构化查��

### 4. 词条查询

```json
POST /index/_search
{
    "query": {
        "term": {
            "publisher": "manning"
        }
    },
    "sort": [
        { "publish_date": {"order": "desc"}},
        { "title": { "order": "desc" }}
    ]
}
```

### 5. 范围查询

```json
POST /index/_search
{
    "query": {
        "range": {
            "publish_date": {
                "gte": "2015-01-01",
                "lte": "2015-12-31"
            }
        }
    }
}
```

## 高级查询

### 6. 模糊查询

```json
POST /index/_search
{
    "query": {
        "multi_match": {
            "query": "comprihensiv guide",
            "fields": ["title", "summary"],
            "fuzziness": "AUTO"
        }
    }
}
```

### 7. 短语匹配查询

```json
POST /index/_search
{
    "query": {
        "match_phrase": {
            "summary": {
                "query": "search engine",
                "slop": 3
            }
        }
    }
}
```

### 8. 函数评分查询

```json
POST /index/_search
{
    "query": {
        "function_score": {
            "query": {
                "multi_match": {
                    "query": "search engine",
                    "fields": ["title", "summary"]
                }
            },
            "field_value_factor": {
                "field": "num_reviews",
                "modifier": "log1p",
                "factor": 2
            }
        }
    }
}
```

## 过滤和聚合

### 9. 过滤查询

```json
POST /index/_search
{
    "query": {
        "bool": {
            "must": {
                "match": {
                    "title": "elasticsearch"
                }
            },
            "filter": {
                "range": {
                    "num_reviews": {
                        "gte": 20
                    }
                }
            }
        }
    }
}
```

### 10. 聚合查询

```json
POST /index/_search
{
    "size": 0,
    "aggs": {
        "group_by_publisher": {
            "terms": {
                "field": "publisher"
            }
        }
    }
}
```

## 性能优化建议

1. **查询优化**

   - 使用过滤器代替查询，过滤器结果可以被缓存
   - 避免使用通配符开头的模糊查询
   - 合理设置分片数量

2. **索引优化**

   - 根据业务需求设置合适的分词器
   - 合理设置字段类型和映射
   - 使用别名进行索引管理

3. **系统优化**
   - 合理设置内存和JVM参数
   - 定期进行数据优化和合并
   - 监控集群状态

## 常见错误处理

1. **查询超时**

```json
POST /index/_search
{
    "timeout": "10s",
    "query": { ... }
}
```

2. **结果深度分页**

```json
POST /index/_search
{
    "from": 0,
    "size": 50,
    "query": { ... },
    "sort": { ... }
}
```

## 实用工具

1. **Kibana Dev Tools** - 用于测试和调试查询
2. **Elasticsearch Head** - 集群管理和数据可视化
3. **Cerebro** - 集群监控工具

## 总结

ElasticSearch提供了强大而灵活的查询API，可以满足各种复杂的搜索需求。开发者应该：

- 深入理解各种查询类型的特点和使用场景
- 注意查询性能优化
- 合理使用过滤器和缓存机制
- 建立完善的监控和维护机制

## 参考资料

1. [Elasticsearch Official Documentation](https://www.elastic.co/guide/index.html)
2. [Elasticsearch: The Definitive Guide](https://www.elastic.co/guide/en/elasticsearch/guide/current/index.html)
3. [Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)

---

_注：本文示例基于ElasticSearch 7.x版本，不同版本的语法可能略有差异。建议参考官方文档获取最新信息。_
