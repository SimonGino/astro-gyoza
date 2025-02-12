---
title: GitHub Actions使用记录
author: Jinx
date: 2025-01-03
slug: github-actions-usage
featured: true
draft: false
category: git
tags:
  - GitHub Actions
  - 自动化构建
description: 详细介绍GitHub Actions使用记录
---

<!-- more -->

# GitHub Actions使用记录

## 开启Workflow permissions

- 进入 GitHub 仓库

- 点击 "Settings" 标签

- 点击左侧菜单中的 "Actions" -> "General"

- 确保 "Actions permissions" 选项已启用

- 确保 "Workflow permissions" 设置为 "Read and write permissions"

![image-20250103091751510](https://oss.mytest.cc/2025/01/2b60bf0830980474885986077315ce5e.png)

## 一些构建配置

**新建build.yml**

i18n-manager为我的仓库名称

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*' # 当推送带v开头的tag时触发，如 v1.0.0
  workflow_dispatch: # 添加手动触发选项

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        arch: [amd64, arm64]
        exclude:
          - os: ubuntu-latest
            arch: arm64 # 排除 Linux arm64 (需要特殊配置)

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pyinstaller requests

      - name: Build binary
        run: |
          python build.py

      - name: Rename binary for distribution
        run: |
          if [ "${{ matrix.os }}" = "ubuntu-latest" ]; then
            mv dist/i18n-manager "dist/i18n-manager-linux-${{ matrix.arch }}"
          elif [ "${{ matrix.os }}" = "macos-latest" ]; then
            mv dist/i18n-manager "dist/i18n-manager-darwin-${{ matrix.arch }}"
          fi

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: binaries
          path: dist/i18n-manager-*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: binaries
          path: dist

      - name: Create Release
        id: create_release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/*
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**build.py**

```shell
import PyInstaller.__main__
import sys
import os

# 确定当前操作系统
if sys.platform.startswith('win'):
    separator = ';'
else:
    separator = ':'

# 运行构建
PyInstaller.__main__.run([
    'src/i18_manager/i18n_manager.py',
    '--onefile',
    '--name=i18n-manager',
    f'--add-data=src/i18_manager/lang{separator}lang',
    '--clean',
    '--hidden-import=requests',
    '--hidden-import=json',
    '--hidden-import=codecs',
    '--hidden-import=argparse',
])

# 构建完成后设置权限
if sys.platform != 'win32':
    output_path = os.path.join('dist', 'i18n-manager')
    if os.path.exists(output_path):
        os.chmod(output_path, 0o755)
```

**Install.sh**

```sh
#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# 检测系统类型和架构
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# 转换架构名称
case "$ARCH" in
    x86_64)
        ARCH="amd64"
        ;;
    arm64|aarch64)
        ARCH="arm64"
        ;;
    *)
        echo -e "${RED}Unsupported architecture: $ARCH${NC}"
        exit 1
        ;;
esac

# 确定下载URL
GITHUB_REPO="SimonGino/i18n-manager"
VERSION=$(curl -s https://api.github.com/repos/${GITHUB_REPO}/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not determine latest version${NC}"
    exit 1
fi

# 构建下载URL
BINARY_URL="https://github.com/$GITHUB_REPO/releases/download/${VERSION}/i18n-manager-${OS}-${ARCH}"

# 创建临时目录
TMP_DIR=$(mktemp -d)
TMP_FILE="$TMP_DIR/i18n-manager"

# 创建安装目录
INSTALL_DIR="$HOME/.local/bin"
mkdir -p "$INSTALL_DIR"

# 下载二进制文件
echo -e "Downloading i18n-manager ${VERSION} for ${OS}-${ARCH}..."
echo -e "From: ${BINARY_URL}"

if ! curl -L -o "$TMP_FILE" "$BINARY_URL"; then
    echo -e "${RED}Download failed${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

# 检查文件类型
FILE_TYPE=$(file "$TMP_FILE")
if [[ "$OS" == "darwin" && ! "$FILE_TYPE" =~ "Mach-O 64-bit executable arm64" ]]; then
    echo -e "${RED}Error: Invalid binary format${NC}"
    echo -e "${RED}Expected: Mach-O 64-bit executable arm64${NC}"
    echo -e "${RED}Got: $FILE_TYPE${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

# 设置执行权限
chmod +x "$TMP_FILE"

# 简单测试二进制文件
echo -e "Verifying binary..."
if ! "$TMP_FILE" 2>&1 | grep -q "usage\|help\|i18n-manager"; then
    echo -e "${RED}Warning: Binary might not be working correctly${NC}"
    echo -e "${RED}File type: $(file "$TMP_FILE")${NC}"
    # 继续安装，但显示警告
    echo -e "${RED}Continuing installation despite verification warning...${NC}"
fi

# 移动到安装目录
mv "$TMP_FILE" "$INSTALL_DIR/i18n-manager"

# 清理临时目录
rm -rf "$TMP_DIR"

# 检查 PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "export PATH=\"\$PATH:$INSTALL_DIR\"" >> "$HOME/.bashrc"
    echo "export PATH=\"\$PATH:$INSTALL_DIR\"" >> "$HOME/.zshrc" 2>/dev/null || true
fi

echo -e "${GREEN}Installation completed!${NC}"
echo -e "Location: $INSTALL_DIR/i18n-manager"
echo -e "\nPlease restart your terminal or run: source ~/.bashrc"
echo -e "Then you can use 'i18n-manager' command anywhere."

# 尝试运行帮助命令
echo -e "\nTrying to run help command..."
"$INSTALL_DIR/i18n-manager" --help || true
```

## 触发构建

1. 首先得确认相关文件上传至仓库

```shell
git add .github/workflows/build.yml
git commit -m "Add GitHub Actions workflow"
git push origin main
```

2. 然后再创建和推送标签

```shell
git tag -a v0.1.0 -m "First release"
git push origin v0.1.0
```

3. 如果还是没有触发，可以尝试：

```shell
# 删除旧的标签（如果之前创建过）
git tag -d v0.1.0  # 删除本地标签
git push origin :refs/tags/v0.1.0  # 删除远程标签

# 重新创建和推送标签
git tag -a v0.1.0 -m "First release"
git push origin v0.1.0
```

也可以在 workflow 文件中添加手动触发选项：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch: # 添加手动触发选项
```

仓库地址：https://github.com/SimonGino/i18n-manager
