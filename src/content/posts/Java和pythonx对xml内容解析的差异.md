---
title: Java与Python XML解析器命名空间处理差异分析
author: Jinx
date: 2023-12-05
slug: java-python-xml-namespace-parsing
featured: true
draft: false
category: java
tags:
  - XML解析
  - 命名空间处理
  - ElementTree
  - DOM解析
description: 深入对比Java与Python在处理XML命名空间时的差异，包括xmlns命名空间解析机制、Document对象与ElementTree的处理方式，以及实际应用中的最佳实践建议
---

<!-- more -->

![image-20231208213213049](/Users/wqq/Library/Application Support/typora-user-images/image-20231208213213049.png)**1. 首先解释下为什么为什么会生成多个xmlns的命名空间http://schemas.openxmlformats.org/wordprocessingml/2006/main**

因为这个xml文件最开始定义了五个不同的命名空间，分别是：mc、r、w、w14和w15。

- mc: http://schemas.openxmlformats.org/markup-compatibility/2006
- r: http://schemas.openxmlformats.org/officeDocument/2006/relationships
- w: http://schemas.openxmlformats.org/wordprocessingml/2006/main
- w14: http://schemas.microsoft.com/office/word/2010/wordml
- w15: http://schemas.microsoft.com/office/word/2012/wordml

![image-20231208213550901](/Users/wqq/Library/Application Support/typora-user-images/image-20231208213550901.png)

在这个XML文件中，所有使用"w:"前缀的元素都属于"w"命名空间。故最后python打印时每个元素都有http://schemas.openxmlformats.org/wordprocessingml/2006/main一段字符串。

![image-20231208222320423](/Users/wqq/Library/Application Support/typora-user-images/image-20231208222320423.png)

**注释：命名空间 URI 不会被解析器用于查找信息。**

其目的是赋予命名空间一个惟一的名称。不过，很多公司常常会作为指针来使用命名空间指向实际存在的网页，这个网页包含关于命名空间的信息。

请访问 http://www.w3.org/TR/html4/。

**参考：**

[xmlns说明链接](https://www.runoob.com/xml/xml-namespaces.html)

**2.为什么Java和python版本得到的内容不同**

技术选型参考owasp网站,因为Java最终得到的是Document类，它不关心xml文件里的xmlns命名空间，而python的[`xml.etree.ElementTree`](https://docs.python.org/3/library/xml.etree.elementtree.html#module-xml.etree.ElementTree)则会对命名空间做单独处理。即python是把w:替换成了URI，而java没有特殊处理这些xmlns，所以造成最终打印不一致。由于Java和python本身解析xml生成的对象就不一致，故这样的对比是没有意义的。XML 被设计用来传输和存储数据，一般来说，我们这里处理的数据更应该关注的是xml内容本身。

- Java

![image-20231208223145296](/Users/wqq/Library/Application Support/typora-user-images/image-20231208223145296.png)

- python

![image-20231208223736576](/Users/wqq/Library/Application Support/typora-user-images/image-20231208223736576.png)

![image-20231208224053458](/Users/wqq/Library/Application Support/typora-user-images/image-20231208224053458.png)

**参考:**

[XML_External_Entity_Prevention_Cheat_Sheet.html#python](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html#python)

https://docs.python.org/3/library/xml.etree.elementtree.html#module-xml.etree.ElementTree
