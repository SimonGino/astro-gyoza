---
title: Docker部署Vaultwarden密码管理服务配置指南
author: Jinx
date: 2024-08-15
slug: docker-vaultwarden-setup-guide
featured: true
draft: false
category: docker
tags:
  - Vaultwarden
  - 密码管理
  - Nginx配置
  - HTTPS配置
description: 详细介绍使用Docker部署Vaultwarden(Bitwarden)密码管理服务的完整流程，包括容器配置、Nginx反向代理设置、SSL证书配置以及用户注册管理等关键步骤
---

<!-- more -->

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: always
    environment:
      # DOMAIN: "https://vaultwarden.example.com"  # required when using a reverse proxy; your domain; vaultwarden needs to know it's https to work properly with attachments
      SIGNUPS_ALLOWED: 'true' # Deactivate this with "false" after you have created your account so that no strangers can register
    volumes:
      - ./vw-data:/data # the path before the : can be changed
    ports:
      - 11001:80 # you can replace the 11001 with your preferred port
```

to create and run the container, run:

```shell
docker compose up -d && docker compose logs -f
```

to update and run the container, run:

```shell
docker compose pull && docker compose up -d && docker compose logs -f
```

Nginx

```
server {
  listen 80;
  # 改为你的网址
  server_name your.domain.name;
  # 重定向为 https
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  http2 on;
  # 改为你的网址
  server_name your.domain.name;
  # 证书的公私钥
  ssl_certificate /etc/letsencrypt/live/your.domain.name/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your.domain.name/privkey.pem;

  location / {
    # 改为容器的 PORT
    proxy_pass http://127.0.0.1:11001;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
  }
}
```

注册完后然后再更改docker-compose.yaml

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: always
    environment:
      DOMAIN: 'https://vaultwarden.example.com' # required when using a reverse proxy; your domain; vaultwarden needs to know it's https to work properly with attachments
      SIGNUPS_ALLOWED: 'false' # Deactivate this with "false" after you have created your account so that no strangers can register
    volumes:
      - ./vw-data:/data # the path before the : can be changed
    ports:
      - 11001:80 # you can replace the 11001 with your preferred port
```
