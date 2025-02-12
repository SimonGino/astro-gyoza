---
title: Docker部署RustDesk中继服务器配置指南
author: Jinx
date: 2024-07-12
slug: docker-rustdesk-relay-server-setup
featured: true
draft: false
category: docker
tags:
  - 远程桌面
  - 中继服务器
  - docker-compose
  - 容器配置
description: 详细介绍使用Docker部署RustDesk中继服务器的完整流程，包括hbbs/hbbr服务配置、网络端口映射、Docker Compose编排以及UDP端口开放等关键设置说明
---

## Docker安装rustdesk中继服务器

### Docker examples

```sh
sudo docker image pull rustdesk/rustdesk-server
sudo docker run --name hbbs -v ./data:/root -td --net=host --restart unless-stopped rustdesk/rustdesk-server hbbs -r <relay-server-ip[:port]>
sudo docker run --name hbbr -v ./data:/root -td --net=host --restart unless-stopped rustdesk/rustdesk-server hbbr
```

> --net=host 只在Linux上运行，这使得hbbs/hbbr可以看到真实的传入IP地址而不是容器IP（172.17.0.1）。如果--net=host工作正常，则不使用-p选项。如果在Windows上，请省略sudo和--net=host。
>
> 如果您在平台上遇到连接问题，请删除--net=host。

### Docker Compose examples

```sh
mkdir -p rustdesk
touch ./rustdesk/docker-compose.yml
```

```yaml
version: '3'

networks:
  rustdesk-net:
    external: false

services:
  hbbs:
    container_name: hbbs
    ports:
      - 21115:21115
      - 21116:21116
      - 21116:21116/udp
      - 21118:21118
    image: rustdesk/rustdesk-server:latest
    command: hbbs -r 这里替换成你服务器的公网ip:21117
    volumes:
      - ./data:/root
    networks:
      - rustdesk-net
    depends_on:
      - hbbr
    restart: unless-stopped

  hbbr:
    container_name: hbbr
    ports:
      - 21117:21117
      - 21119:21119
    image: rustdesk/rustdesk-server:latest
    command: hbbr
    volumes:
      - ./data:/root
    networks:
      - rustdesk-net
    restart: unless-stopped
```

```sh
 docker compose up -d
```

key在挂在目录的data文件夹下\*.pub文件

ID服务器和中继服务器直接填公网VPS的IP即可

tips：

- VPS需要开启对应接口的UDP，不然连接会失败
