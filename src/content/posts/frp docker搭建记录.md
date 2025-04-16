---
title: 'frp docker搭建记录'
date: 2025-04-15 22:14:10
author: Jinx
slug: frp-docker-setup
featured: true
draft: false
category: NAS
tags: ['frp', 'docker']
---

## 前言

frp 是一个开源的跨平台内网穿透工具，支持 TCP、UDP、HTTP、HTTPS 等多种协议。本文记录了使用 docker 搭建 frp 服务端和客户端的过程。

<!--more-->

## 1. 服务端安装

```shell
mkdir -pv /opt/frps/{conf,logs}
```

```shell
cd /opt/frps/
vim docker-compose.yml
```

```yaml
version: '3.9'
services:
  frps:
    image: snowdreamtech/frps:0.52.3
    container_name: frps
    hostname: frps
    restart: always
    network_mode: host
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ./conf/frps.toml:/etc/frp/frps.toml:ro
      - ./logs:/frp/logs
```

```shell
vim /opt/frps/conf/frps.toml
```

```toml
# 监听地址
bindAddr = "0.0.0.0"
# 监听端口
bindPort = 7000
# 监听 KCP 协议端口
kcpBindPort = 7000
# 监听 HTTP 协议端口
vhostHTTPPort = 8080
# 监听 HTTPS 协议端口
vhostHTTPSPort = 8443

# 二级域名后缀
subDomainHost = "yourdomain.com"

# 鉴权配置
## 鉴权方式
auth.method = "token"
## Token
auth.token = "awdawd"

# 日志配置
log.to = "/frp/logs/frps.log"
log.level = "info"
log.maxDays = 180
log.disablePrintColor = false

# 仪表盘配置
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "passw0rd"

# 是否提供 Prometheus 监控接口
enablePrometheus = false

# 允许客户端设置的最大连接池大小
transport.maxPoolCount = 1000
```

```shell
docker-compose up -d
```

## 2. 客户端安装

```shell
mkdir -pv /vol2/1000/docker/frpc/{conf,logs}
cd /vol2/1000/docker/frpc
vim docker-compose.yml
```

```yaml
version: '3.9'
services:
  frpc:
    image: snowdreamtech/frpc:0.52.3
    container_name: frpc
    restart: always
    network_mode: host
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /vol2/1000/docker/frpc/conf/frpc.toml:/etc/frp/frpc.toml:ro
      - /vol2/1000/docker/frpc/logs:/frp/logs
```

```shell
vim /vol2/1000/docker/frpc/conf/frpc.toml
```

```toml
# 连接配置
## 连接服务端的地址
serverAddr = "yourdomain.com"
## 连接服务端的端口
serverPort = 7000

# 鉴权配置
## 鉴权方式
auth.method = "token"
## Token
auth.token = "awdawd"

# 代理配置
## TCP 连接
[[proxies]]
### 连接名称
name = "ssh-demo"
### 连接类型
type = "tcp"
### 本地IP
localIP = "192.168.1.175"
### 本地端口
localPort = 22
### 是否启用加密功能，启用后该代理和服务端之间的通信内容都会被加密传输
transport.useEncryption = true
### 是否启用压缩功能，启用后该代理和服务端之间的通信内容都会被压缩传输
transport.useCompression = false
### 服务端绑定的端口，用户访问服务端此端口的流量会被转发到对应的本地服务
remotePort = 1111


[[proxies]]
name = "mp"
type = "tcp"
localIP = "192.168.1.175"
localPort = 3000
transport.useEncryption = true
transport.useCompression = false
remotePort = 3000

[[proxies]]
name = "fnos"
type = "tcp"
localIP = "192.168.1.175"
localPort = 5666
transport.useEncryption = true
transport.useCompression = false
remotePort = 5666


[[proxies]]
name = "qb"
type = "tcp"
localIP = "192.168.1.175"
localPort = 8085
transport.useEncryption = true
transport.useCompression = false
remotePort = 8085

[[proxies]]
name = "nginx-proxy-manager"
type = "tcp"
localIP = "192.168.1.175"
localPort = 50001
transport.useEncryption = true
transport.useCompression = false
remotePort = 50001

[[proxies]]
name = "mihomo"
type = "tcp"
localIP = "192.168.1.175"
localPort = 9090
transport.useEncryption = true
transport.useCompression = false
remotePort = 9090
```

```shell
docker-compose up -d
```
