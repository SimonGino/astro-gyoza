---
title: macOS Homebrew包管理工具完全指南
author: Jinx
date: 2024-09-10
slug: macos-homebrew-complete-guide
featured: true
draft: false
categories:
  - tools
tags:
  - 包管理
  - 环境配置
  - 命令行工具
  - 软件安装
description: 详细介绍macOS下Homebrew包管理工具的完整使用指南，包括基础安装配置、常用命令详解、包管理操作、服务管理以及实用示例的最佳实践
---

# Brew常用命令

### 安装 默认已安装Xcode

```shell
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

#### 卸载

```shell
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/uninstall)"
```

或者下面命令

```shell
cd `brew --prefix`
rm -rf Cellar
brew prune
rm `git ls-files`
rm -r Library/Homebrew Library/Aliases Library/Formula Library/Contributions
rm -rf .git
rm -rf ~/Library/Caches/Homebrew
```

### 基础命令

```shell
#检查Homebrew是否正常
brew doctor

#更新Homebrew
brew update

#查看HomeBrew版本
brew -v

#查看Homebrew帮助
brew -h

#清理包缓存
brew cleanup

#检查已安装包是否需要更新
brew outdated

#查看已安装包列表
brew list
#查看已安装包列表（带版本号）
brew list --versions

#安装任意包
brew install <packageName>

#卸载任意包
brew uninstall <packageName>

#查找可用包
brew search <packageName>

#查看包信息
brew info <packageName>

#查找过期的版本
brew outdated

#更新包
brew upgrade <packageName>

#显示包依赖
brew reps

#显示安装的服务：
brew services list

#安装服务启动、停止、重启：
brew services start/stop/restart <serverName>


## 一些示例
brew deps --installed --tree # 查看已安装软件的依赖树
brew search mysql # 搜索软件
brew search "/(^|.+tap.+)go(@|$)/" # 使用正则表达式搜索，以搜索golang为例
brew info mysql # 查看软件信息
brew install mysql # 安装软件
brew list # 查看已安装软件
brew outdated # 查看过期软件
brew upgrade # 升级所有软件
brew upgrade mysql # 升级指定软件
brew cleanup # 清理旧版本软件
brew uninstall mysql # 卸载软件
brew doctor # 检查问题
```
