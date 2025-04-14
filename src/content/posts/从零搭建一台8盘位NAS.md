---
title: 从零搭建一台8盘位NAS
date: 2025-04-13 10:08:00
author: Jinx
slug: build-a-8-bay-nas
featured: true
draft: false
category: NAS

tags:
  - 8盘位
  - 硬盘
  - 组装
  - NAS
  - DIY
---

## 前言

随着数字数据的不断增长，拥有一个可靠、大容量且可远程访问的存储解决方案变得越来越重要。本文记录了从零开始组装一台 8 盘位 NAS（网络附加存储）服务器的过程，涵盖了硬件选购、系统安装、DDNS 配置以及关键 Docker 应用的部署。希望能为同样对 DIY NAS 感兴趣的朋友提供一些参考。

<!-- more -->

## 硬件准备

选择合适的硬件是搭建 NAS 的第一步。考虑到性能、功耗、扩展性和成本，我选择了以下配置：

| 名称     | 型号                       | 数量 | 价格 | 备注                                      |
| :------- | :------------------------- | :--- | :--- | :---------------------------------------- |
| 主板     | 华硕TUF GAMING B360M-PLUS  | 1    | 150  | 支持多 SATA 接口，稳定性不错              |
| 处理器   | Intel i3-8100              | 1    | 112  | 低功耗，性能足够 NAS 使用                 |
| 内存     | 威刚 游戏威龙DDR4 3200 16G | 1    | 106  | 16G 内存满足 Docker 和多任务需求          |
| 散热器   | 冰蝶3热管itx下压式散热器   | 1    | 43   | 适用于 ITX 或紧凑型机箱                   |
| 机箱     | 射手座                     | 1    | 318  | 8 盘位，体积相对紧凑                      |
| 电源     | 先马 平头哥650 500W        | 1    | 116  | 功率足够，为未来硬盘扩展留有余量          |
| 风扇     | 先马平头哥V1彩光版         | 5    | 38   | 加强机箱散热                              |
| 机械硬盘 | 西数HC550 16T              | 1    | 1628 | 企业级硬盘，用于主要数据存储 (后续可扩展) |
| 固态硬盘 | 铠侠 1T                    | 1    | 439  | 用作系统盘和 Docker 应用存储              |
| **总计** |                            |      | 2950 |                                           |

组装完成后的效果图：

