---
title: AdGuard Home部署
author: Jinx
date: 2025-01-02
slug: adguard-home-deploy
featured: true
draft: false
categories:
  - linux
tags:
  - AdGuard Home
  - 部署
description: 详细介绍在linux系统上部署AdGuard Home的完整流程
---

<!-- more -->

## 什么是 AdGuard Home

AdGuard Home 是一个网络范围的广告和跟踪器阻止 DNS 服务器。它可以保护您的设备免受广告、跟踪、恶意软件等的侵害。

## 部署前准备

- Docker 环境
- 域名（如需配置 HTTPS）
- SSL 证书（如需配置 HTTPS）

## 构建编排文件

首先我的docker-compose.yml文件如下，位置在/root/docker/adguardhome/docker-compose.yml
然后docker采用了Host 网络模式
直接使用宿主机的网络，没有网络隔离，不需要考虑容器端口的映射，在容器启动后可以自由调整被占用的端口。适合在本机使用 (lo­cal­host)，或者直通外网的设备对外开放服务，就比如 VPS 、主路由。

```shell
version: '3.8'  # 使用Docker Compose文件格式3.8版本

services:  # 定义服务
  adguardhome:
    image: adguard/adguardhome  # 指定要使用的镜像
    container_name: adguardhome  # 设置容器名
    restart: unless-stopped  # 设置重启策略
    logging:  # 配置日志选项
      options:
        max-size: "1m"  # 设置日志最大大小
    network_mode: host  # 使用主机网络模式
    volumes:  # 定义数据卷
      - ./work:/opt/adguardhome/work  # 绑定挂载 work 目录
      - ./conf:/opt/adguardhome/conf  # 绑定挂载 conf 目录root@host-192-168-0-205:~/docker/adguardHome#
```

建立好文件夹

```shell
mkdir -p /root/docker/adguardhome/work
mkdir -p /root/docker/adguardhome/conf
```

## 配置ADH

**监听端口**：

因为机器上还部署了nginx，直接用80端口会提示占用，需要根据实际情况进行调整，是更改端口还是关闭相关占用端口的服务取决于你的最终使用场景。我个人改用3000端口。

**DNS服务器**：

此处我改用了非标端口，原因是阿里云好像会检测。酌情更改

![img](https://oss.mytest.cc/2025/01/47839c048e028a07000eaf768a57ee54.png)

## 配置DNS设置

常规设置按照描述配置就好，默认也没什么影响

**上游 DNS 服务器**

我选择的是并行请求

```
tls://dns.pub
https://dns.pub/dns-query
tls://dns.alidns.com
https://dns.alidns.com/dns-query
```

**Bootstrap DNS 服务器**

```
119.29.29.29
119.28.28.28
223.5.5.5
223.6.6.6
```

**DNS 服务配置**

速度限制: 0 代表不限制

启用EDNS客户端子网和DNSSEC

**DNS 缓存配置**

乐观缓存：勾选

## 加密设置

首先启用加密，如果不需要DOT/DOQ可以不设置端口，本人仅用DOH。

另外HTTPS端口我也改成了8443，防止和nginx冲突

配置好域名和证书即可

## DNS黑名单

我添加了halflife的规则

```
https://cdn.jsdelivr.net/gh/o0HalfLife0o/list@master/ad.txt
```

Anti-AD配置个人觉得误杀严重，自己看着办，到此为止就配置好了。

## nginx配置

注意前面http端口设置了3000，https端口设置为8443，所以配置文件和此处设置相关

```js
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/web.crt;
    ssl_certificate_key /etc/ssl/web.key;

    # Configurações de segurança SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /adguard/ {
        proxy_pass https://127.0.0.1:8443/; # 自定义修改
        proxy_redirect / /adguard/;    # 同步修改uri
        proxy_cookie_path / /adguard/;    # 同步修改uri
        proxy_set_header Host $host;
        proxy_ssl_server_name on;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

    }

    #该路由代理 DoH 服务，设置一下proxy_pass项
    location /dns-query {
        proxy_pass https://127.0.0.1:8443/dns-query;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_ssl_server_name on;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

设置完成后重启nginx

在客户端配置dns即可，以doh为例

> https://yourdomain.com/dns-query

## 参考

[AdGuard Home 自建 DNS 防污染、去广告教程 #2 - 优化增强设置详解](https://p3terx.com/archives/use-adguard-home-to-build-dns-to-prevent-pollution-and-remove-ads-2.html)
