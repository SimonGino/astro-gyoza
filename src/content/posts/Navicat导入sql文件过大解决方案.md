---
title: Navicat导入大型SQL文件的故障排查与解决方案
author: Jinx
date: 2023-12-06
slug: navicat-import-large-sql-file-solution
featured: true
draft: false
categories:
  - database
tags:
  - Navicat
  - MySQL配置
  - 性能调优
  - 数据导入
description: 详细解析Navicat导入大型SQL文件时遇到的"MySQL server has gone away"错误，包括问题原因分析、max_allowed_packet参数调整以及客户端与服务端配置修改方案
---

今天工作遇到需要导入一份500M的SQL文件，执行过程中[Err] 2006 – MySQL server has gone away

<!-- more -->

标签入口
![image.png](/static/img/b6837e6c8846adb5f07bc812fde5d24d.image.webp)

## 问题描述

Navicat for MySQL 运行 .sql 文件导入数据时报错：[ERR] 2006 – MySQL server has gone away

## 问题原因

原因是 Navicat for MySQL 对导入的文件大小做了限制，解决方法如下：

## 解决步骤

1.依次点击“工具”->”服务器监控”->”MySQL”，打开服务器监控界面

![image.png](/static/img/02293ffcb6dc33f9766e1aa1b02c09d8.image.webp) 2.选中连接的服务器，在“变量”标签中找到 max_allowed_packet，根据实际情况调大该值。

![image.png](/static/img/c36f9addce85225d8a8b5d893b70ed93.image.webp)
**Case**
如果按上面的方法修改后，仍然无法正常导入，那么就是服务端限制了导入文件大小，需要修改服务端的 mysql 配置文件（Windows系统是my.ini，Linux系统是my.cnf）中的 max_allowed_packet 配置项。

![image.png](/static/img/d7cdb804910dcc14e92f9109a7554647.image.webp)

参考https://www.02405.com/archives/2392
