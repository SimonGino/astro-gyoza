---
title: VanBlog博客部署与HTTPS配置指南
author: Jinx
date: 2024-02-01
slug: vanblog-deployment-https-setup
featured: true
draft: false
category: docker
tags:
  - vanBlog
  - SSL证书
  - 反向代理
  - 容器部署
description: 详细介绍VanBlog博客系统的完整部署流程，包括Docker环境搭建、Docker Compose配置、SSL证书申请以及Nginx反向代理设置等关键步骤
---

简单介绍下本站博客搭建过程
优点：简洁、快速
用到了docker、nginx、certbot工具

<!-- more -->

# 1.安装依赖

如果你没有安装 docker 和 docker-compose，可以通过以下命令一键安装：

```sh
curl -sSL https://get.daocloud.io/docker | sh
systemctl enable --now docker
```

# 2.新建编排文件

因为我待会会使用nginx反代，所以暴露的端口为8880，也可以设置80或者其他任意端口

```yaml
version: '3'

services:
  vanblog:
    # 阿里云镜像源
    # image: registry.cn-beijing.aliyuncs.com/mereith/van-blog:latest
    image: mereith/van-blog:latest
    restart: always
    environment:
      TZ: 'Asia/Shanghai'
      # 邮箱地址，用于自动申请 https 证书
      EMAIL: 'test@gmail.com'
    volumes:
      # 图床文件的存放地址，按需修改。
      - ${PWD}/data/static:/app/static
      # 日志文件
      - ${PWD}/log:/var/log
      # Caddy 配置存储
      - ${PWD}/caddy/config:/root/.config/caddy
      # Caddy 证书存储
      - ${PWD}/caddy/data:/root/.local/share/caddy
    ports:
      # 前面的是映射到宿主机��端口号，改端口的话改前面的。
      - 8880:80
      - 4443:443
  mongo:
    # 某些机器不支持 avx 会报错，所以默认用 v4 版本。有的话用最新的。
    image: mongo:4.4.16
    restart: always
    environment:
      TZ: 'Asia/Shanghai'
    volumes:
      - ${PWD}/data/mongo:/data/db
```

如果不想在同一台机器上部署数据库

```yaml
version: '3'

services:
  vanblog:
    # 阿里云镜像源
    # image: registry.cn-beijing.aliyuncs.com/mereith/van-blog:latest
    image: mereith/van-blog:latest
    restart: always
    environment:
      TZ: 'Asia/Shanghai'
      # 邮箱地址，用于自动申请 https 证书
      EMAIL: 'test@gmail.com'
      VAN_BLOG_DATABASE_URL: 'mongodb://mongo:0947Vh5lxpU1@zeabur-gcp-asia-east1-1.clusters.zeabur.com:30444/vanBlog?authSource=admin'
    volumes:
      # 图床文件的存放地址，按需修改。
      - ${PWD}/data/static:/app/static
      # 日志文件
      - ${PWD}/log:/var/log
    ports:
      # 前面的是映射到宿主机的端口号，改端口的话改前面的。
      - 8880:80
      - 4443:443
```

启动项目

```sh
docker-compose up -d
```

# 申请证书

> 申请证书时需要保持80端口开放

```sh
apt install certbot -y
```

```sh
certbot certonly \
--standalone \
--agree-tos \
--no-eff-email \
--email test@gmail.com \
-d example.org
```

# 配置nginx

我的配置文件放在/etc/nginx/conf.d/下

```ini
server {
  listen 80;
  # 改为你的网址
  server_name example.org;
  # 重定向为 https
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  # 改为你的网址
  server_name example.org;
  # 证书的公私钥
  ssl_certificate /etc/letsencrypt/live/example.org/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.org/privkey.pem;

  location / {
    # 改为容器的 PORT
    proxy_pass http://127.0.0.1:8880;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
  }
}
```

重载配置

```sh
nginx -t
nginx -s reload
```
