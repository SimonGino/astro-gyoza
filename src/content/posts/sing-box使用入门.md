---
title: sing-box使用入门
author: Jinx
date: 2025-08-30
lastMod: 2025-12-29T14:34:00.000Z
slug: sing-box-usage-guide
featured: false
draft: false
category: sing-box
tags:
  - Linux
  - sing-box
  - 代理
  - 分流
  - DNS
  - IPv6
  - 网络调优
description: sing-box 是一个功能强大的代理工具，支持多种协议和灵活的配置选项。本文将介绍 sing-box 的基本概念、安装方法、配置示例以及常见问题解决方案，帮助用户快速上手并高效使用该工具。
---

# sing-box使用入门

> 目标：5 分钟跑起来，30 分钟理解结构。文章顺序：概念 → 安装 → 常用命令 → 证书 → 基础配置 → 分流 DNS → IPv6 场景 → 最佳实践 & 常见问题。

## 1. 核心概念速览

| 名称                    | 作用                             | 典型内容                                                     |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ |
| inbounds                | 本机 / 服务端“入口”              | 协议定义（trojan / vless / shadowsocks / hysteria2 等）      |
| outbounds               | 出口策略                         | direct / block / 一些中转链路（vmess、trojan、wireguard 等） |
| route.rules             | 按条件匹配流量 → 指定 outbound   | 条件包含：domain / ip / rule_set / protocol / port           |
| route.rule_set          | 远程或本地规则集合（SRS / JSON） | geosite / geoip 分类集合                                     |
| dns                     | 内置 DNS 解析与分流              | 可为不同请求指定不同的上游 server                            |
| experimental.cache_file | 元数据缓存                       | 降低重复下载规则的开销                                       |

理解：数据包进入某个 inbound → route 依据规则决定使用哪个 outbound → outbound 真实发出。

## 2. 安装

```shell
bash <(curl -fsSL https://sing-box.app/deb-install.sh)
```

其他方式（示例）：

```shell
# 二进制（以 v1.x.x 为例）
curl -L https://github.com/SagerNet/sing-box/releases/download/v1.x.x/sing-box-1.x.x-linux-amd64.tar.gz | tar xz
sudo mv sing-box-*/sing-box /usr/local/bin/
sing-box version
```

升级：重新执行安装脚本或替换二进制；更新 geosite/geoip 放在“最佳实践”章节。

## 3. 常用控制命令

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

辅助：

```shell
# 仅校验配置语法
sing-box check -c /usr/local/etc/sing-box/config.json
# 前台运行（调试时用）
sing-box run -c /usr/local/etc/sing-box/config.json
```

## 4. 自定义证书（可选）

适用于需要自签证书的协议（如 hysteria2 / reality 替换场景）。下面命令生成 ECC 自签证书，仅供测试：

```shell
mkdir -p /etc/hysteria
# 生成证书
openssl req -x509 -nodes -newkey ec:<(openssl ecparam -name prime256v1) -keyout /etc/hysteria/server.key -out /etc/hysteria/server.crt -subj "/CN=bing.com" -days 36500 && chown hysteria /etc/hysteria/server.key && chown hysteria /etc/hysteria/server.crt
```

端口转发

```shell
iptables -t nat -A PREROUTING -i eth0 -p udp --dport 50020:50030 -j REDIRECT --to-ports 50003
ip6tables -t nat -A PREROUTING -i eth0 -p udp --dport 50020:50030 -j REDIRECT --to-ports 50003
```

说明：上面 iptables 把一段 UDP 端口区间重定向到 50003（例如 hysteria2 inbound 监听），便于穿透/复用端口。视环境关闭防火墙冲突（如 firewalld）。

## 5. 最小配置骨架示例

服务端默认配置：只需填充需要的 inbounds（例如 trojan / shadowsocks）。

```json
{
  "log": {
    "level": "info"
  },
  "dns": {
    "servers": [
      {
        "address": "tls://8.8.8.8"
      }
    ]
  },
  "inbounds": [],
  "outbounds": [
    {
      "type": "direct"
    }
  ]
}
```

