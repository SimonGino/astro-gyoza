---
title: 虚拟机安装 OpenWRT 作为软路由
author: Jinx
date: 2025-07-04
slug: install-openwrt-in-vm
featured: false
draft: false
category: vps
tags:
  - openwrt
  - 软路由
  - 虚拟机
description: 本文将详细介绍如何在虚拟机中安装和配置 OpenWRT，将其作为旁路由使用，适合家庭网络实验或扩展网络功能。
---

本文介绍如何在虚拟机中安装 OpenWRT 作为软路由，配置网络和软件包，适合测试和学习使用。

### 一、准备工作

#### 1. 下载 OpenWRT 镜像

首先，我们需要从 ImmortalWrt 的官方固件选择器下载适用于 x86/64 架构的镜像。

- **下载地址**: [https://firmware-selector.immortalwrt.org/](https://firmware-selector.immortalwrt.org/)
- **平台**: Generic x86/64
- **版本**: 选择 `COMBINED-EFI` 版本，例如 `immortalwrt-24.10.2-x86-64-generic-squashfs-combined-efi.img.gz`

下载后解压，得到 `.img` 格式的固件备用。

### 二、虚拟机创建与配置

本节以常见的虚拟机平台为例，具体操作请根据你正在使用的系统（如飞牛 OS）的界面进行调整。

1.  **创建虚拟机**:

    - 在你的虚拟机管理界面，新建一个虚拟机。
    - **操作系统**: 客户机操作系统类型选择 `Linux` 或 `其他`。
    - **系统/固件**: 引导方式尽量选择 `UEFI`，如果不支持，再尝试 `Legacy BIOS`。
    - **CPU/内存**: 根据你的设备性能分配，建议至少 1 核 CPU 和 512MB 内存。
    - **网络**: 网卡模式建议选择 `桥接模式`，并桥接到你的主路由所在的物理网口上。

2.  **配置虚拟磁盘**:

    - 创建虚拟机时，**不要**创建新的空白虚拟磁盘。
    - 你需要找到一个“导入磁盘”或“使用现有磁盘映像”的选项，选择你之前下载并解压好的 `.img` 文件。如果你的虚拟机平台不支持直接使用 `.img` 文件，可能需要先用工具（如 `qemu-img`）将其转换为 `.qcow2` 或 `.vmdk` 等格式。
    - 将这个导入的磁盘添加到虚拟机中。

3.  **调整引导顺序**:
    - 在虚拟机设置中，找到引导顺序选项，确保将刚才添加的 OpenWRT 磁盘作为第一启动项。

<img src="https://oss.mytest.cc/2025/07/77e948125837be33e131bcd15fa02499.png" alt="image-20250704131801879" style="zoom:50%;" />

<img src="https://oss.mytest.cc/2025/07/177353bacb366458e275b82bbb3ee8d1.png" alt="image-20250704131847950" style="zoom:50%;" />

<img src="https://oss.mytest.cc/2025/07/fff9b4d148970df66fa350c3ad623491.png" alt="image-20250704132115075" style="zoom:50%;" />

### 三、OpenWRT 初始化配置

1.  **修改 LAN 口 IP 地址**:
    启动虚拟机，打开 VNC 控制台。按回车键进入命令行界面。
    编辑网络配置文件：

    ```bash
    vim /etc/config/network
    ```

    找到 `lan` 接口配置，将其 `ipaddr` 修改为与你的主路由在同一网段的静态 IP，但要避免地址冲突。例如，如果主路由是 `192.168.31.1`，可以设置为 `192.168.31.2`。

    ```
    config interface 'lan'
        option device 'br-lan'
        option proto 'static'
        option ipaddr '192.168.31.2' # 修改为你的规划 IP
        option netmask '255.255.255.0'
        # ...
    ```

    修改后保存退出，执行 `reboot` 命令重启 OpenWRT。

2.  **登录 Web 管理界面 (LuCI)**:
    重启后，在浏览器中输入你刚才设置的 IP 地址（例如 `192.168.31.2`），即可访问 LuCI 管理界面。默认用户名是 `root`，密码为空。

3.  **配置 LAN 接口**:
    在 LuCI 界面中，导航到“网络” -> “接口”，编辑 `LAN` 接口。

    - **IPv4 网关**: 设置为主路由的 IP 地址（例如 `192.168.31.1`）。
    - **使用自定义的 DNS 服务器**: 填写主路由 IP 或公共 DNS（如 `114.114.114.114`）。
    - **DHCP 服务器**: 在“DHCP 服务器”标签页，勾选“忽略此接口”，关闭 OpenWRT 的 DHCP 功能，由主路由统一分配。

4.  **防火墙设置**:
    导航到“网络” -> “防火墙”。
    - 在“常规设置”中，可以关闭“启用 SYN-flood 防御”以减少不必要的性能开销。
    - 在“区域”设置中，确保 `lan` 区域的“IP 动态伪装”已勾选。

### 四、进阶配置

#### 1. 软件包安装

导航到“系统” -> “软件包”，首先点击“更新列表”来获取最新的软件包信息。然后可以根据需要搜索并安装插件，例如：

- `luci-i18n-argon-config-zh-cn`: Argon 主题中文包
- `luci-app-openclash`: OpenClash 代理工具
- `luci-app-ttyd`: 网页版终端
- `luci-i18n-diskman-zh-cn`: 磁盘管理中文包

#### 2. 挂载并扩容磁盘

默认的系统分区空间较小，如果你需要安装大量插件或存储数据，建议扩容。

具体步骤可以参考这篇详细教程：[OpenWRT (ImmortalWrt) x86/64 虚拟机镜像手动扩容分区大小](https://www.techkoala.net/openwrt_resize/)

核心步骤是将系统 `overlay` 分区挂载到一个更大的新分区上。在操作前请务必备份。关键命令如下：

```shell
# 将原 overlay 分区的数据完整复制到新分区（假设已挂载到 /mnt/sda3）
cp -r /overlay/* /mnt/sda3
```

之后在 LuCI 的“系统” -> “挂载点”中进行挂载配置。

![img](https://www.techkoala.net/images/Network/OpenWRT_overlay/mountpoint.webp)

### 总结

至此，OpenWRT 在虚拟机中的基本安装和旁路由配置就完成了。现在你可以根据自己的需求，自由探索和安装各种强大的软件包，开启你的软路由之旅。
