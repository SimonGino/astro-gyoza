---
title: macOS下Anaconda环境配置完整指南
author: Jinx
date: 2024-04-03
slug: macos-anaconda-setup-guide
featured: true
draft: false
category: tools
tags:
  - Anaconda
  - Python环境
  - Homebrew
  - PyCharm配置
description: 详细介绍在macOS系统上安装和配置Anaconda的完整流程，包括Homebrew安装、环境变量配置、conda初始化以及PyCharm IDE的整合设置
---

## 安装

```sh
brew install anaconda
```

## 环境变量配置

```sh
echo 'export PATH="/opt/homebrew/anaconda3/bin:$PATH"' >> ~/.zshrc
```

这样是不够的，在执行一些命令的时候还是会有问题，需要再次执行一下

```sh
conda init zsh
```

这条命令会自动将环境变量写入到zshrc中，并自动注释掉上面的那行export

```sh
source ~/.zshrc
```

## Pycharm配置conda executable

路径在`/opt/homebrew/anaconda3/condabin/conda`
之后点击 Load Environments