[inbounds配置模板](https://github.com/chika0801/sing-box-examples)

### 常用 inbound 片段参考

socks5:

```json
{
  "type": "socks",
  "listen": "::",
  "listen_port": 1080,
  "users": [
    {
      "username": "admin",
      "password": "admin"
    }
  ]
}
```

Shadowsocks：

```json
{
  "type": "shadowsocks",
  "listen": "::",
  "listen_port": 80,
  "method": "2022-blake3-aes-128-gcm",
  "password": "", // 执行 sing-box generate rand 16 --base64 生成
  "multiplex": {
    "enabled": true
  }
}
```

Trojan：

```json
{
  "type": "trojan",
  "listen": "::",
  "listen_port": 443,
  "users": [
    {
      "password": ""
    }
  ],
  "tls": {
    "enabled": true,
    "certificate_path": "/root/fullchain.cer",
    "key_path": "/root/private.key"
  },
  "multiplex": {
    "enabled": true
  }
}
```

Hysteria2：

```json
{
  "type": "hysteria2",
  "listen": "::",
  "listen_port": 443,
  "up_mbps": 100,
  "down_mbps": 20,
  "users": [
    {
      "password": ""
    }
  ],
  "tls": {
    "enabled": true,
    "alpn": ["h3"],
    "certificate_path": "/root/fullchain.cer",
    "key_path": "/root/private.key"
  }
}
```

anytls:

```json
{
  "type": "anytls",
  "tag": "anytls-in",
  "listen": "0.0.0.0",
  "listen_port": 50003,
  "users": [
    {
      "name": "",
      "password": "password"
    }
  ],
  "tls": {
    "enabled": true,
    "server_name": "bing.com",
    "certificate_path": "/etc/hysteria/server.crt",
    "key_path": "/etc/hysteria/server.key"
  }
}
```

（把片段放进上面骨架的 inbounds 数组即可，注意端口 与 firewall 放行）

## 6. DNS 分流配置示例（含解锁场景）

如果 VPS 商家支持 dns 解锁 YouTube / Netflix / Disney 等，可以采用 DNS 分流：

```json
{
  "log": {
    "disabled": false,
    "level": "info",
    "timestamp": true
  },
  "dns": {
    "servers": [
      {
        "tag": "local",
        "type": "local"
      },
      {
        "tag": "wda",
        "type": "udp",
        "server": "22.22.22.22"
      }
    ],
    "rules": [
      {
        "ip_version": 4,
        "outbound": "any",
        "server": "local"
      }
    ],
    "final": "local",
    "strategy": "ipv4_only",
    "disable_cache": false,
    "disable_expire": false,
    "independent_cache": false
  },
  "inbounds": [],
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct",
      "tcp_fast_open": true,
      "tcp_multi_path": true
    },
    {
      "type": "direct",
      "tag": "unlock",
      "tcp_fast_open": true,
      "tcp_multi_path": true,
      "domain_resolver": "wda"
    },
    {
      "type": "block",
      "tag": "block"
    }
  ],
  "route": {
    "default_domain_resolver": {
      "server": "local",
      "rewrite_ttl": 60
    },
    "rule_set": [
      {
        "tag": "geosite-openai",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/rule-set/geosite-openai.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geosite-claude",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/refs/heads/rule-set/geosite-anthropic.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geosite-netflix",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/refs/heads/rule-set/geosite-netflix.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geosite-google-gemini",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/refs/heads/rule-set/geosite-google-gemini.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geosite-google-play",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/refs/heads/rule-set/geosite-google-play.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geosite-google",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/refs/heads/rule-set/geosite-google.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geosite-youtube",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/refs/heads/rule-set/geosite-youtube.srs",
        "download_detour": "direct"
      },
      {
        "tag": "geosite-twitter",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/SagerNet/sing-geosite/raw/refs/heads/rule-set/geosite-twitter.srs",
        "download_detour": "direct"
      }
    ],
    "rules": [
      {
        "protocol": ["bittorrent", "quic"],
        "outbound": "block"
      },
      {
        "rule_set": [
          "geosite-claude",
          "geosite-openai",
          "geosite-twitter",
          "geosite-netflix",
          "geosite-youtube",
          "geosite-google-gemini",
          "geosite-google-play",
          "geosite-google"
        ],
        "outbound": "unlock"
      }
    ]
  },
  "experimental": {
    "cache_file": {
      "enabled": true
    }
  }
}
```

关键点：

1. 设置多个 dns servers（本地 + 解锁）
2. 利用 route.rule_set + outbound("unlock") 对特定域名分类
3. domain_resolver 指定哪个 DNS 解析哪些站点

## 7. IPv6 解锁示例

如果 VPS 支持 IPv6 且某些流媒体通过 IPv6 可直连，可以：

```json
{
  "outbounds": [
    {
      "type": "direct",
      "tag": "IPv6",
      "domain_strategy": "ipv6_only"
    },
    {
      "type": "direct",
      "tag": "direct"
    }
  ],
  "route": {
    "rules": [
      {
        "rule_set": ["geoip-netflix", "geosite-netflix"],
        "outbound": "IPv6"
      }
    ],
    "rule_set": [
      {
        "tag": "geoip-netflix",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/netflix.srs",
        "download_detour": "direct",
        "update_interval": "1d"
      },
      {
        "tag": "geosite-netflix",
        "type": "remote",
        "format": "binary",
        "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/netflix.srs",
        "download_detour": "direct",
        "update_interval": "1d"
      }
    ],
    "auto_detect_interface": true,
    "final": "direct"
  }
}
```

## 8. 最佳实践

| 目标         | 建议                                                  |
| ------------ | ----------------------------------------------------- |
| 降低维护成本 | 把可变部分（密码 / 端口）使用环境变量或模板生成脚本   |
| 日志观测     | 初期 log.level=info，稳定后降到 warn                  |
| 减少阻塞     | DNS 使用本地 + 一条远程（DoH / DoT），避免全部走远端  |
| 安全         | 关闭不使用的协议；证书/私钥权限 600；避免明文密码复用 |
| 升级         | 版本更新后先 sing-box check 验证语法再 reload         |
| 规则更新     | 定期下载 geosite/geoip；失败回退缓存                  |

更新规则（示例脚本片段）：

```shell
RULE_DIR=/usr/local/share/sing-box
curl -L -o "$RULE_DIR/geosite.db" https://github.com/SagerNet/sing-geoip/releases/latest/download/geosite.db
curl -L -o "$RULE_DIR/geoip.db" https://github.com/SagerNet/sing-geoip/releases/latest/download/geoip.db
systemctl reload sing-box
```

## 9. 常见问题

| 问题                | 可能原因                                   | 处理                                                              |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| 客户端连接超时      | 端口未放行 / inbound 绑定地址错误          | 使用 `ss -lntup` 检查监听，确认安全组 / 防火墙                    |
| DNS 解锁不生效      | domain_resolver 未指向 unlock / 规则未命中 | 日志里加 `log.domain = true`（新版本特性若支持）或临时升 log 级别 |
| reload 无效         | 旧版本不支持热载指定变更                   | 使用 restart 或升级 sing-box                                      |
| CPU 占用高          | 极高并发 + 过多 rule_set                   | 合并/精简规则；启用 cache_file                                    |
| Netflix 仍走 direct | 规则优先级不够                             | 确保流媒体规则在早期 rules 里，未被前面匹配截走                   |

## 10. 参考与扩展

- 官方文档：https://sing-box.sagernet.org/
- 规则样例仓库：https://github.com/chika0801/sing-box-examples
- geosite / geoip 发布：https://github.com/SagerNet/sing-geoip

## 11. 总结

记住主线：入口(inbounds) → 分流(route.rules + rule_set) → 出口(outbounds) → DNS 保障解析一致性。逐步加复杂度，不要一开始塞满所有规则。
