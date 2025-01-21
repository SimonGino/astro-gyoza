---
title: Postman调用Elasticsearch API指南
author: Jinx
date: 2024-01-01
slug: postman-elasticsearch-api-guide
featured: true
draft: false
categories:
  - tools
tags:
  - postman
  - API测试
  - 数据查询
description: 介绍如何使用Postman工具调用Elasticsearch API进行数据查询和索引管理，包括常用查询示例和响应结果解析
---

# postman调用ES获取数据

Elasticsearch会返回一个包含索引信息的表格

### 获取所有的索引

```sh
GET /_cat/indices?v
```

结果

```
health status index                uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   .security-7          p01Tv9JvR1SjrgVh2Ivx8Q   1   1          6            0     39.4kb         19.7kb
green  open   prj_merak_tb_mobile  GOrHT6KCRGKh-2SAMD0sCQ   3   0   15470710            0      5.5gb          5.5gb
green  open   prj_merak_test       ZpO-NsjKQWOCkWsaltkiSQ   3   0      32805            0     21.5mb         21.5mb
green  open   prj_merak_log        eeOnXgapT72UrVOcIXjoMQ   1   0    4101462            0    294.4mb        294.4mb
green  open   prj_merak_la_mobile  bsFeEjsFSvG5ZbqlRvEHgw   3   0    9862645         4700      3.6gb          3.6gb
green  open   prj_merak_kfc_mobile B2kldQt8S-S5S2auqVsfLQ   3   0 1131193667      5565934    427.9gb        427.9gb
green  open   prj_merak_ph_mobile  QNIEGQCgTrS0k6rB21PHgg   3   0  193753622            0     70.9gb         70.9gb
```

### 查询索引信息

```sh
GET /prj_merak_la_mobile
```

```json
{
  "prj_merak_la_mobile": {
    "aliases": {},
    "mappings": {
      "properties": {
        "encrypt_mobile": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "mobile": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "user_code": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "yumid": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        }
      }
    },
    "settings": {
      "index": {
        "creation_date": "1705374258041",
        "number_of_shards": "3",
        "number_of_replicas": "0",
        "uuid": "bsFeEjsFSvG5ZbqlRvEHgw",
        "version": {
          "created": "7060299"
        },
        "provided_name": "prj_merak_la_mobile"
      }
    }
  }
}
```

这个JSON包含了有关名为"prj_merak_la_mobile"的Elasticsearch索引的详细信息。让我来解释一下每个部分的含义：

1. "prj_merak_la_mobile": 这是索引的名称。

2. "aliases": 这里列出了索引的别名，但在这个例子中是空的，表示该索引没有别名。

3. "mappings": 这个部分定义了索引的映射(mapping)，即索引中包含的字段以及它们的数据类型。在这个例子中，包含了"encrypt_mobile"、"mobile"、"user_code"和"yumid"这几个字段，它们的类型都是"text"，并且每个字段还有一个名为"keyword"的子字段，类型为"keyword"，并设置了"ignore_above"参数。

4. "settings": 这个部分包含了索引的设置信息，包括索引的创建日期、分片数量、副本数量、唯一标识符(uuid)等。在这个例子中，索引"prj_merak_la_mobile"有3个分片，0个副本。

ignore_above是Elasticsearch中的一个设置，用于限制keyword类型字段中单个项的长度。如果字段中的项超过了ignore_above设置的长度，那么该项将不会被索引或存储。这个设置通常用于避免索引过长的关键字，以保持索引的性能和存储效率。ignore_above的值是字符数，但需要注意的是，Lucene是按字节计数的，因此如果使用UTF-8文本（包含非ASCII字符），可能需要将限制设置为32766的四分之一（即8191），以避免超出Lucene的字节长度限制。

### 查询索引下的10条数据

```sh
GET /prj_merak_la_mobile/_search
{
  "size": 10,
  "query": {
    "match_all": {}
  }
}
```

