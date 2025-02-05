---
title: acme.sh 与 Cloudflare API 自动化管理 SSL 证书指南
author: Jinx
date: 2024-10-28
slug: acme-sh-cloudflare-ssl-automation
featured: true
draft: false
categories:
  - devops
  - security
  - automation
tags:
  - SSL证书
  - acme.sh
  - Cloudflare
  - API令牌
  - 自动化运维
  - HTTPS
description: 详细讲解如何使用 acme.sh 脚本配合 Cloudflare API 令牌实现 SSL 证书的自动化申请与更新，包括最小权限配置、证书安装部署及自动更新维护的完整实践方案
---

# 使用 acme.sh 配合 Cloudflare API 令牌申请 SSL 证书完整教程

在网站安全中，SSL 证书的管理至关重要。本文将详细介绍如何使用 acme.sh 脚本配合 Cloudflare 新版 API 令牌系统来自动化管理您的 SSL 证书。

## 为什么要使用 Cloudflare API 令牌？

相比使用 Cloudflare 的全局 API 密钥，新版 API 令牌系统提供了更细粒度的权限控制。这种方式遵循最小权限原则，只需要授予证书管理所需的必要权限，大大提高了安全性。

## 准备工作

开始之前，请确保您具备：

- 在 Cloudflare 托管的域名
- 服务器的 Shell 访问权限
- 基本的命令行操作知识

## 一、安装配置 acme.sh 脚本

首先，我们需要安装必要的依赖和 acme.sh 脚本：

```shell
# 更新软件源并安装 socat
apt update && apt -y install socat

# 安装 acme.sh 脚本
wget -qO- get.acme.sh | bash

# 使环境变量生效
source ~/.bashrc

# 设置默认证书颁发机构为 Let's Encrypt
acme.sh --set-default-ca --server letsencrypt
```

## 二、配置 Cloudflare API 令牌

1. 登录 Cloudflare 控制面板
2. 进入"个人资料 → API 令牌"页面
3. 创建新的 API 令牌，需要配置以下权限：
   - 区域 - DNS - 编辑
   - 区域 - 区域 - 读取
4. 设置令牌范围为"包括-账户的所有区域"
5. 务必保存生成的令牌，因为它只会显示一次！

## 三、获取 Cloudflare ID 信息

您需要准备：

- 账户 ID（在域名概览页面可以找到）
- 区域 ID（在域名概览页面可以找到）

## 四、申请证书

使用 API 令牌申请证书：

```shell
# 设置 Cloudflare 凭证
export CF_Token="您的API令牌"
export CF_Account_ID="您的账户ID"
export CF_Zone_ID="您的区域ID"  # 可选但建议设置

# 申请证书（包含泛域名）
acme.sh --issue -d example.com -d *.example.com --dns dns_cf -k ec-256
```

## 五、安装证书

将证书安装到指定位置：

```shell
# 基础安装
acme.sh --installcert -d example.com -d *.example.com \
  --fullchain-file /etc/ssl/web.crt \
  --key-file /etc/ssl/web.key \
  --ecc

# 安装并自动重启服务
acme.sh --installcert -d example.com -d *.example.com \
  --fullchain-file /etc/ssl/web.crt \
  --key-file /etc/ssl/web.key \
  --ecc \
  --reloadcmd "systemctl restart webserver"
```

## 证书更新管理

acme.sh 会自动处理证书更新，证书有效期为 90 天，每 60 天自动更新一次。安装时会自动添加更新计划任务：

```bash
# 查看计划任务
crontab -l

# 预期输出类似：
# 56 * * * * "/root/.acme.sh"/acme.sh --cron --home "/root/.acme.sh" > /dev/null
```

如需手动强制更新：

```bash
# ECC 证书更新
acme.sh --renew -d example.com -d *.example.com --force --ecc

# 非 ECC 证书更新
acme.sh --renew -d example.com -d *.example.com --force
```

### 验证证书内容和有效期

```shell
openssl x509 -in /etc/ssl/web.crt -noout -dates
```

## 移除证书

查看证书集合：

```bash
acme.sh --list
```

如果需要移除证书：

```bash
acme.sh --remove -d example.com
```

或者直接删除 `~/.acme.sh/` 目录下对应的域名文件夹。

## 总结

使用 acme.sh 配合 Cloudflare API 令牌系统不仅可以安全地管理 SSL 证书，还能实现自动化更新，大大减少了维护工作。通过细粒度的权限控制，既保证了安全性，又提供了便利性。

## 参考资料

- [acme.sh DNS API 文档](https://github.com/acmesh-official/acme.sh/wiki/dnsapi)
- [Cloudflare API 令牌文档](https://developers.cloudflare.com/api/tokens/)
- [使用ACME申请泛域名证书并自动续期](https://www.sinabc.xyz/index.php/archives/105/)
