---
title: GitHub Fork与Pull Request工作流程最佳实践
author: Jinx
date: 2024-04-18
slug: github-fork-pull-request-workflow
featured: true
draft: false
category: git
tags:
  - Fork工作流
  - Pull Request
  - 代码协作
  - Git分支管理
description: 详细介绍GitHub标准Fork与Pull Request工作流程，包括分支创建、同步上游更新、代码提交规范、冲突处理以及Pull Request的最佳实践指南
---

<!-- more -->

GitHub Standard Fork & Pull Request Workflow

[Raw](https://gist.github.com/Chaser324/ce0505fbed06b947d962/raw/23b18d33a8e1a512c53155aabdf97042d8c63768/GitHub-Forking.md)

### 创建分支（Fork）

1. **Fork a Project**: 访问GitHub项目页面，点击"Fork"按钮，创建一个分支副本。

### 保持分支最新

1. **添加上游仓库**: 通过添加一个名为`upstream`的远程仓库，来跟踪原始仓库的更新。

   ```shell
   git remote add upstream https://github.com/UPSTREAM-USER/ORIGINAL-PROJECT.git
   ```

2. **更新本地分支**: 使用`git fetch`和`git merge`将上游仓库的最新更改合并到你的本地分支。

   ```
   # Fetch from upstream remote
   git fetch upstream

   # View all branches, including those from upstream
   git branch -va
   ```

3. **然后**，将上游远程 master 合并到你的 master 分支上：

   ```sh
   # Checkout your master branch and merge upstream
   git checkout master
   git merge upstream/master
   ```

   _注意_：如果与上游用非 master 分支交流，则改成相应的分支。
   在 merge 过程中，如果没有冲突 git 会执行 fast-forward 合并。如果有冲突的. 话，请尊重上游的更改解决冲突。现在你的项目就与 upstream 保持一致了。

### 进行工作

1. **创建新分支**: 开始新功能或修复错误前，创建一个新分支以保持更改的组织性。

   ```shell
   git checkout master
   git branch newfeature
   git checkout newfeature
   ```

### 提交合并请求（Pull Request）

1. **清理工作**: 在提交合并请求前，进行清理，包括重新基线化（rebase）和压缩（squash）提交，使分支整洁。

   ```shell
   git fetch upstream
   git checkout master
   git merge upstream/master
   git checkout newfeature
   git rebase master
   git rebase -i master
   ```

2. **提交请求**: 将所有更改推送到GitHub后，选择你的开发分支并点击pull request按钮。

   ```sh
   # Rebase all commits on your development branch
   git checkout
   git rebase -i master
   ```

### 接受和合并合并请求

1. **检查和测试**: 配置`.git/config`以获取和检出任何合并请求分支进行测试。

   ```shell
   git fetch origin
   git checkout -b 999 pull/origin/999
   ```

2. **自动合并**: 对于简单的快进合并，可以直接在GitHub的pull request页面点击合并按钮。

3. **手动合并**: 对于需要手动处理的合并请求，需要从源仓库的目标分支中拉取分支，然后合并并推送。

   ```shell
   git checkout master
   git pull https://github.com/forkuser/forkedrepo.git newfeature
   git merge newfeature
   git push origin master
   ```

4. **删除开发分支**: 合并完成后，可以删除开发分支。
   ```shell
   git branch -d newfeature
   ```

**版权信息**:

- 版权所有者：Chase Pettit
- 许可证：MIT License

**参考资料**:

- [Atlassian - Merging vs. Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
- [GitHub - Fork a Repo](https://help.github.com/articles/fork-a-repo)
- [GitHub - Syncing a Fork](https://help.github.com/articles/syncing-a-fork)
- [GitHub - Checking Out a Pull Request](https://help.github.com/articles/checking-out-pull-requests-locally)
