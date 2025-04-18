---
title: 使用biliup录制直播并上传至B站
author: Jinx
date: 2024-10-24
lastMod: 2025-04-18
slug: biliup-live-recording-and-upload
featured: true
draft: false
category: docker
tags:
  - biliup
  - ffmpeg
  - 直播录制
  - B站上传
  - Docker
description: 本文详细介绍如何使用biliup工具，通过Docker部署，实现自动录制直播流并将其上传到Bilibili平台，包含配置、弹幕处理及常见问题解决方案。
---

## 前言

Biliup 是一款强大的自动化工具，能够监控指定直播间，在主播开播时自动进行录制，并在直播结束后将录像上传至 Bilibili。本文将引导你完成 `biliup` 的 Docker 部署、基本配置、可选的弹幕处理，以及解决一个常见的 FFmpeg 硬件加速问题。

## 前置准备

在开始之前，请确保你的系统已经安装了：

1.  **Docker**: 用于运行 `biliup` 容器。
2.  **Docker Compose**: （推荐）用于简化 Docker 容器的管理。

## 部署 biliup

推荐使用 Docker Compose 进行部署，方便管理配置和持久化数据。

### 1. 创建工作目录和编排文件

首先，创建一个用于存放 `biliup` 配置和数据的目录，例如 `/backup/docker/biliup`。

```bash
mkdir -p /backup/docker/biliup
cd /backup/docker/biliup
```

然后，在该目录下创建 `docker-compose.yml` 文件：

```sh
cat > docker-compose.yml << EOF
version: '3'
services:
  biliup:
    # 推荐使用 tag 为 caution 的镜像，稳定性较好
    image: ghcr.io/biliup/caution:latest
    container_name: biliup
    restart: unless-stopped
    ports:
      # 将容器的 19159 端口映射到宿主机的 19159 端口
      - "19159:19159"
    volumes:
      # 将当前目录映射到容器内的 /opt 目录
      # 这会将配置文件(config.yaml)、录制的视频、日志等都保存在宿主机的当前目录下
      - ./:/opt
    # 设置 Web UI 的登录密码，请替换为你自己的强密码
    command: --password your_strong_password_here
EOF
```

**注意**:

- 请将 `your_strong_password_here` 替换为你自己的安全密码。
- `./:/opt` 的意思是将宿主机上 `docker-compose.yml` 文件所在的目录（即 `/backup/docker/biliup`）挂载到容器的 `/opt` 目录。`biliup` 会在这个目录下读写 `config.yaml`、`cookies.json` 以及录制的视频文件。

### 2. 准备配置文件 (可选)

`biliup` 的所有配置都存储在 `config.yaml` 文件中。你可以**选择**手动创建这个文件，也可以在首次启动 `biliup` 后通过 Web UI 进行配置，`biliup` 会自动生成该文件。

如果你想预先配置，可以创建一个 `config.yaml` 文件。以下是一个包含了各种常用选项的**示例配置**，你可以根据需要进行删减和修改。**对于初学者，建议跳过此步骤，直接通过 Web UI 配置。**

