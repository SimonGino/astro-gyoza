---
title: Nginx服务启动PID解析失败问题排查与解决
author: Jinx
date: 2024-01-01
slug: nginx-failed-to-parse-pid-causes-and-solutions
featured: true
draft: false
categories:
  - nginx
tags:
  - Nginx配置
  - systemd
  - PID文件
  - 服务启动
description: 详细分析Nginx服务启动时Failed to parse PID的原因，包括systemd与Nginx的资源竞争问题，并提供通过修改systemd服务配置文件解决PID解析失败的完整解决方案
---

很久以前用Apache，后来偷懒就用Nginx了，毕竟轻量也够用。但是在某些机子(大概率和性能有关)上使用`systemctl status nginx`查看Nginx状态的时候，会出现以下报错内容：

<!-- more -->

```shell
nginx.service: Failed to parse PID from file /run/nginx.pid: Invalid argument
```

此报错的根源在于Nginx和systemd抢夺资源，systemd作为进程守护会读取PIDFile以实现在Nginx停止后删除PIDFile，但是Nginx启动需要时间，systemd在nginx完成启动前就去读取，从而导致了这个报错。  
处理方法也很简单，让systemd在执行`ExecStart`后等待一段时间（比如1秒钟）即可。首先，打开`/usr/lib/systemd/system/nginx.service`文件，将`ExecStartPost=/bin/sleep 1`加入到`ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'`这行下面（具体代码在文末），然后依次执行systemd的重启`systemctl daemon-reload`和`systemctl restart nginx.service`之后，就会发现一切正常了。

```shell
[Unit]
Description=A high performance web server and a reverse proxy server
Documentation=man:nginx(8)
After=network.target nss-lookup.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t -q -g 'daemon on; master_process on;'
ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'
ExecStartPost=/bin/sleep 1
ExecReload=/usr/sbin/nginx -g 'daemon on; master_process on;' -s reload
ExecStop=-/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /run/nginx.pid
TimeoutStopSec=5
KillMode=mixed

[Install]
WantedBy=multi-user.target
```
