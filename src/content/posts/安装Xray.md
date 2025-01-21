---
title: Xray服务器安装与配置完整指南
author: Jinx
date: 2024-12-12
slug: xray-installation-guide
featured: false
draft: false
categories:
  - linux
tags:
  - Xray
  - 网络配置
  - 服务器部署
  - 安全配置
description: 详细介绍Xray的安装、配置和维护过程，包括基础安装、TLS配置、服务管理以及常用运维命令，帮助你快速搭建和管理Xray服务
---

<!-- more -->

## 1. 安装Xray

Install & Upgrade Xray-core and geodata with User=nobody, but will NOT overwrite User in existing service files

```sh
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install -u root
```

-u root 表示以root用户安装，可以避免之后获取证书文件路径权限不足

## 2. 配置Xray

```sh
mkdir -p /etc/hysteria
# 生成证书
openssl req -x509 -nodes -newkey ec:<(openssl ecparam -name prime256v1) -keyout /etc/hysteria/server.key -out /etc/hysteria/server.crt -subj "/CN=bing.com" -days 36500 && chown hysteria /etc/hysteria/server.key && chown hysteria /etc/hysteria/server.crt

```

```sh
cat > /usr/local/etc/xray/config.json << 'EOF'
{
  "log": {
    "loglevel": "warning"
  },
  "dns": {
    "servers": [
      "1.1.1.1",
      "8.8.8.8",
      {
        "address": "1.1.1.1", // 使用解锁奈飞的DNS服务器
        "port": 53,
        "domains": ["geosite:netflix", "geosite:hbo"],
        "skipFallback": true,
        "queryStrategy": "UseIPv4"
      }
    ]
  },
  "inbounds": [
    {
      "port": 40001,
      "protocol": "trojan",
      "settings": {
        "clients": [
          {
            "password": "yourpassword",
            "email": "love@example.com"
          }
        ]
      },
      "streamSettings": {
        "network": "tcp",
        "security": "tls",
        "tlsSettings": {
          "alpn": ["http/1.1"],
          "serverName": "bing.com",
          "certificates": [
            {
              "certificateFile": "/etc/hysteria/server.crt",
              "keyFile": "/etc/hysteria/server.key"
            }
          ]
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {
        "domainStrategy": "UseIP"
      }
    }
  ]
}
EOF
```

## 3. 重启Xray

```sh
systemctl restart xray
```

## 4. 查看Xray状态

```sh
systemctl status xray
```

## 5. 查看Xray日志

```sh
journalctl -u xray -o cat -f
```

## 6. 卸载Xray

Remove Xray, except json and logs

```sh
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ remove
```

## 7. Update geoip.dat and geosite.dat only

```sh
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install-geodata
```
