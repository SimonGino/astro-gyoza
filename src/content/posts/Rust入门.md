---
title: Rust开发环境搭建与基础命令
author: Jinx
date: 2024-07-28
slug: rust-getting-started-guide
featured: true
draft: false
categories:
  - rust
tags:
  - cargo
  - 交叉编译
  - 依赖管理
description: 介绍Rust语言开发环境的搭建步骤、Cargo包管理工具的使用、交叉编译配置，以及本地依赖管理等实用技巧
---

# Rust入门

## 常用命令

### cargo命令

```sh
cargo build
```

更新指定的依赖项到最新兼容版本

```sh
cargo update -p <dependency.name>
```

如果你想对不同的模块设置不同的日志等级，可以使用逗号分隔的格式

```sh
RUST_LOG=my_crate=debug,cargo=info cargo run
```

### 交叉编译

安装cross

```sh
cargo install cross
```

编译命令(区分运行环境)

```sh
cross build --target=aarch64-unknown-linux-gnu --release
cross build --target=x86_64-unknown-linux-gnu --release
```

### 更改依赖至本地

```toml
# 更新前
[dependencies]
bernard = { git = "https://github.com/m-rots/bernard-rs", branch = "main" }
# 更新后
[dependencies]
bernard = { path = "/Users/shizitoumengchong/coding/rust/github" }
```

这样就可以在本地修改代码后更新依赖调试