```sh
# 创建一个空的 config.yaml，如果需要预设则粘贴以下内容
# touch config.yaml

# (可选) 预创建 config.yaml 文件并填入内容
cat > config.yaml << EOF
# --- config.yaml 内容开始 --- #

######### 全局录播与上传设置 #########
# (保留你原始草稿中的 config.yaml 完整内容，此处仅作示意)
# ... (非常长的配置内容) ...

#------上传------#
### 选择全局默认上传插件，Noop为不上传，但会执行后处理,可选bili_web，biliup-rs(默认值)
#uploader: Noop
### b站提交接口，默认自动选择，可选web，client
#submit_api: client
lines: AUTO # 上传线路，AUTO 通常足够
threads: 3 # 上传并发数

#------杂项------#
delay: 300 # 下播后延迟检测时间（秒），防止漏录结尾，推荐 300 秒
event_loop_interval: 30 # 所有主播检查一遍后的等待时间（秒）
checker_sleep: 10 # 每个主播检查间隔（秒）
pool1_size: 3 # 下载线程池大小
pool2_size: 3 # 上传线程池大小

######### 录制主播设置 #########
streamers:
  # 示例：录制某个主播
  主播名称示例: # 这里是你给录播任务起的名字，会用在日志和可能的文件夹名称中
    url:
      - https://live.bilibili.com/123456 # 直播间链接，支持多个备用
    title: "{streamer} {title} %Y%m%d" # 上传B站的视频标题模板
    tid: 171 # B站分区ID (171: 电子竞技)
    copyright: 2 # 1为自制，2为转载 (录播通常选2)
    # 建议使用 user_cookie 指定登录信息，否则可能无法上传或获取高画质
    user_cookie: cookies.json # 指向包含B站Cookie的文件名
    tags:
      - Tag1
      - Tag2
      - 直播录像
    # description: |- # 视频简介模板
    #  {title}
    #  直播间: {url}
    #  Powered by biliup
    # postprocessor: # 上传后的处理，默认为删除 rm
    #   - mv: finished/ # 例如，移动到 finished 目录

######### 用户cookie #########
#user:
  #------哔哩哔哩------#
  # ### 用于获取高画质直播流和上传，非常重要！
  # ### 推荐使用 biliup-rs 登录获取完整 cookie 文件
  # bili_cookie_file: 'cookies.json' # 指向 cookie 文件

# (其他平台和日志配置，根据需要保留或删除)
# ...

# --- config.yaml 内容结束 --- #
EOF
```

**核心配置项说明**:

