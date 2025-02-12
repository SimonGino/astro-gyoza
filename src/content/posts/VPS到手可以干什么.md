---
title: VPS服务器初始化配置指南
author: Jinx
date: 2024-09-20
slug: vps-initial-setup-guide
featured: true
draft: false
category: linux
tags:
  - sing-box
  - nginx
  - 服务器配置
description: 详细介绍VPS服务器的初始化配置步骤，包括Docker环境搭建、Sing-Box代理部署、性能测试脚本使用以及博客系统搭建等实用教程
pin: true
sticky: 1
---

<!-- more -->

## 安装docker

```shell
# 提权
sudo -i
# 更新
apt-get update && apt-get upgrade -y
apt install wget curl sudo vim git vnstat lsof rng-tools -y

# 安装优化脚本
curl -fsSL  https://cdn.skk.moe/sh/optimize.sh | bash

# 安装docker：

# 国外vps：
curl -fsSL https://get.docker.com | bash -s docker
# 国内vps：
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 安装docker-compose：

# 如果之前安装了2.0以下的版本的话，请先执行卸载指令：
sudo rm /usr/local/bin/docker-compose
# 如果之前安装了2.0以上的版本的话，请先执行卸载指令：
rm -rf .docker/cli-plugins/

# 安装：
apt-get install docker-compose-plugin -y

# 查看版本号，有版本号即可
docker compose version

# 如果需要更新compose ，就直接 apt-get upgrade -y 即可
```

## 安装代理协议

### Sing-Box

```sh
bash <(curl -fsSL https://sing-box.app/deb-install.sh)
```

| 项目     |                                          |
| -------- | ---------------------------------------- |
| 程序     | **/usr/local/bin/sing-box**              |
| 配置     | **/usr/local/etc/sing-box/config.json**  |
| geoip    | **/usr/local/share/sing-box/geoip.db**   |
| geosite  | **/usr/local/share/sing-box/geosite.db** |
| 自启动   | systemctl enable sing-box                |
| 热载     | systemctl reload sing-box                |
| 重启     | systemctl restart sing-box               |
| 状态     | systemctl status sing-box                |
| 查看日志 | journalctl -u sing-box -o cat -e         |
| 实时日志 | journalctl -u sing-box -o cat -f         |

**配置文件**

```sh
mkdir -p /etc/hysteria
# 生成证书
openssl req -x509 -nodes -newkey ec:<(openssl ecparam -name prime256v1) -keyout /etc/hysteria/server.key -out /etc/hysteria/server.crt -subj "/CN=bing.com" -days 36500 && chown hysteria /etc/hysteria/server.key && chown hysteria /etc/hysteria/server.crt
# 端口转发
iptables -t nat -A PREROUTING -i eth0 -p udp --dport 50020:50030 -j REDIRECT --to-ports 50003
ip6tables -t nat -A PREROUTING -i eth0 -p udp --dport 50020:50030 -j REDIRECT --to-ports 50003
```

**落地机器**

```shell
 vim /etc/sing-box/config.json
```

```json
{
  "log": {
    "level": "info"
  },
  "inbounds": [
    {
      "type": "trojan",
      "tag": "trojan-in",
      "listen": "0.0.0.0",
      "listen_port": 50001,
      "users": [
        {
          "password": "simon1122qaz"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "bing.com",
        "certificate_path": "/etc/hysteria/server.crt",
        "key_path": "/etc/hysteria/server.key"
      }
    },
    {
      "type": "hysteria2",
      "listen": "0.0.0.0",
      "listen_port": 50003,
      "up_mbps": 300,
      "down_mbps": 100,
      "users": [
        {
          "password": "simon1122qaz"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "bing.com",
        "alpn": ["h3"],
        "certificate_path": "/etc/hysteria/server.crt",
        "key_path": "/etc/hysteria/server.key"
      }
    }
  ],
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct"
    }
  ]
}
```

## 测试脚本

### 流媒体检测

```sh
bash <(curl -L -s https://raw.githubusercontent.com/1-stream/RegionRestrictionCheck/main/check.sh)
```

### Nexttrace

```sh
curl nxtrace.org/nt |bash

nexttrace --fast-trace
```

## 博客搭建

### 使用docker安装vanblog

因为我待会会使用nginx反代，所以暴露的端口为8880，也可以设置80或者其他任意端口

```sh
mkdir -p /root/docker/vanblog
```

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
      # 前面的是映射到宿主机的端口号，改端口的话改前面的。
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

```sh
mkdir -p /root/docker/vanblog && mkdir -p /root/docker/mongo/data
```

```yaml
cat > /root/docker/vanblog/docker-compose.yml << EOF
version: "3"

services:
  vanblog:
    # 阿里云镜像源
    # image: registry.cn-beijing.aliyuncs.com/mereith/van-blog:latest
    image: mereith/van-blog:latest
    restart: always
    environment:
      TZ: "Asia/Shanghai"
      # 邮箱地址，用于自动申请 https 证书
      EMAIL: "youremail@gmail.com"
      VAN_BLOG_DATABASE_URL: "mongodb://admin:vanblog2023@yourip:27117/vanBlog?authSource=admin"
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
      # 前面的是映射到宿主机的端口号，改端口的话改前面的。
      - 8880:80
      - 4443:443
EOF
```

mongo

```sh
cat > /root/docker/mongo/docker-compose.yml << EOF
version: "3"
services:
  mongodb:
    image: mongo
    container_name: mongodb
    restart: always
    ports:
      - 27117:27017
    volumes:
      - ./data:/data/db
    command: --wiredTigerCacheSizeGB 4 --auth # 限制内存大小, 需要认证
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=vanblog2023
networks:
  default:
    name: mongodb_network
EOF
```

启动项目

```sh
docker compose up -d
```

### 申请证书

> 申请证书时需要保持80端口开放

```sh
apt install certbot -y
```

```sh
certbot certonly \
--standalone \
--agree-tos \
--no-eff-email \
--email youremail@gmail.com \
-d your.domain.nam
```

### 配置nginx

我的配置文件放在/etc/nginx/conf.d/下

```ini
server {
  listen 80;
  # 改为你的网址
  server_name your.domain.name;
  # 重定向为 https
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  # 改为你的网址
  server_name sb.qiuwang.xyz;
  # 证书的公私钥
  ssl_certificate /etc/letsencrypt/live/your.domain.name/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your.domain.name/privkey.pem;

  location / {
    # 改为容器的 PORT
    proxy_pass http://127.0.0.1:8223;
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

## 一键脚本

### SWAP脚本

```sh
wget https://raw.githubusercontent.com/zhucaidan/swap.sh/main/swap.sh && bash swap.sh
```

### 卸载阿里云盾监控

```sh
wget -N --no-check-certificate https://raw.githubusercontent.com/babywbx/Uninstall-aliyun-service/master/UAS.sh && chmod 777 UAS.sh && ./UAS.sh
```

### IPV6

```sh
bash <(curl -fsSL https://raw.githubusercontent.com/SimonGino/Config/master/sh/ipv6.sh)
```

### Warp

[fscarmen/warp-gitlab](https://gitlab.com/fscarmen/warp)

```shell
wget -N https://gitlab.com/fscarmen/warp/-/raw/main/warp-go.sh && bash warp-go.s
```
