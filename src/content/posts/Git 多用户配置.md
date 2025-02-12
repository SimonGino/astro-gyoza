---
title: Git 多用户配置
author: Jinx
date: 2025-02-12
slug: git-multi-user-config
featured: false
draft: false
categories:
  - git
tags:
  - Xray
  - 网络配置
  - 服务器部署
  - 安全配置
description: 详细介绍Xray的安装、配置和维护过程，包括基础安装、TLS配置、服务管理以及常用运维命令，帮助你快速搭建和管理Xray服务
---

<!-- more -->

很抱歉，我无法直接访问网页链接或获取网页内容。但我可以根据您提供的HTML文件内容，为您生成一篇基于该内容的博客文章。以下是根据您提供的HTML内容整理的博客文章：

---

# Git 多用户配置指南

在日常的开发工作中，我们可能会遇到需要在一台电脑上配置多个 Git 用户信息的情况。比如，我需要在公司电脑上提交个人项目到 GitHub，同时又要使用公司配置的 GitLab 仓库。这种情况下，全局配置就无法满足需求了。今天，我将分享如何在一台电脑上配置多个 Git 用户，以应对类似的需求。

## 一、引言

一般来说，安装好 Git 后，我们都会配置一个全局的 `config` 信息，就像这样：

```bash
git config --global user.name "jitwxs" // 配置全局用户名，如 GitHub 上注册的用户名
git config --global user.email "jitwxs@foxmail.com" // 配置全局邮箱，如 GitHub 上配置的邮箱
```

但当需要在一台电脑上配置多个用户信息时，就不能用一个全局配置来搞定一切了。

## 二、配置多用户

本文将配置 GitHub 和 GitLab 上的两个用户，并分别在它们所属的项目上进行 Git 操作。以下是详细步骤：

### 2.1 清除全局配置

在正式配置之前，先清除全局配置（如果之前配置过的话）。执行以下命令：

```bash
git config --global --list
```

如果发现有 `user.name` 和 `user.email` 信息，请执行以下命令将其清除：

```bash
git config --global --unset user.name
git config --global --unset user.email
```

### 2.2 生成密钥对

密钥对的保存位置默认在 `~/.ssh` 目录下。先清理下这个目录中已存在的密钥对信息，即删除其中的 `id_rsa`、`id_rsa.pub` 等公钥和密钥文件。

首先生成 GitHub 上的仓库密钥对，通过 `-C` 参数填写 GitHub 的邮箱：

```bash
ssh-keygen -t rsa -C “jitwxs@foxmail.com”
```

按下 `ENTER` 键后，会有如下提示：

```
Generating public/private rsa key pair.
Enter file in which to save the key (/Users/jitwxs/.ssh/id_rsa):
```

在这里输入公钥的名字，默认情况下是 `id_rsa`，为了和后面的 GitLab 配置区分，这里输入 `id_rsa_github`。输入完毕后，一路回车，密钥对就生成完毕了。

接下来生成 GitLab 上的仓库密钥对，步骤和上面一样：

```bash
ssh-keygen -t rsa -C “lemon@test.com”
```

生成的公钥名就叫做 `id_rsa_gitlab`。

### 2.3 添加 SSH Keys

将生成的公钥添加到 GitHub 和 GitLab 的 SSH Keys 中。具体操作是将 `id_rsa_github.pub` 和 `id_rsa_gitlab.pub` 文件的内容分别添加到 GitHub 和 GitLab 的 SSH Keys 中。

### 2.4 添加私钥

将私钥添加到本地，以便使用。添加命令如下：

```bash
ssh-add ~/.ssh/id_rsa_github // 将 GitHub 私钥添加到本地
ssh-add ~/.ssh/id_rsa_gitlab // 将 GitLab 私钥添加到本地
```

添加完毕后，可以通过执行 `ssh-add -l` 验证，如果都能显示出来，就说明添加成功了。

### 2.5 管理密钥

通过创建一个密钥配置文件，实现根据仓库的 `remote` 链接地址自动选择合适的私钥。编辑 `~/.ssh` 目录下的 `config` 文件，如果没有，请创建。

配置内容如下：

```bash
Host github
HostName github.com
User jitwxs
IdentityFile ~/.ssh/id_rsa_github

Host gitlab
HostName gitlab.mygitlab.com
User lemon
IdentityFile ~/.ssh/id_rsa_gitlab
```

每个用户配置包含以下几个配置项：

- `Host`：仓库网站的别名，随意取。
- `HostName`：仓库网站的域名（IP 地址应该也可以）。
- `User`：仓库网站上的用户名。
- `IdentityFile`：私钥的绝对路径。

可以通过 `ssh -T` 命令检测配置的 `Host` 是否连通：

```bash
ssh -T git@github
ssh -T git@gitlab
```

### 2.6 仓库配置

完成以上配置后，进入 GitHub 和 GitLab 的仓库目录，为每个仓库单独配置用户名信息。例如，配置 GitHub 的某个仓库：

```bash
git config --local user.name "jitwxs"
git config --local user.email "jitwxs@foxmail.com"
```

执行完毕后，通过以下命令查看本仓库的所有配置信息：

```bash
git config --local --list
```

至此，你已经配置好了 Local 级别的配置，提交代码时，提交用户名就是你设置的 Local 级别的用户名了。

## 总结

通过以上步骤，我们可以在一台电脑上配置多个 Git 用户，并根据不同的仓库自动切换用户信息。这对于需要同时使用多个 Git 仓库的开发者来说非常实用。希望这篇文章对你有所帮助！
