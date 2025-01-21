---
title: Git撤销操作完全指南
author: Jinx
date: 2024-07-02
slug: git-undo-operations-guide
featured: true
draft: false
categories:
  - git
tags:
  - 版本控制
  - git reset
  - git revert
description: 全面讲解Git中各种撤销操作的使用方法，包括工作区、暂存区、本地仓库的修改撤销，以及reset和revert命令的区别与实践
---

# Git使用流程记录

## Git撤销操作

### Disk

1. 查看文件差异

   ```shell
   git diff
   ```

2. 查看文件状态（未暂存的更改）

   ```shell
   git status
   ```

3. 恢复文件到之前的状态

   ```shell
   git checkout <changed_file>
   ```

   或者

   ```shell
   git restore <changed_file>
   ```

### Staging

1. 查看文件状态（已暂存的更改）

   ```shell
   git status
   ```

2. 把修改从暂存区移除，但保留硬盘上的修改

   ```shell
   git reset <changed_file>
   ```

   或者

   ```shell
   git restore --staged <changed_file>
   ```

3. 撤销所有修改，包括暂存区和硬盘上的修改

   ```shell
   git checkout HEAD <changed_file>
   ```

### Local

1. 撤销最近一次的commit（保留更改）

   ```shell
   git reset --soft HEAD~1
   ```

2. 撤销commit和暂存区的更改（保留硬盘上的更改）

   ```shell
   git reset HEAD~1
   ```

   或者

   ```shell
   git reset --mixed HEAD~1
   ```

3. 撤销commit、暂存区和硬盘上的更改

   ```shell
   git reset --hard HEAD~1
   ```

### Git Revert

Git revert本质上是增加一条与之前commit相反的新commit。例如，上一个commit是增加一行，这个新的commit会删除这一行。

1. 撤销最近一次commit

   ```shell
   git revert HEAD
   ```

当我们的修改分支是共有分支时，使用`git revert`会增加一个新commit，从结果上撤销之前的修改，可以直接`git push`（`git reset`需要加上`-f`）。

### Remote

（远程操作的部分内容未提供，请补充）

---

这样排版更为清晰，代码块也更易读。希望对你有所帮助！