- `lines`: 上传线路，`AUTO` 自动选择通常效果最好。
- `threads`: 同时上传的文件块数量，可适当增加提高速度，但过高可能触发B站限制。
- `delay`: 检测到下播后等待一段时间再开始处理，防止主播短暂断流导致录像分割和过早上传。
- `streamers`: 这是配置的核心，在此处添加你要录制的主播信息。
  - `url`: 直播间地址。
  - `title`: 上传到B站的视频标题格式，支持变量如 `{streamer}` (你在配置里设置的名字), `{title}` (直播间标题), 以及 `strftime` 时间格式。
  - `tid`: B站投稿分区 ID。你可以在 B 站投稿页面 URL 中找到，或者通过 [B站分区查询工具](https://biliup.github.io/tid-ref.html) 查看。
  - `copyright`: 1=自制，2=转载。录播一般选 2。
  - `user_cookie`: 指定用于上传和获取信息的 B 站 Cookie 文件名。强烈建议配置此项。
  - `tags`: 上传视频的标签。
  - `postprocessor`: 视频上传完成后的操作，默认为删除 (`rm`)。可以设置为 `mv: backup/` 将文件移动到 `backup` 目录。

### 3. 启动 biliup

在 `docker-compose.yml` 文件所在的目录下运行：

```bash
docker compose up -d
```

这将在后台启动 `biliup` 容器。

### 4. 访问 Web UI 并配置

容器启动后，在浏览器中打开 `http://<你的服务器IP>:19159`。
使用你在 `docker-compose.yml` 中设置的密码 (`your_strong_password_here`) 登录。

**首次使用的基本配置流程：**

1.  **登录**: 输入密码登录。
2.  **上传设置 (用户管理)**:
    - 点击侧边栏的 “用户管理”。
    - 点击 “添加 B站 Cookie”。
    - 推荐使用 `biliup-rs` 工具 ([biliup-rs GitHub](https://github.com/biliup/biliup-rs)) 在你的**本地电脑**（不是服务器）登录 B 站账号，生成 `cookies.json` 文件。
    - 将生成的 `cookies.json` 文件内容**完整粘贴**到 Web UI 的文本框中，或者将 `cookies.json` 文件上传到服务器的 `biliup` 工作目录 (`/backup/docker/biliup`) 下，然后在 Web UI 中指定文件名 `cookies.json`。
    - 保存 Cookie。这是能够成功上传和获取高画质流的关键。
3.  **添加录播任务 (主播管理)**:
    - 点击侧边栏的 “主播管理”。
    - 点击 “添加主播”。
    - 填入 **直播间 URL**。
    - 设置 **主播名称** (仅用于 `biliup` 内部标识)。
    - 配置 **上传设置**:
      - **投稿模板**: 设置视频标题 (`title`)、分区 (`tid`)、标签 (`tags`) 等。
      - **选择用户**: 选择你刚才添加的 B 站 Cookie。
    - 点击 “保存”。
4.  `biliup` 会自动开始轮询检查你添加的主播是否开播。

## 可选：弹幕录制与处理

`biliup` 本身支持录制部分直播平台的弹幕（需要在 `config.yaml` 中为对应平台开启，如 `douyu_danmaku: true`），录制的弹幕会保存为 `.xml` 或 `.ass` 文件。

如果你希望将弹幕压制进视频文件，或者进行更复杂的处理，可以使用第三方工具，例如 `danmaku-compress` ([SimonGino/danmaku-compress](https://github.com/SimonGino/danmaku-compress))。

**使用 `danmaku-compress` 的简要流程 (在服务器上操作):**

### 1. 下载并配置脚本

```bash
# 假设你在 /opt/tools 目录下管理这类工具
cd /opt/tools
git clone https://github.com/SimonGino/danmaku-compress.git
cd danmaku-compress

# 修改 config.py 文件
nano config.py
```

你需要修改 `config.py` 中的路径，使其指向 `biliup` 存放录播文件的地方。例如，如果你的 `biliup` 工作目录是 `/backup/docker/biliup`，并且你希望处理该目录下的文件：

```python
# config.py (部分示例)
# 确保这些路径是 danmaku-compress 脚本可以访问到的绝对路径

# 源视频和弹幕文件所在的文件夹
PROCESSING_FOLDER = "/backup/docker/biliup"

# (可选) 处理后备份文件的存放位置，如果不需要可以注释掉或指向同一位置
# BACKUP_FOLDER = "/backup/docker/biliup/processed_backup"
```

**重要**: 为了让此脚本能处理文件，你需要配置 `biliup` 在上传后**不删除**原始视频和弹幕文件。可以在 `config.yaml` 的对应主播设置中，将 `postprocessor` 从默认的 `rm` 修改为其他操作，例如：

```yaml
streamers:
  主播名称示例:
    # ... 其他配置 ...
    postprocessor:
      - mv: /backup/docker/biliup/processed/ # 示例：移动到已处理目录
      # 或者干脆不写 postprocessor，让文件留在原地，手动管理
```

或者，你可以在 `biliup` 上传完成后，**手动运行** `danmaku-compress` 脚本来处理留在原地的文件。

### 2. 安装依赖环境

推荐使用 `uv` (一个快速的 Python 包管理工具) 或 `pip`。

```bash
# 使用 uv (推荐)
uv venv # 创建虚拟环境 .venv
source .venv/bin/activate # 激活虚拟环境
uv sync # 安装依赖

# 或者使用 pip (如果未安装 uv)
# python3 -m venv .venv
# source .venv/bin/activate
# pip install -r requirements.txt
```

### 3. 运行处理脚本

```bash
# 确保虚拟环境已激活
python main.py
```

脚本会查找 `PROCESSING_FOLDER` 下的视频和对应的弹幕文件，进行转换和压制（具体行为取决于脚本实现）。

## 常见问题排查

### 问题 1: FFmpeg 报错 `Failed to initialise VAAPI connection: -1 (unknown libva error)`

当 `biliup` (或其调用的 FFmpeg) 尝试使用 Intel 核显 (QSV) 进行硬件加速转码（例如，在弹幕压制过程中，或者如果配置了转码输出格式）时，可能会遇到此错误。

**错误日志示例:**

```shell
[AVHWDeviceContext @ 0x55dcbd941500] libva: /usr/lib/x86_64-linux-gnu/dri/iHD_drv_video.so has no function __vaDriverInit_1_0
[AVHWDeviceContext @ 0x55dcbd941500] Failed to initialise VAAPI connection: -1 (unknown libva error).
Device creation failed: -5.
[h264_qsv @ 0x55dcbd93da40] Failed to create a VAAPI device.
Error initializing output stream 0:0 -- Error while opening encoder for output stream #0:0
```

**问题分析:**

这个错误通常表示 Linux 系统上的 VA-API (Intel 硬件加速接口) 环境配置不正确或驱动存在问题。FFmpeg 找到了 Intel 的驱动程序 (`iHD_drv_video.so`)，但无法成功初始化它，导致 QSV 硬件加速（编码/解码）失败。

**解决方案 (在宿主机上执行):**

1.  **安装/更新 VA-API 驱动和库:**
    对于 Debian/Ubuntu 系统，针对较新的 Intel 核显 (如 UHD 630)，通常需要 `intel-media-va-driver-non-free` 包。

    ```bash
    sudo apt update
    sudo apt install intel-media-va-driver-non-free libva-drm2 libva-x11-2 vainfo
    ```

    - `intel-media-va-driver-non-free`: Intel Media Driver (推荐)。
    - `libva-drm2`, `libva-x11-2`: VA-API 核心库。
    - `vainfo`: 用于测试 VA-API 是否配置成功的工具。

2.  **验证 VA-API 配置:**
    安装完成后，重启系统或重新登录用户会话，然后运行 `vainfo` 命令：

    ```bash
    vainfo
    ```

    如果命令成功执行并输出了类似 `VAProfileH264ConstrainedBaseline`、`VAProfileH264Main`、`VAProfileH264High` 等支持的配置文件列表，说明 VA-API 环境基本正常。如果 `vainfo` 报错，说明驱动问题仍未解决。

3.  **重启 biliup 容器:**
    宿主机驱动更新后，需要重启 `biliup` 容器使其能利用新的驱动环境。

    ```bash
    docker compose restart biliup
    ```

4.  **调整 FFmpeg 命令 (如果手动调用 FFmpeg):**
    如果你是在 `danmaku-compress` 脚本或 `biliup` 的 `postprocessor` 中手动调用 `ffmpeg` 命令，并且使用了 QSV (`h264_qsv`)：

    - **解码加速**: 如果使用了 `-hwaccel vaapi` 进行解码，确保 `vainfo` 正常。若滤镜（如 `ass` 字幕滤镜）需要 CPU 处理，硬件解码可能效果有限，可暂时移除 `-hwaccel` 参数专注于解决编码问题。
    - **编码参数**: QSV 推荐使用 `-global_quality` (数值越低质量越高，类似 CRF，推荐范围 20-25) 或 `-b:v` (固定比特率) 来控制质量，而不是 `-crf` (虽然有时也能映射)。
    - **示例命令 (假设 VA-API 已修复, 用于弹幕压制):**
      ```bash
      ffmpeg -i input.flv -vf "ass=input.ass" -c:v h264_qsv -preset veryfast -global_quality 22 -c:a copy -y output.mp4
      ```

5.  **如果 VA-API 无法修复 (备选方案):**
    如果实在无法解决 VA-API 问题，可以放弃硬件加速，改用 CPU 进行编码 (速度会慢很多)。将 FFmpeg 命令中的 `-c:v h264_qsv` 替换为 `-c:v libx264` (高质量 H.264 编码器) 或 `-c:v libx265` (H.265 编码器)。
    ```bash
    # CPU 编码示例
    ffmpeg -i input.flv -vf "ass=input.ass" -c:v libx264 -preset veryfast -crf 23 -c:a copy -y output.mp4
    ```

## 参考项目

- **biliup**: [https://github.com/biliup/biliup](https://github.com/biliup/biliup) (核心录播上传工具)
- **DanmakuConvert**: [https://github.com/timerring/DanmakuConvert](https://github.com/timerring/DanmakuConvert) (另一个弹幕转换工具)
- **danmaku-compress**: [https://github.com/SimonGino/danmaku-compress](https://github.com/SimonGino/danmaku-compress) (文中提到的弹幕处理脚本)

## 结语

通过本文的指引，你应该能够成功部署 `biliup` 并实现自动化直播录制与上传。`biliup` 的配置项非常丰富，可以满足各种定制化需求，建议多查阅官方文档或配置文件中的注释进行探索。遇到问题时，检查日志和参考本文提供的排错步骤通常能找到解决方案。
