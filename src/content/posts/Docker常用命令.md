---
title: Docker常用命令速查手册
author: Jinx
date: 2024-09-03
slug: docker-command-cheatsheet
featured: true
draft: false
categories:
  - docker
tags:
  - 容器管理
  - 镜像管理
  - docker命令
description: 整理Docker日常使用中的常用命令，包括镜像管理、容器操作、日志查看、文件复制等核心操作的详细说明和实际应用示例
---

# Docker常用命令

## 镜像管理

```shell
# 列出镜像
docker images
# 检索镜像
docker search 关键字
# 拉取镜像 docker pull ghcr.io/simongino/a-train
docker pull [选项] [Docker Registry 地址[:端口号]/]仓库名[:标签]
# 删除镜像
docker rmi <镜像ID>
```

## 容器管理

```shell
# 日志
docker logs [容器ID]

-f : 跟踪日志输出

--since :显示某个开始时间的所有日志

-t : 显示时间戳

--tail :仅列出最新N条容器日志

# 进入容器
docker exec [容器ID]
－ d, --detach 在容器中后台执行命令；
－ i, --interactive=true I false ：打开标准输入接受用户输入命令
# 启动容器
docker run [镜像名/镜像ID]
# 删除容器
docker  rm [容器ID]

# 复制文件
# 从主机复制到容器
sudo docker cp host_path containerID:container_path
# 从容器复制到主机
sudo docker cp containerID:container_path host_path
```

例子：

```shell
docker run -d \
       --name a-train \
       --volume ./:/data \
       --restart unless-stopped \
       -e RUST_LOG=a_train=warn,bernard=warn \
       --log-driver json-file \
       --log-opt max-size=10m \
       --log-opt max-file=3 \
       ghcr.io/simongino/a-train
```