![3ceafc3e1e1d500a3428ac16c875be07_720](https://oss.mytest.cc/2025/04/e176cb2265b39cefe1483b63833f41f9.jpg)

## 系统选择

### FnOS

对于 NAS 系统，市面上有多种选择，如 TrueNAS Core/Scale, Unraid, OpenMediaVault (OMV) 以及一些国产系统。本次我选择了 **FnOS**。

**选择理由:**

- **界面友好:** FnOS 提供了相对简洁直观的 Web 管理界面，对新手比较友好。
- **功能集成:** 集成了常用的 NAS 功能，如文件共享 (SMB/NFS)、Docker 支持、用户权限管理等。
- **社区支持:** 国内用户较多，遇到问题时方便查找资料或寻求帮助。
- **安装便捷:** 安装过程相对简单，有清晰的官方文档指引。

[FnOS 官方安装教程](https://help.fnnas.com/articles/fnosV1/start/install-os.md)

### DDNS 设置

为了能够从外网访问家中的 NAS，需要配置动态域名解析 (DDNS)。由于家庭宽带通常是动态 IP，DDNS 服务可以将一个固定的域名指向这个动态变化的 IP 地址。

我使用的域名托管在 **Cloudflare**，FnOS 内置了对 Cloudflare DDNS 的支持。配置如下：

- 服务商选择 `Cloudflare`。
- 域名填入你想要使用的域名（例如 `nas.yourdomain.com`）。
- 用户名/ID 留空。
- 密码/密钥填入 **Cloudflare API Token**。

**获取 Cloudflare API Token:**

1.  登录 Cloudflare Dashboard。
2.  进入 "My Profile" -> "API Tokens"。
3.  创建一个新的 API Token。
4.  选择 "Edit zone DNS" 模板，或者自定义权限，确保 Token 具有读取和编辑你域名所在区域 (Zone) 的 DNS 记录的权限。
5.  将生成的 Token 复制并粘贴到 FnOS 的 DDNS 设置中。

![image-20250414103126806](https://oss.mytest.cc/2025/04/005b2af385cb4ea7699cc795617bf901.png)

## Docker 应用

Docker 是目前非常流行的容器化技术，可以方便地部署和管理各种应用程序，极大地扩展了 NAS 的功能。以下是我部署的一些关键 Docker 应用：

![image-20250414101947244](https://oss.mytest.cc/2025/04/af282f299095c623d2a6c03cf07512e1.png)

### MoviePilot

**简介:** MoviePilot 是一个强大的自动化媒体管理工具。它可以监控 BT/PT 站点的种子发布，根据预设规则自动下载电影、电视剧等媒体资源，并进行分类整理、刮削元数据、通知等一系列操作，极大地简化了影音库的管理。

**Docker Compose 配置:**

```yaml
version: '3.3'
services:
  moviepilot:
    image: jxxghp/moviepilot-v2:latest
    container_name: moviepilot-v2
    hostname: moviepilot-v2
    stdin_open: true # 标准输入打开
    tty: true # 分配伪TTY
    network_mode: host # 使用 host 网络模式，方便访问其他内网服务
    # ports: # host模式下无需映射端口
    #  - '3000:3000' # Nginx 端口
    #  - '3001:3001' # WebUI 端口
    volumes:
      - '/vol1/1000/video:/vol1/1000/video' # 媒体库目录映射，冒号前为主机路径，冒号后为容器路径
      - '/moviepilot-v2/config:/config' # 配置文件目录映射
      - '/moviepilot-v2/core:/moviepilot/.cache/ms-playwright' # 缓存目录映射 (可选，用于 Playwright)
      - '/var/run/docker.sock:/var/run/docker.sock:ro' # 映射 Docker Socket (只读)，用于容器内管理下载器等
    environment:
      - 'NGINX_PORT=3000' # Nginx 监听端口 (容器内)
      - 'PORT=3001' # WebUI 监听端口 (容器内)
      - 'PUID=0' # 以 root 用户运行 (根据实际情况调整)
      - 'PGID=0' # 以 root 组运行 (根据实际情况调整)
      - 'UMASK=000' # 文件权限掩码 (确保 MoviePilot 有权限写入媒体库)
      - 'TZ=Asia/Shanghai' # 设置时区
      # - 'AUTH_SITE=iyuu' # 自动登录认证站点 (v2.0.7+ 可在 UI 配置)
      # - 'IYUU_SIGN=xxxx' # IYUU 令牌 (v2.0.7+ 可在 UI 配置)
      - 'SUPERUSER=admin' # 设置超级用户名
      # - 'API_TOKEN=无需手动配置，系统会自动生成。如需自定义，必须为16位以上复杂字符串'
      # - 'PROXY_HOST=http://192.168.31.175:7890' # 如果需要网络代理，在此配置
    restart: always # 设置容器总是自动重启
```

**相关教程:**

- [MoviePilotV2使用教程](https://blog.2nest.top/article/mpv2#137f8ca0c5208023b951c8563a4c7e72)
- [mihomo教程](https://club.fnnas.com/forum.php?mod=viewthread&tid=17623&highlight=mihomo) (如果需要配合代理使用)

### Nginx Proxy Manager (NPM)

**简介:** Nginx Proxy Manager 是一个基于 Nginx 的反向代理管理工具，拥有图形化界面。它可以轻松地将内网的多个 Web 服务（如 qBittorrent WebUI, Jellyfin, Emby, NAS 管理界面等）通过不同的域名或子域名安全地暴露到公网，并能自动申请和管理 Let's Encrypt 的 SSL 证书，实现 HTTPS 加密访问。

**Docker Compose 配置:**

```yaml
services:
  npm: # 服务名称
    image: 'jc21/nginx-proxy-manager:latest' # 使用官方最新镜像
    container_name: nginx-proxy-manager # 容器名称
    restart: unless-stopped # 除非手动停止，否则容器总是尝试重启
    ports:
      # 格式: <主机端口>:<容器端口>
      - '50001:80' # 公网 HTTP 访问端口 (映射到主机的 50001)
      - '50002:443' # 公网 HTTPS 访问端口 (映射到主机的 50002)
      - '50003:81' # NPM 管理后台 WebUI 端口 (映射到主机的 50003)
      # - '21:21' # 如果需要代理其他 TCP/UDP 端口 (Stream)，在此添加
    volumes:
      - './data:/data' # NPM 数据目录映射 (存储配置、日志等)
      - './letsencrypt:/etc/letsencrypt' # Let's Encrypt 证书及配置目录映射
```

**配置步骤:**

1.  启动容器后，通过 `http://<NAS_IP>:50003` 访问 NPM 的管理后台。
2.  首次登录需要设置管理员邮箱和密码。
3.  **配置 SSL 证书:**
    - 在 "SSL Certificates" 页面，点击 "Add SSL Certificate" -> "Let's Encrypt"。
    - 输入你的域名（建议使用泛域名，如 `*.yourdomain.com`）和邮箱。
    - 勾选 "Use a DNS Challenge"。
    - 选择你的 DNS 提供商（如 Cloudflare）。
    - 填入之前获取的 Cloudflare API Token（或者根据提示创建具有特定权限的 Token）。
    - 勾选同意 Let's Encrypt 的服务条款，然后保存。NPM 会自动完成 DNS 验证并获取证书。
4.  **配置代理主机 (Proxy Hosts):**
    - 在 "Hosts" -> "Proxy Hosts" 页面，点击 "Add Proxy Host"。
    - **Details Tab:**
      - `Domain Names`: 输入你想从外网访问的域名（例如 `qb.yourdomain.com`）。
      - `Scheme`: 选择内网服务使用的协议 (`http` 或 `https`)。
      - `Forward Hostname / IP`: 输入内网服务的 IP 地址（例如 NAS 的 IP `192.168.31.175`）。
      - `Forward Port`: 输入内网服务对应的端口（例如 qBittorrent 的 WebUI 端口 `8085`）。
      - 勾选 `Block Common Exploits` (推荐)。
    - **SSL Tab:**
      - `SSL Certificate`: 选择刚才申请的 Let's Encrypt 证书。
      - 勾选 `Force SSL` (强制 HTTPS 访问，推荐)。
      - 勾选 `HTTP/2 Support` (推荐)。
    - 保存配置。
5.  现在，你应该可以通过 `https://qb.yourdomain.com` (使用了你在 NPM 中配置的公网 HTTPS 端口，例如 `https://qb.yourdomain.com:50002`) 来访问你的 qBittorrent WebUI 了。对其他需要暴露的服务重复此步骤。

**参考教程:** [Nginx Proxy Manager With Cloudflare Step-by-Step Guide](https://jwinks.com/p/nginx-proxy-manager/)

### 内地组网 Tailscale (计划中)

**简介:** Tailscale 是一个基于 WireGuard 的现代化 VPN 服务，它可以轻松地在你的所有设备（电脑、手机、服务器等）之间创建一个安全的私有网络，实现所谓的“零配置 VPN”。

**计划用途:**

- **安全远程访问:** 即使在没有公网 IP 或者不想将服务直接暴露到公网的情况下，也能通过 Tailscale 网络安全地访问 NAS 上的资源和服务。
- **异地组网:** 将位于不同物理位置的设备连接到同一个虚拟局域网中，方便文件共享和互相访问。

这部分的具体配置和实践将在后续进行。

## 总结

通过以上步骤，我们成功地从零开始组装并配置了一台功能强大的 8 盘位 NAS。它不仅满足了基本的存储需求，还通过 Docker 部署了自动化媒体管理和安全的远程访问方案。虽然硬件成本接近 3000 元，但其灵活性、可扩展性和自主可控性是成品 NAS 难以比拟的。

当然，NAS 的玩法远不止于此，未来还可以探索更多有趣的应用，例如部署 Home Assistant 智能家居中枢、搭建个人博客、运行代码仓库等等。希望这次的分享能给你带来启发！
