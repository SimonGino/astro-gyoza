---
title: Docker部署MongoDB数据库配置指南
author: Jinx
date: 2023-12-05
slug: docker-mongodb-setup-guide
featured: true
draft: false
category: docker
tags:
  - 数据库部署
  - MongoDB配置
  - 网络配置
  - 用户认证
description: 详细介绍使用Docker部署MongoDB数据库的完整流程，包括容器网络创建、用户认证配置、端口映射以及环境变量设置等关键步骤的最佳实践
---

<!-- more -->

```sh
docker pull mongo:latest
```

三、运行mongo容器并设置用户(关键步骤)
为docker 的mongodb 新建一个网络(直接在cmd命令窗口执行)

```sh
docker network  create mongowork
```

2. 创建并运行mongo容器

```sh
docker run -d -p 27017:27017 --network mongowork --name mongodb -e MONGO_INITDB_ROOT_USERNAME=mongo -e MONGO_INITDB_ROOT_PASSWORD=123456 mongo
```

参数说明

network: 将容器连接到网络，这里我创建的网络是：mongowork  
p: 端口，宿主机端口:镜像端口  
name: 容器名称，这个大家可以随便命名  
d: 设置后台运行容器  
MONGO_INITDB_ROOT_USERNAME ： mongodb 的用户名，这设置为mongo  
MONGO_INITDB_ROOT_PASSWORD： mongodb 的密码， 这里设置为123456
