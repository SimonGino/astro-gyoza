---
title: Docker部署Elasticsearch与Kibana配置指南
author: Jinx
date: 2024-08-23
slug: docker-elasticsearch-kibana-setup
featured: true
draft: false
category: docker
tags:
  - ES集群
  - Kibana
  - IK分词器
  - 容器网络
description: 详细介绍使用Docker部署Elasticsearch和Kibana的完整流程，包括单节点ES配置、Kibana连接设置、IK分词器安装以及容器网络管理等关键步骤的最佳实践
---

# Docker安装ES/Kibana

## 部署单点ES

### Docker命令

```shell
# 创建网络
docker network create es-net
# 拉取镜像
docker pull elasticsearch:7.17.5
docker pull kibana:7.17.5
# 运行
docker run -d \
    --name es \
    -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
    -e "discovery.type=single-node" \
    -v es-data:/usr/share/elasticsearch/data \
    -v es-plugins:/usr/share/elasticsearch/plugins \
    --privileged \
    --network es-net \
    -p 9200:9200 \
    -p 9300:9300 \
elasticsearch:7.17.5
```

下面是各个参数的含义解释和作用：

- `-d`：以后台模式运行容器。
- `--name es`：为容器指定一个名称为 "es"。
- `-e "ES_JAVA_OPTS=-Xms512m -Xmx512m"`：设置 Elasticsearch 的 Java 虚拟机选项，指定初始堆大小为 512MB，最大堆大小也为 512MB。
- `-e "discovery.type=single-node"`：设置 Elasticsearch 的发现类型为单节点模式，这意味着它将以单节点模式启动，不会尝试与其他节点进行通信。
- `-v es-data:/usr/share/elasticsearch/data`：将名为 “es-data” 的 Docker 卷挂载到容器内的 `/usr/share/elasticsearch/data` 目录，用于持久化 Elasticsearch 的数据。
- `-v es-plugins:/usr/share/elasticsearch/plugins`：将名为 “es-plugins” 的 Docker 卷挂载到容器内的 `/usr/share/elasticsearch/plugins` 目录，用于安装 Elasticsearch 插件。
- `--privileged`：以特权模式运行容器，这允许容器内的进程获得更高的权限。
- `--network es-net`：将容器连接到名为 “es-net” 的网络，这样容器内的服务可以通过网络进行通信。
- `-p 9200:9200`：将容器的 9200 端口映射到主机的 9200 端口，这样可以通过主机的 IP 地址和端口访问 Elasticsearch 的 HTTP API。
- `-p 9300:9300`：将容器的 9300 端口映射到主机的 9300 端口，这样可以通过主机的 IP 地址和端口访问 Elasticsearch 的节点间通信。

### 测试

在浏览器中输入：http://localhost:9200 即可看到elasticsearch的响应结果。

## 部署kibana

### 命令

```shell
docker run -d --name kibana -e ELASTICSEARCH_HOSTS=http://es:9200 --network=es-net -p 5601:5601 kibana:7.17.5
```

参数说明：

- –network es-net ：加入一个名为es-net的网络中，与elasticsearch在同一个网络中
- -e ELASTICSEARCH_HOSTS=http://es:9200"：设置elasticsearch的地址，因为kibana已经与elasticsearch在一个网络，因此可以用容器名直接访问elasticsearch
- -p 5601:5601：端口映射配置

此时，在浏览器输入地址访问：http://localhost:5601，即可看到结果.

### DevTools

kibana中���供了一个DevTools界面，地址：http://localhost:5601/app/dev_tools#/console

这个界面中可以编写DSL来操作elasticsearch。并且对DSL语句有自动补全功能。

## 安装IK分词器

```shell
docker cp /Users/shizitoumengchong/Documents/elasticsearch-analysis-ik-7.17.5.zip 3af12e068f16:/usr/share/elasticsearch
docker exec -it es /bin/bash
elasticsearch-plugin install file:/usr/share/elasticsearch/elasticsearch-analysis-ik-7.17.5.zip
# 选择Y回车
```

#### 重启容器

```shell
# 4、重启容器
docker restart es

# 查看es日志
docker logs -f es
```

```shell
curl --location --request POST 'http://localhost:9200/_analyze?pretty' \
--header 'Token: dd119348-0672-4ab8-9359-7a9c3ac30a6c' \
--header 'Digi-Middleware-Auth-App: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImthaS1za2MiLCJzaWQiOjB9.hQL5afikrokZJPJ4mUldcLsgmJXQMxegUEWI4Apyzrg' \
--header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
--header 'Content-Type: application/json' \
--data-raw '{
  "analyzer": "ik_max_word",
  "text": ["我爱我的祖国，并且我还深爱着你"]
}'
```

```shell
curl --location --request POST 'http://localhost:9200/_analyze?pretty' \
--header 'Token: dd119348-0672-4ab8-9359-7a9c3ac30a6c' \
--header 'Digi-Middleware-Auth-App: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ImthaS1za2MiLCJzaWQiOjB9.hQL5afikrokZJPJ4mUldcLsgmJXQMxegUEWI4Apyzrg' \
--header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
--header 'Content-Type: application/json' \
--data-raw '{
  "analyzer": "ik_smart",
  "text": ["我爱我的祖国，并且我还深爱着你"]
}'
```

**source**

https://www.cnblogs.com/auguse/articles/17727671.html
