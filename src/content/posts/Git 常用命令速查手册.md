---
title: Git 常用命令速查手册
author: Jinx
date: 2024-12-16
slug: git-command-cheatsheet
featured: true
draft: false
categories:
  - git
description: 全面整理Git日常开发中最常用的命令，包括暂存、标签管理、交互式变基、拣选提交、远程仓库操作、别名配置、二分查找等核心功能的详细使用说明
---

在日常开发中，Git 是我们必不可少的工具。掌握一些常用的 Git 命令，可以让我们更加高效地管理代码。本文将整理一些常用的 Git 命令，并按照功能进行分类，方便大家快速查找和使用。

## 1. 暂存更改 (Stashing Changes)

当你需要暂时切换分支处理其他任务，又不想提交当前未完成的更改时，可以使用暂存功能。

- `git stash`： 临时保存未提交的更改。
- `git stash list`： 列出所有暂存的更改。
- `git stash apply stash@{0}`： 应用指定的暂存，但不删除该暂存。
- `git stash pop`： 应用最近的暂存并将其从暂存列表中删除。
- `git stash drop stash@{0}`： 删除指定的暂存。

## 2. 使用标签 (Working with Tags)

标签通常用于标记发布版本。

- `git tag`： 列出所有标签。
- `git tag -a v1.0 -m "Version 1.0"`： 创建一个带有消息的标签 `v1.0`。
- `git push origin v1.0`： 将 `v1.0` 标签推送到远程仓库。
- `git push --tags`： 将所有标签推送到远程仓库。
- `git tag -d v1.0`： 本地删除 `v1.0` 标签。
- `git push origin --delete v1.0`： 从远程仓库删除 `v1.0` 标签。

## 3. 交互式变基 (Interactive Rebase)

交互式变基可以让你更精细地控制提交历史。

- `git rebase -i HEAD~3`： 打开最近 3 次提交的交互式变基界面。
  - 在交互式界面中，你可以使用以下命令：
    - `pick`： 保留该提交。
    - `squash`： 将该提交与前一个提交合并。
    - `reword`： 修改提交消息。
    - `edit`： 修改提交内容。
- `git rebase --abort`： 中止变基操作，并恢复到变基前的状态。
- `git rebase --continue`： 在解决冲突后，继续进行变基操作。

## 4. 拣选提交 (Cherry-Picking)

拣选提交可以将其他分支的特定提交应用到当前分支。

- `git cherry-pick commit-hash`： 将指定提交应用到当前分支。
- `git cherry-pick --continue`： 在解决冲突后，继续进行拣选提交的操作。
- `git cherry-pick --abort`： 中止拣选提交的操作。

## 5. 使用远程仓库 (Working with Remotes)

远程仓库用于代码协作和备份。

- `git remote -v`： 列出所有远程仓库和它们的 URL。
- `git remote add origin https://github.com/user/repo.git`： 添加一个新的远程仓库 `origin`。
- `git remote remove origin`： 删除 `origin` 远程仓库。
- `git fetch origin`： 从远程仓库 `origin` 获取更新。
- `git pull origin branch-name --rebase`： 从远程仓库的 `branch-name` 分支拉取更新，并使用变基方式。

## 6. Git 别名 (Git Aliases)

别名可以简化常用的 Git 命令。

- `git config --global alias.st status`： 创建 `git status` ��别名 `git st`。
- `git config --global alias.co checkout`： 创建 `git checkout` 的别名 `git co`。
- `git config --global alias.br branch`： 创建 `git branch` 的别名 `git br`。

## 7. 二分查找错误 (Bisecting to Find Bugs)

二分查找可以帮助你快速定位引入错误的提交。

- `git bisect start`： 启动二分查找过程。
- `git bisect bad`： 标记当前提交为错误提交。
- `git bisect good commit-hash`： 标记指定提交为正确提交。
- `git bisect reset`： 结束二分查找过程，回到原始分支。

## 8. 清理未跟踪文件 (Cleaning Untracked Files)

清理未跟踪文件可以保持工作区的整洁。

- `git clean -n`： 显示将要删除的未跟踪文件和目录。
- `git clean -f`： 删除未跟踪的文件。
- `git clean -fd`： 删除未跟踪的文件和目录。

---

希望这份 Git 常用命令速查手册能对你有所帮助！如果你有其他常用的 Git 命令，欢迎在评论区分享。