```json
{
  "took": 9,
  "timed_out": false,
  "_shards": {
    "total": 3,
    "successful": 3,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 10000,
      "relation": "gte"
    },
    "max_score": 1.0,
    "hits": [
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_0000ec2a9e6d59a5417307a3fbcdc381",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_0000ec2a9e6d59a5417307a3fbcdc381",
          "user_code": "\\N",
          "encrypt_mobile": "0000ec2a9e6d59a5417307a3fbcdc381",
          "mobile": "18113387365"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_00011ecdd2226ed942d5efd926b249b1",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_00011ecdd2226ed942d5efd926b249b1",
          "user_code": "\\N",
          "encrypt_mobile": "00011ecdd2226ed942d5efd926b249b1",
          "mobile": "15958602815"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_00026c42da5c30490711f7a9017a13a7",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_00026c42da5c30490711f7a9017a13a7",
          "user_code": "\\N",
          "encrypt_mobile": "00026c42da5c30490711f7a9017a13a7",
          "mobile": "16225722370"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_0003170f05dced22c86199ac99fc118d",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_0003170f05dced22c86199ac99fc118d",
          "user_code": "61044743226252978316",
          "encrypt_mobile": "0003170f05dced22c86199ac99fc118d",
          "mobile": "15208159925"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_0003e2d934b0efc519e2a77599626855",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_0003e2d934b0efc519e2a77599626855",
          "user_code": "25729164245147813687",
          "encrypt_mobile": "0003e2d934b0efc519e2a77599626855",
          "mobile": "13078965473"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_0005efe15b879a8374f836be8816af04",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_0005efe15b879a8374f836be8816af04",
          "user_code": "\\N",
          "encrypt_mobile": "0005efe15b879a8374f836be8816af04",
          "mobile": "18672190703"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_000b1d9a854e95a84e298894cdd4c718",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_000b1d9a854e95a84e298894cdd4c718",
          "user_code": "\\N",
          "encrypt_mobile": "000b1d9a854e95a84e298894cdd4c718",
          "mobile": "15918155502"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_000cc6662a929c3d31e2c2eb06dcd30c",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_000cc6662a929c3d31e2c2eb06dcd30c",
          "user_code": "\\N",
          "encrypt_mobile": "000cc6662a929c3d31e2c2eb06dcd30c",
          "mobile": "15011728972"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_000db279ce40fe55cd77f5e50f947de3",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_000db279ce40fe55cd77f5e50f947de3",
          "user_code": "74998250214301485599",
          "encrypt_mobile": "000db279ce40fe55cd77f5e50f947de3",
          "mobile": "15900528985"
        }
      },
      {
        "_index": "prj_merak_la_mobile",
        "_type": "_doc",
        "_id": "mobile_000e386cc3f867325ab744471a640e66",
        "_score": 1.0,
        "_source": {
          "yumid": "mobile_000e386cc3f867325ab744471a640e66",
          "user_code": "\\N",
          "encrypt_mobile": "000e386cc3f867325ab744471a640e66",
          "mobile": "13501676855"
        }
      }
    ]
  }
}
```

这个返回的内容是Elasticsearch查询的结果，让我来解释一下每个部分的含义：

1. "took": 9，这表示查询所花费的时间，单位是毫秒。

2. "timed_out": false，这表示查询是否超时，这里显示为false，表示查询没有超时。

3. "\_shards": 这个部分包含了关于分片的信息，包括总分片数、成功的分片数、跳过的分片数和失败的分片数。

4. "hits": 这个部分包含了查询匹配的文档结果。

   - "total": {"value": 10000, "relation": "gte"}，这表示匹配的总文档数，这里是10000个文档。

   - "max_score": 1.0，这是匹配到的文档中最高的得分。

   - "hits": 这是一个包含了匹配的文档的数组，每个文档包括了"\_index"、"\_type"、"\_id"、"\_score"和"\_source"等字段。

     - "\_index"：文档所属的索引名称。
     - "\_type"：文档的类型。
     - "\_id"：文档的唯一标识符。
     - "\_score"：文档的得分。
     - "\_source"：文档的实际内容，包括了具体的字段和对应的数值。

