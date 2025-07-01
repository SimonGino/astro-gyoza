---
title: PDF翻译
author: Jinx
date: 2025-07-01
slug: pdf-translation
featured: false
draft: false
category: tools
tags:
  - PDF
  - 翻译
  - 工具
description: 详细介绍利用LLM进行PDF翻译的工具和方法
---

<!-- more -->

两种方式，一种是是cli，一种是web界面。

## CLI方式

### Install from PyPI

```shell
uv tool install --python 3.12 BabelDOC

babeldoc --help
```

### Use the babeldoc command. For example:

```shell
babeldoc --openai --openai-model "gpt-4o-mini" --openai-base-url "https://api.openai.com/v1" --openai-api-key "your-api-key-here"  --files example.pdf

# multiple files
babeldoc --openai --openai-model "gpt-4o-mini" --openai-base-url "https://api.openai.com/v1" --openai-api-key "your-api-key-here"  --files example1.pdf --files example2.pdf
```

### PDF Processing Options

> --files ：一个或多个输入 PDF 文档的文件路径。  
> --pages , -p : 指定要翻译的页面（例如，“1,2,1-,-3,3-5”）。如果未设置，则翻译所有页面。  
> --skip-clean : 跳过 PDF 清理步骤  
> --dual-translate-first : 在双 PDF 模式下将翻译页放在前面（默认：原始页在前）  
> --disable-rich-text-translate ：禁用富文本翻译（可能有助于提高与某些 PDF 的兼容性）  
> --enhance-compatibility ：启用所有兼容性增强选项（相当于 --skip-clean --dual-translate-first --disable-rich-text-translate）  
> --use-alternating-pages-dual : 对于双 PDF 使用交替页面模式。启用时，原文和译文页面交替排列。禁用时（默认），原文和译文页面在同一页面并排显示。  
> --watermark-output-mode : 控制水印输出模式：“watermarked”（默认）为译文 PDF 添加水印，“no_watermark”不添加水印，“both”输出两个版本。  
> --skip-scanned-detection ：跳过扫描文档检测（默认：False）。使用分段翻译时，如果不跳过，只有第一部分会执行检测。  
> --ocr-workaround ：使用 OCR 解决方案（默认：False）。仅适用于黑色文字在白色背景上的文档。启用后，将在翻译下方添加白色矩形块以覆盖原始文本内容，并将所有文字强制为黑色。  
> --auto-enable-ocr-workaround ：启用自动 OCR 解决方案（默认：False）。如果检测到文档被大量扫描，这将尝试启用 OCR 处理并跳过进一步的扫描检测。有关其与 --ocr-workaround 和 --skip-scanned-detection 的交互方式的关键细节，请参见下文的“重要交互说明”。

ps: 其余选项可以通过 github 仓库中查看。

## Web界面方式

我们需要运行一个新的项目

### Docker方式

```shell
docker pull awwaawwa/pdfmathtranslate-next
docker run -d -p 7860:7860 awwaawwa/pdfmathtranslate-next
```

### 访问Web界面

访问 http://localhost:7860 即可。

使用Azure OpenAI API Key 或者 OpenAI API Key 进行翻译。
AzureOpenAI model to use=gpt-4o-mini
AzureOpenAI endpoint URL=https://your-endpoint.openai.azure.com/
AzureOpenAI API Key=your-api-key-here

页面上的选项和命令行选项类似，可以选择翻译的PDF文件，设置翻译模型等。

## 总结

以上两种方式都可以实现PDF的翻译，CLI方式适合批量处理和自动化脚本，而Web界面方式则更适合交互式使用和快速翻译。根据自己的需求选择合适的方式即可。

Reference:

- [BabelDOC GitHub](https://github.com/funstory-ai/BabelDOC)
- [PDFMathTranslate Next GitHub](https://github.com/PDFMathTranslate/PDFMathTranslate-next)
- [PDFMathTranslate Next Wiki](https://pdf2zh-next.com/zh/getting-started/INSTALLATION_docker.html)
