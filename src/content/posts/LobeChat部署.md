---
title: LobeChat部署
author: Jinx
date: 2025-01-02
slug: lobechat-deploy
featured: true
draft: false
category: linux
tags:
  - LobeChat
  - 部署
description: 详细介绍在linux系统上部署LobeChat的完整流程
---

## 构建编排文件

首先我的docker-compose.yml文件如下，位置在/root/docker/lobe-chat-db/docker-compose.yml

```shell
version: '3.8'

services:
  lobe-chat:
    image: lobehub/lobe-chat
    container_name: lobe-chat
    restart: always
    ports:
      - '3210:3210'
    environment:
      OPENAI_API_KEY: sk-xxxx
      OPENAI_PROXY_URL: https://api-proxy.com/v1
      ACCESS_CODE: lobe66
```

也可以自定义环境变量部署，具体参考[官方文档-环境变量](https://lobehub.com/zh/docs/self-hosting/environment-variables/basic)
下面是我自用的配置,禁用了openAI和ollama,用的是阿里和deepseek模型，并且设置阿里的模型作为了默认助手

```shell
version: '3.8'

services:
  lobe-chat:
    image: lobehub/lobe-chat
    container_name: lobe-chat
    restart: always
    ports:
      - '3210:3210'
    environment:
      ENABLED_OPENAI: 0
      ENABLED_OLLAMA: 0
      DEFAULT_AGENT_CONFIG: 'model=qwen-max-latest;provider=qwen;params.max_tokens=3000'
      DEEPSEEK_API_KEY: sk-xxxxxxxxxxxxxxxxxxxxxx
      QWEN_API_KEY: sk-xxxxxxxxxxxxxxxxxxxxxx
      QWEN_MODEL_LIST: -all
      ACCESS_CODE: lobe66
```

## 部署

```shell
docker compose up -d
```

## 配置nginx

```shell
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/yourdomain.com/ssl/web.crt;
    ssl_certificate_key /etc/yourdomain.com/ssl/web.key;

    # Configurações de segurança SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

    location / {
        proxy_pass http://localhost:3210;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 更新

Crontab 配置

```shell
#!/bin/bash
# auto-update-lobe-chat.sh

echo "Starting update check..."

# 切换到 docker-compose.yml 所在目录
cd /root/docker/lobe-chat-db || exit

# 获取当前运行容器的版本
RUNNING_VERSION=$(docker inspect lobe-chat 2>/dev/null | grep 'org.opencontainers.image.version' | head -n 1 | awk -F'"' '{print $4}')
if [ -z "$RUNNING_VERSION" ]; then
    echo "No running container found or unable to get version"
    RUNNING_VERSION="0.0.0"
fi
echo "Currently running version: $RUNNING_VERSION"

# 拉取最新镜像
echo "Checking for updates..."
if ! docker pull lobehub/lobe-chat:latest; then
    echo "Failed to pull latest image"
    exit 1
fi

# 获取最新镜像的版本
LATEST_VERSION=$(docker inspect lobehub/lobe-chat:latest | grep 'org.opencontainers.image.version' | head -n 1 | awk -F'"' '{print $4}')
echo "Latest available version: $LATEST_VERSION"

# 比较版本号（简单字符串比较）
if [ "$RUNNING_VERSION" = "$LATEST_VERSION" ]; then
    echo "Already running the latest version"
    exit 0
fi

echo "Update available: $RUNNING_VERSION -> $LATEST_VERSION"

# 停止并更新容器
echo "Stopping old container..."
docker compose down

echo "Starting new container with version $LATEST_VERSION..."
docker compose up -d

# Print the update time
echo "Update time: $(date)"

# Clean up unused images
echo "Cleaning up old images..."
docker images | grep 'lobehub/lobe-chat' | grep -v 'lobehub/lobe-chat-database' | grep -v 'latest' | awk '{print $3}' | xargs -r docker rmi > /dev/null 2>&1

echo "Update completed successfully"
echo "Current running version: $LATEST_VERSION"

# 验证更新后的版本
NEW_RUNNING_VERSION=$(docker inspect lobe-chat | grep 'org.opencontainers.image.version' | head -n 1 | awk -F'"' '{print $4}')
if [ "$NEW_RUNNING_VERSION" = "$LATEST_VERSION" ]; then
    echo "Version verification successful"
else
    echo "Warning: Version mismatch after update"
    echo "Expected: $LATEST_VERSION"
    echo "Running: $NEW_RUNNING_VERSION"
fi
```

配置Crontab -e

```shell
*/5 * * * * /root/docker/lobe-chat-db/auto-update-lobe-chat.sh >> /root/docker/lobe-chat-db/auto-update-lobe-chat.log 2>&1
```

Crontab 查看任务

```shell
crontab -l
```

## 参考

[LobeChat 部署](https://lobehub.com/zh/docs/self-hosting/deployment/docker)
