---
title: SmartDNS 安装与 DNS 分流配置指南
author: Jinx
date: 2025-12-25
slug: smartdns-installation-and-dns-diversion
featured: false
draft: false
category: smartdns
tags:
  - Linux
  - smartdns
  - dns分流
  - Docker
description: SmartDNS 是一个功能强大的本地 DNS 服务器，支持 DoT/DoH/DoQ 等多种协议。本文将介绍 SmartDNS 的基本概念、Docker 安装方法、Web UI 配置以及 DNS 分流实战，帮助你快速搭建高效的 DNS 解析服务。
---

## SmartDNS 简介

[SmartDNS](https://github.com/pymumu/smartdns) 是一个运行在本地的高性能 DNS 服务器。它的核心特性包括：

- **智能测速**：从多个上游 DNS 服务器获取查询结果，返回访问速度最快的 IP
- **隐私保护**：支持 DoT (DNS over TLS)、DoH (DNS over HTTPS) 和 DoQ (DNS over QUIC)
- **广告过滤**：支持指定特定域名 IP 地址，可实现广告过滤
- **分流解析**：支持将不同域名发送到不同的 DNS 服务器解析

> 与 DNSmasq 的 `all-servers` 模式不同，SmartDNS 会对所有结果进行测速，返回最优解析结果。

支持平台：树莓派、OpenWrt、华硕路由器原生固件、Windows、Linux 等。

## Docker 安装

### 基础配置

首先创建配置目录和文件：

```bash
mkdir -p /path/to/smartdns/data/etc/smartdns
mkdir -p /path/to/smartdns/data/var/lib/smartdns
mkdir -p /path/to/smartdns/data/var/log/smartdns
```

创建基础配置文件 `smartdns.conf`：

```
# 监听所有接口（适合局域网共享）
bind [::]:53

# 上游 DNS 服务器
server 8.8.8.8             # Google DNS
server 1.1.1.1             # Cloudflare DNS
server 9.9.9.9             # Quad9 DNS (注重安全)
server 208.67.222.222      # OpenDNS
```

如果只给服务器本机使用，不想暴露给外部网络，可以只绑定本地回环地址：

```
# 仅监听本机
bind 127.0.0.1:53

# 上游 DNS 服务器
server 8.8.8.8             # Google DNS
server 1.1.1.1             # Cloudflare DNS
server 9.9.9.9             # Quad9 DNS
server 208.67.222.222      # OpenDNS
```

### Docker Compose 部署

创建 `docker-compose.yml`：

```yaml
services:
  smartdns:
    container_name: smartdns
    image: pymumu/smartdns:latest
    restart: always
    network_mode: host
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./data/etc/smartdns:/etc/smartdns # 主配置
      - ./data/var/lib/smartdns:/var/lib/smartdns # 数据库
      - ./data/var/log/smartdns:/var/log/smartdns # 日志
```

启动服务：

```bash
docker compose up -d
```

### 热加载配置

SmartDNS 支持不重启容器的情况下重新加载配置：

```bash
# 方式一：进入容器执行
docker exec -it smartdns /bin/sh -c "kill -HUP 1"

# 方式二：直接执行
docker exec smartdns kill -HUP 1
```

### 验证服务

使用 `dig` 或 `nslookup` 验证 DNS 服务是否正常：

```bash
# 使用 dig 验证
dig @127.0.0.1 google.com

# 使用 nslookup 验证
nslookup google.com 127.0.0.1
```

## 启用 Web UI 界面

SmartDNS 提供了插件化的仪表盘功能，方便可视化管理。

在 `smartdns.conf` 配置文件末尾添加：

```
# 启用 Web UI 插件
plugin smartdns_ui.so
smartdns-ui.ip http://0.0.0.0:6080
```

重新加载配置后，访问 `http://服务器IP:6080` 即可打开管理界面。

> **默认凭据**：用户名 `admin`，密码 `password`  
> ⚠️ **注意**：静态编译版本的 SmartDNS 不支持仪表盘插件

## DNS 分流配置

DNS 分流是 SmartDNS 的强大功能之一，可以将特定域名发送到指定的 DNS 服务器解析。

### 分流原理

```text
.local 结尾的域名 → 192.168.1.1 解析（内网 DNS）
.company.com 域名 → 10.0.0.1 解析（公司 DNS）
其他域名         → 默认上游服务器
```

### 实战：AI 服务解锁配置

以下是我针对 AI 服务的分流配置示例，将 AI 相关域名通过指定的解锁服务器解析：

```
# ==========================================
# AI Unlock Group Configuration
# ==========================================

# 定义解锁服务器 (组名: ai_unlock)
# -exclude-default-group 确保这个服务器只服务于下面指定的域名
server 1.2.3.4 -group ai_unlock -exclude-default-group

# ==========================================
# Domain Rules
# ==========================================

# --- OpenAI / ChatGPT ---
nameserver /openai.com/ai_unlock
nameserver /chatgpt.com/ai_unlock
nameserver /ai.com/ai_unlock
nameserver /oaistatic.com/ai_unlock
nameserver /oaiusercontent.com/ai_unlock

# --- Anthropic / Claude ---
nameserver /anthropic.com/ai_unlock
nameserver /claude.ai/ai_unlock
nameserver /claude.com/ai_unlock

# --- Google AI (Gemini/Bard/NotebookLM) ---
# 注意：只包含 AI 相关的子域名，避免影响 YouTube 等普通流量
nameserver /generativeai.google/ai_unlock
nameserver /antigravity.google/ai_unlock
nameserver /notebooklm.google/ai_unlock
nameserver /deepmind.google/ai_unlock
nameserver /gemini.google/ai_unlock
nameserver /ai.google.dev/ai_unlock
nameserver /notebooklm.google.com/ai_unlock
nameserver /makersuite.google.com/ai_unlock
nameserver /aistudio.google.com/ai_unlock
nameserver /gemini.google.com/ai_unlock
nameserver /jules.google.com/ai_unlock
nameserver /bard.google.com/ai_unlock

# Google AI APIs
nameserver /proactivebackend-pa.googleapis.com/ai_unlock
nameserver /generativelanguage.googleapis.com/ai_unlock
nameserver /robinfrontend-pa.googleapis.com/ai_unlock
nameserver /cloudcode-pa.googleapis.com/ai_unlock
nameserver /aisandbox-pa.googleapis.com/ai_unlock
nameserver /geller-pa.googleapis.com/ai_unlock
nameserver /aida.googleapis.com/ai_unlock
nameserver /alkalicore-pa.clients6.google.com/ai_unlock
nameserver /alkalimakersuite-pa.clients6.google.com/ai_unlock

# --- GitHub Copilot / X.AI ---
nameserver /api.github.com/ai_unlock
nameserver /grok.com/ai_unlock
nameserver /x.ai/ai_unlock

# --- Other AI Services ---
nameserver /gateway.ai.cloudflare.com/ai_unlock
nameserver /deepmind.com/ai_unlock
nameserver /sora.com/ai_unlock
nameserver /groq.com/ai_unlock
nameserver /chat.com/ai_unlock
nameserver /poe.com/ai_unlock
nameserver /clipdrop.co/ai_unlock
nameserver /perplexity.ai/ai_unlock
nameserver /openrouter.ai/ai_unlock
nameserver /api.jetbrains.ai/ai_unlock
nameserver /openart.ai/ai_unlock
nameserver /jasper.ai/ai_unlock
nameserver /meta.ai/ai_unlock
nameserver /dify.ai/ai_unlock
```

## 参考资料

- [SmartDNS GitHub](https://github.com/pymumu/smartdns)
- [SmartDNS 官方文档](https://pymumu.github.io/smartdns/)
