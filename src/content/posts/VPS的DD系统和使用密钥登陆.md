---
title: Linux系统重装与SSH密钥配置指南
author: Jinx
date: 2024-07-31
slug: linux-reinstall-ssh-key-setup
featured: true
draft: false
categories:
  - linux
tags:
  - DD系统
  - SSH配置
  - 系统重装
  - 安全加固
description: 详细介绍VPS服务器的系统重装(DD)过程和SSH密钥登录配置，包括系统安装脚本使用、阿里云服务卸载、SSH安全配置等完整教程
---

# VPS的DD系统和使用密钥登陆

## DD系统

来源: https://github.com/leitbogioro/Tools/

```sh
apt update -y
apt install wget -y
wget --no-check-certificate -qO InstallNET.sh 'https://raw.githubusercontent.com/leitbogioro/Tools/master/Linux_reinstall/InstallNET.sh' && chmod a+x InstallNET.sh
bash InstallNET.sh -debian 11 -timezone "Asia/Shanghai" --bbr
```

得到的默认用户和密码: root/LeitboGi0ro

其中选用

## **Uninstall-aliyun-service**

```sh
wget -N --no-check-certificate https://raw.githubusercontent.com/babywbx/Uninstall-aliyun-service/master/UAS.sh && chmod 777 UAS.sh && ./UAS.sh
```

## debian设置ssh密钥登录

已有密钥id_rsa.pub，之后复制到authorized_keys里

```sh
mkdir -p ~/.ssh
vim authorized_keys
```

设置权限

```sh
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys\
```

设置 SSH，打开密钥登录功能

编辑 /etc/ssh/sshd_config 文件，进行如下设置（删除这两行前面的注释#）：

```
AuthorizedKeysFile      .ssh/authorized_keys .ssh/authorized_keys2
PubkeyAuthentication yes
```

重启ssh服务：

```sh
service sshd restart
```

确保root用户能够通过密钥登录。

当你完成全部设置，并以密钥方式登录成功后，再禁用密码登录：

```
PasswordAuthentication no
```

最后，重启 SSH 服务：

```
service sshd restart
```