### 根据doc_id查询数据

在Elasticsearch中，每个文档都有一个唯一的标识符，称为doc_id（文档ID）。doc_id用于唯一标识文档，并且可以用于快速检索特定的文档。以下是关于doc_id的一些重要信息：

作用：

1. 唯一标识：doc_id用于唯一标识文档，确保每个文档在索引中都有一个唯一的标识符。
2. 快速检索：通过doc_id，可以快速检索特定的文档，而不必执行全文搜索。

如何查询：
你可以使用Get API来查询具有特定doc_id的文档。以下是一个示例，演示如何使用Get API来检索具有特定doc_id的文档：

```json
GET /your_index_name/_doc/your_doc_id
```

结果:

```json
{
  "_index": "prj_merak_la_mobile",
  "_type": "_doc",
  "_id": "mobile_0000ec2a9e6d59a5417307a3fbcdc381",
  "_version": 1,
  "_seq_no": 0,
  "_primary_term": 1,
  "found": true,
  "_source": {
    "yumid": "mobile_0000ec2a9e6d59a5417307a3fbcdc381",
    "user_code": "\\N",
    "encrypt_mobile": "0000ec2a9e6d59a5417307a3fbcdc381",
    "mobile": "18113387365"
  }
}
```

- "\_index": "prj_merak_la_mobile"：这是索引的名称，表示这个文档属于名为"prj_merak_la_mobile"的索引。

- "\_type": "\_doc"：这是文档的类型，"\_doc"是Elasticsearch 7.x版本之后的默认类型。

- "\_id": "mobile_0000ec2a9e6d59a5417307a3fbcdc381"：这是文档的唯一标识符，即文档ID。

- "\_version": 1：这是文档的版本号，每次文档被更新时，版本号都会增加。

- "\_seq_no": 0：这是文档在分片内的序列号，用于实现并发控制。

- "\_primary_term": 1：这是文档所在的主分片的主要期号。

- "found": true：这表示文档是否被找到，值为true表示文档存在。

- "\_source": {...}：这是文档的实际内容，包含了文档的字段和对应的数值。

在"\_source"字段中：

- "yumid"、"user_code"、"encrypt_mobile"、"mobile"：这些是文档中的字段名。
- "mobile_0000ec2a9e6d59a5417307a3fbcdc381"、"\N"、"0000ec2a9e6d59a5417307a3fbcdc381"、"18113387365"：这些是对应字段的值。

### 有关索引分片的详细信息，包括主分片和复制分片的分布情况

```sh
GET /_cat/shards/your_index_name
```

```
prj_merak_la_mobile 1 p STARTED 3287790 1.2gb 172.21.52.233 merak-node-3
prj_merak_la_mobile 2 p STARTED 3288965 1.1gb 172.25.88.160 merak-node-1
prj_merak_la_mobile 0 p STARTED 3285890 1.2gb 172.21.52.233 merak-node-2
```

这是Elasticsearch的分片信息的一部分，它包含了有关索引分片的详细信息。让我来解释一下这些信息的含义：

- prj_merak_la_mobile：这是索引的名称。
- 1, 2, 0：这是分片的编号，分片编号从0开始。
- p：表示这是主分片（primary shard）。
- STARTED：表示分片状态为启动。
- 3287790, 3288965, 3285890：这是分片的文档数量。
- 1.2gb, 1.1gb, 1.2gb：这是分片的存储大小。
- 172.21.52.233, 172.25.88.160, 172.21.52.233：这是分片所在的节点的IP地址。
- merak-node-3, merak-node-1, merak-node-2：这是分片所在的节点的名称。

综上所述，这些信息显示了索引中每个分片的详细信息，包括分片编号、状态、文档数量、存储大小以及所在的节点信息。
