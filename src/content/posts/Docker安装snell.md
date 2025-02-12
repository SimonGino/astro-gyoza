---
title: Docker部署Snell代理服务器配置指南
author: Jinx
date: 2024-08-27
slug: snell-install
featured: true
draft: false
category: docker
tags:
  - snell
  - 代理服务器
  - 容器配置
  - docker-compose
description: 详细介绍使用Docker部署Snell代理服务器的完整流程，包括Docker Compose配置、Snell服务器参数设置、IPv6支持以及混淆模式的配置说明
---

<!-- more -->

### snell配置文件

```sh
mkdir -p /root/docker/snell
```

```sh
cat > /root/docker/snell/docker-compose.yml << EOF
version: "3.8"
services:
  snell:
    image: accors/snell:latest
    container_name: snell
    restart: always
    network_mode: host
    volumes:
      - ./snell.conf:/etc/snell-server.conf
    environment:
      - SNELL_URL=https://dl.nssurge.com/snell/snell-server-v4.1.1-linux-amd64.zip
EOF
```

```sh
cat > /root/docker/snell/snell.conf << EOF
[snell-server]
dns = 1.1.1.1, 8.8.8.8, 2001:4860:4860::8888
listen = ::0:50010
ipv6 = true
psk = your_password
tfo = false
version = 4
EOF
```

OR

```shell
cat > /root/docker/snell/snell.conf << EOF
[snell-server]
dns = 1.1.1.1, 8.8.8.8, 2001:4860:4860::8888
listen = ::0:50010
ipv6 = true
psk = your_password
obfs = http
obfs-host = www.bing.com
tfo = false
version = 4
EOF
```

```shell
docker compose up -d
```

```shell
docker compose down -v
```

snell版本：https://manual.nssurge.com/others/snell.html?ref=blog.lalalayyds.top
