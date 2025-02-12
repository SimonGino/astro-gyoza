---
title: Docker部署MySQL数据库配置指南
author: Jinx
date: 2023-12-05
slug: docker-mysql-setup-guide
featured: true
draft: false
category: docker
tags:
  - 数据库部署
  - MySQL配置
  - 权限管理
  - docker-compose
description: 详细介绍使用Docker部署MySQL数据库的完整流程，包括容器创建、数据持久化、用户权限配置、远程访问设置以及Docker Compose编排的最佳实践
---

<!-- more -->

## docker安装MySQL5.7版本

```shell
docker pull mysql/mysql-server:5.7
docker run -d --name mysql5.7 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=jinpeng1030 mysql/mysql-server:5.7
```

如果没有权限登陆

```shell
docker exec -it mysql5.7 bash

# 登陆mysql
mysql -uroot -p

# 将root用户的Host 由 localhost 修改为 %
update mysql.user set Host = '%' where User = 'root';

# 刷新(刷新可以使用IP登陆，图形化界面登陆)
flush privileges;
```

### docker compose部署

```yml
version: '3'
services:
  mysql:
    image: mysql
    container_name: mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: example
    ports:
      - 3306:3306
    volumes:
      - /data/mysql/my.cnf:/etc/my.cnf
      - /data/mysql/db:/var/lib/mysql
    network_mode: 'bridge' # "host"
```

### mysql账号创建与赋权

- 创建用户

CREATE USER 'username'@'host' IDENTIFIED BY 'password';

说明： username：你将创建的用户名

host：指定该用户在哪个主机上可以登陆，如果是本地用户可用localhost，如果想让该用户可以从任意远程主机登陆，可以使用通配符%

password：该用户的登陆密码，密码可以为空，如果为空则该用户可以不需要密码登陆服务器

- 授权

GRANT privileges ON databasename.tablename TO 'username'@'host'

说明: privileges：用户的操作权限，如SELECT，INSERT，UPDATE等，如果要授予所的权限则使用ALL

databasename：数据库名 tablename：表名，如果要授予该用户对所有数据库和表的相应操作权限则可用表示，如.\*

例子:

GRANT SELECT, INSERT ON test.user TO 'pig'@'%';

GRANT ALL ON _._ TO 'pig'@'%';

4.已建账号说明

目前因phecha项目使用非自建数据库，暂未建账号，其他5个项目均已建立备份账号

账号：{项目名小写}

密码：{项目名首字母大写\*\*9330}
