---
title: MySQL存储Emoji表情字符集配置指南
author: Jinx
date: 2024-07-31
slug: mysql-emoji-storage-configuration
featured: true
draft: false
categories:
  - database
tags:
  - 字符集配置
  - utf8mb4
  - JDBC配置
  - 数据存储
description: 详细解析MySQL存储Emoji表情遇到的"Incorrect string value"错误，包括数据库字符集配置、JDBC连接设置、服务端character_set_server参数调整等完整解决方案
---

# MySQL存储Emoji表情字符集配置指南

报错信息如下

```
"errorMessage": "\n### Error updating database.  Cause: java.sql.SQLException: (conn=95147170) Incorrect string value: '\\xF0\\x9F\\x8D\\xA4' for column 'description' at row 1\n### The error may exist in URL [jar:file:/kai_skc_backend/lib/kai_skc_backend-1.0.0.jar!/mapper/SkillPublishRecordMapper.xml]\n### The error may involve com.digiwin.kai.skc.mapper.SkillPublishRecordMapper.insert-Inline\n### The error occurred while setting parameters\n### SQL: INSERT INTO skc_skill_publish_record         (             id, skill_id, skill_name, description, create_params, tenantsid, tenant_id, tenant_name,          create_id, create_name, create_time, update_id, update_name, update_time         )         VALUES             (                 ?, ?, ?, ?, ?, ?,                 ?,?,              ?,?, ?, ?, ?, ?             )\n### Cause: java.sql.SQLException: (conn=95147170) Incorrect string value: '\\xF0\\x9F\\x8D\\xA4' for column 'description' at row 1\n; uncategorized SQLException; SQL state [HY000]; error code [1366]; (conn=95147170) Incorrect string value: '\\xF0\\x9F\\x8D\\xA4' for column 'description' at row 1; nested exception is java.sql.SQLException: (conn=95147170) Incorrect string value: '\\xF0\\x9F\\x8D\\xA4' for column 'description' at row 1",
```

## 1. 设置MySQL数据表的字符集格式

确保MySQL数据表的字符集已经设置成utf8mb4，它支持存储所有的 Unicode 字符，包括 Emoji。

## 2. **检查数据库连接设置**：

- 确保数据库连接字符串中指定了 `utf8mb4` 字符集。例如，对于 MySQL，可以在连接字符串中添加 `characterEncoding=UTF-8`。

## 3. 错误原因

原因：JDBC会自动检测MySQL服务端character_set_server的值，自动执行SET NAMES命令设置整个连接的字符集编码，其目的是自动检测服务端字符集编码配置而减少JDBC客户端的字符集编码配置。如果MySQL服务端character_set_server的值为utf8，那么JDBC就会将连接的字符集编码设置为utf8，这样即使表的字符集为utf8mb4也是无法存储表情的。

JDBC相关源码:

```java
// realJavaEncoding为url中指定characterEncoding的值
if (realJavaEncoding.equalsIgnoreCase("UTF-8") || realJavaEncoding.equalsIgnoreCase("UTF8")) {
	// charset names are case-sensitive

	// 取MySQL服务端character_set_server
	boolean useutf8mb4 = CharsetMapping.UTF8MB4_INDEXES.contains(this.session.getServerDefaultCollationIndex());

	if (!this.useOldUTF8Behavior.getValue()) {
		if (dontCheckServerMatch || !this.session.characterSetNamesMatches("utf8") || (!this.session.characterSetNamesMatches("utf8mb4"))) {
			// 执行set names xxx
			execSQL(null, "SET NAMES " + (useutf8mb4 ? "utf8mb4" : "utf8"), -1, null, false, this.database, null, false);
			this.session.getServerVariables().put("character_set_client", useutf8mb4 ? "utf8mb4" : "utf8");
			this.session.getServerVariables().put("character_set_connection", useutf8mb4 ? "utf8mb4" : "utf8");
		}
	} else {
		execSQL(null, "SET NAMES latin1", -1, null, false, this.database, null, false);
		this.session.getServerVariables().put("character_set_client", "latin1");
		this.session.getServerVariables().put("character_set_connection", "latin1");
	}

	this.characterEncoding.setValue(realJavaEncoding);
}
```

在获取mysql的服务器参数后，解析字符集编码：

- 当character_set_server为utf8时，执行SET NAMES utf8
- 当character_set_server为utf8mb4时，执行SET NAMES utf8mb4

## 4.错误解决

1. 修改my.cnf文件

   ```sh
   character_set_server = utf8mb4
   ```

   通过`show variables like "%char%";`命令查看character_set_server的值

2. 修改JDBC编码为utf8mb4

3. 临时解决方案： 如果以上方法都不起作用，可以考虑在插入数据前将emoji转换为其Unicode表示：

   ```java
   String processed = StringEscapeUtils.escapeJava(originalString);
   ```

   然后在读取时再转换回来。
