---
title: Git Stash命令完全指南
author: Jinx
date: 2023-12-05
slug: git-stash-complete-guide
featured: true
draft: false
category: git
tags:
  - git stash
  - 版本控制
  - 工作区管理
  - 代码暂存
description: 详细介绍Git Stash命令的使用方法与最佳实践，包括保存工作区状态、查看stash列表、应用与删除stash等常用操作，以及在多任务开发场景下的实际应用案例
---

因在开发过程中本来正常开发一个需求中，但是突然有个别的小需求插入进来，导致需要在同一分支上修改代码，这是就可以用到git stash命令了。

<!-- more -->

常用git stash命令：

（1）git stash save "save message" : 执行存储时，添加备注，方便查找，只有git stash 也要可以的，但查找时不方便识别。

（2）git stash list ：查看stash了哪些存储

（3）git stash show ：显示做了哪些改动，默认show第一个存储,如果要显示其他存贮，后面加stash@{$num}，比如第二个 git stash show stash@{1}

（4）git stash show -p : 显示第一个存储的改动，如果想显示其他存存储，命令：git stash show stash@{$num} -p ，比如第二个：git stash show stash@{1} -p

（5）git stash apply :应用某个存储,但不会把存储从存储列表中删除，默认使用第一个存储,即stash@{0}，如果要使用其他个，git stash apply stash@{$num} ， 比如第二个：git stash apply stash@{1}

（6）git stash pop ：命令恢复之前缓存的工作目录，将缓存堆栈中的对应stash删除，并将对应修改应用到当前的工作目录下,默认为第一个stash,即stash@{0}，如果要应用并删除其他stash，命令：git stash pop stash@{$num} ，比如应用并删除第二个：git stash pop stash@{1}

（7）git stash drop stash@{$num} ：丢弃stash@{$num}存储，从列表中删除这个存储

（8）git stash clear ：删除所有缓存的stash

说明:新增的文件，直接执行stash是不会被存储的，举例如下：

原文链接：
https://www.cnblogs.com/zndxall/p/9586088.html
