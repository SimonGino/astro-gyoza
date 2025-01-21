---
title: Docker容器配置与部署实践指南
author: Jinx
date: 2024-07-01
slug: docker-container-configuration-guide
featured: true
draft: false
categories:
  - docker
tags:
  - MinIO
  - MariaDB
  - 容器配置
  - 数据持久化
description: 详细介绍常用Docker容器的配置与部署方法，包括MinIO对象存储、MariaDB数据库等服务的环境变量配置、数据卷挂载以及网络端口映射的最佳实践
---

# Docker容器配置与部署实践指南

## MinIO

```sh
mkdir -p ~/minio/data

docker run \
   -p 9000:9000 \
   -p 9001:9001 \
   --name minio \
   -v ~/minio/data:/data \
   -e "MINIO_ROOT_USER=admin" \
   -e "MINIO_ROOT_PASSWORD=1122qazwsx" \
   quay.io/minio/minio server /data --console-address ":9001"
```

## MariaDB

```sh

```
