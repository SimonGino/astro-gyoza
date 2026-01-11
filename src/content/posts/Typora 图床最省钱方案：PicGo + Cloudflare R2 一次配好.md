---
title: Typora 图床最省钱方案：PicGo + Cloudflare R2 一次配好
author: Jinx
date: 2026-01-11
slug: typora-picgo-cloudflare-r2-image-hosting
featured: true
draft: false
category: 工具
tags:
  - Typora
  - PicGo
  - Cloudflare R2
  - 图床
  - Markdown
description: 使用 PicGo 配合 Cloudflare R2 搭建免费图床，10GB 免费存储 + 无出站流量费，一次配置永久使用
---

## Typora 图床最省钱方案：PicGo + Cloudflare R2 一次配好

很多人写博客最头疼的不是内容，而是配图：  
截图一多，本地路径乱、迁移麻烦、图床又贵还可能要备案。

这篇文章给你一套「性价比极高、可长期用」的组合：

- 写作工具：Typora
- 上传器：PicGo-Core（Typora 内置）
- 存储：Cloudflare R2（有免费额度、对国内访问也稳定）
- 原理：R2 兼容 AWS S3 协议 → PicGo 装个 S3 插件就能传

下面按步骤做，小白也能一次搞定。

---

### 01｜先准备 Cloudflare R2 的 5 个信息

进入 Cloudflare 后台，把这些信息准备好（后面要填到配置文件里）：

1. **Bucket Name（桶名）**：你创建的存储桶名称
2. **Access Key ID**：创建 API Key 时生成（只显示一次）
3. **Secret Access Key**：同上（只显示一次）
4. **Endpoint（S3 API URL）**：一般长这样：  
   `https://<你的账户ID>.r2.cloudflarestorage.com`
5. **Public Domain（公开访问域名）**：非常关键
   - R2 默认是私有桶，你必须绑定域名或开启 `r2.dev` 子域
   - 否则即使上传成功，Typora 里也会“裂图”（无法预览）

你可以理解为：  
**上传只是第一步，能“公开访问”才算真正的图床。**

---

### 02｜Typora 里启用 PicGo-Core（上传命令）

打开 Typora：

1. `Preferences` → `Image`
2. **插入图片时**：选择「上传图片」
3. **上传服务**：选择「自定义服务」
4. 填写命令（示例，按你的 Node/PicGo 路径替换）：

```bash
/Users/xxx/.nvm/versions/node/v24.12.0/bin/node /Users/xxx/.nvm/versions/node/v24.12.0/bin/picgo upload
```

然后先别急着成功，下一步要先装插件。

---

### 03｜安装 S3 插件（PicGo 默认没有 S3）

PicGo-Core 默认不带 S3，需要装 `picgo-plugin-s3`。

操作顺序：

1. 在 Typora 的 `Image` 设置页，点一次「验证图片上传选项」
2. 它大概率会报错（因为还没配置），但会显示 **PicGo 可执行文件路径**
   - Windows 类似：`C:\Users\xxx\AppData\Roaming\Typora\picgo\win64\picgo.exe`
   - Mac 类似：`/Users/xxx/Library/Application Support/typora/picgo/mac/picgo`
3. 打开终端，执行（把 `<PicGo路径>` 换成你自己的）：

```bash
"<PicGo路径>" install s3
```

Mac 示例：

```bash
"/Users/xxx/Library/Application Support/typora/picgo/mac/picgo" install s3
```

如果你装插件失败，优先确认本机 **Node.js 可用**（PicGo 插件安装依赖 npm）。

---

### 04｜修改 `config.json`（核心配置，复制就行）

回到 Typora 的 `Image` 设置页，点击「打开配置文件（Open Config File）」。

把 `config.json` 改成下面这样（逐项替换你自己的信息）：

```json
{
  "picBed": {
    "uploader": "aws-s3",
    "current": "aws-s3",
    "aws-s3": {
      "accessKeyID": "填你的 R2 Access Key ID",
      "secretAccessKey": "填你的 R2 Secret Access Key",
      "bucketName": "填你的 Bucket Name（例如 my-blog-images）",
      "region": "auto",
      "endpoint": "https://<account_id>.r2.cloudflarestorage.com",
      "s3ForcePathStyle": true,
      "disableBucketPrefixToURL": true,
      "uploadPath": "{year}/{month}/{md5}.{extName}",
      "urlPrefix": "https://img.example.com"
    }
  },
  "picgoPlugins": {
    "picgo-plugin-s3": true
  }
}
```

这里有 3 个最容易填错的点，我直接写清楚：

- `uploader` 必须是 `aws-s3`
- `endpoint` **不要**在后面拼 bucket 名字，只填到 `.com`
- `urlPrefix` 填你能公开访问的域名（自定义域名或 `r2.dev`），通常也**不需要**拼 bucket 名字

---

### 05｜验证（看到 Typora 里回显图片才算成）

1. 保存 `config.json`
2. 回到 Typora 设置页 → 点「验证图片上传选项（Test Uploader）」
3. 出现“验证成功”，并且看到回显的图片/Logo，就说明链路完整了：  
   **Typora → PicGo → R2 上传 → 域名公开访问 → Markdown 回写**

<img src="https://oss.mytest.cc/2026/01/06ec1170b35253df908f4072b4f72342.png" alt="image-20260111190611849" style="zoom:50%;" />

---

## 常见问题排查（80% 的坑在这里）

### 1）上传成功但图片裂了

优先检查两点：

- `urlPrefix` 是否正确（浏览器能否直接访问你上传后的图片地址）
- R2 是否开启了公开访问（绑定域名 / 开 `r2.dev`）

### 2）403 Forbidden

通常是权限或密钥问题：

- Access Key / Secret 是否填错
- Token 权限是否包含 `Object Read & Write`（读写）
- 桶策略/公开规则是否限制了访问

### 3）插件安装失败

- 先确认本机 Node.js 正常（`node -v`）
- 国内网络可能 npm 源慢：换网络或配置镜像
