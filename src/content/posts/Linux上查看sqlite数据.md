---
title: SQLite命令行工具使用指南
author: Jinx
date: 2024-08-26
slug: sqlite-cli-guide-on-linux
featured: true
draft: false
categories:
  - database
tags:
  - SQLite命令
  - 数据库查询
  - 表结构查看
  - CLI工具
description: 详细介绍在Linux系统上使用SQLite命令行工具的完整教程，包括安装配置、数据库连接、表结构查看、数据查询等常用操作指令的使用方法
---

# Linux上查看sqlite数据

## 确保安装SQLite

### 检测版本

```shell
sqlite3 --version
```

### 安装命令

```shell
apt-get install sqlite3
```

## 打开sqlite文件

### 命令

```shell
sqlite3 /path/to/your/database.db
```

## 数据库查询命令

### 查看所有的表

```sql
.tables
```

```text
sqlite> .tables
_sqlx_migrations  file_changelog    folder_changelog  path_changelog
drives            files             folders           paths
```

### 查看指定表结构

```sql
.schema files
```

将显示表的创建语句和相关的触发器

```text
CREATE TABLE files (
    'id' TEXT NOT NULL,
    'drive_id' TEXT NOT NULL,
    'name' TEXT NOT NULL,
    'trashed' BOOLEAN NOT NULL,
    'parent' TEXT NOT NULL,
    'md5' TEXT NOT NULL,
    'size' BIGINT NOT NULL,
    PRIMARY KEY('id', 'drive_id'),
    FOREIGN KEY('drive_id') REFERENCES drives('id') ON DELETE CASCADE,
    -- Deferred constraint so integrity is checked at the end of the transaction.
    FOREIGN KEY('parent', 'drive_id') REFERENCES folders('id', 'drive_id') ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX files_parent ON files ('parent', 'drive_id');
CREATE TRIGGER file_delete
AFTER DELETE ON files
BEGIN
    INSERT INTO file_changelog ('id', 'drive_id', 'deleted', 'name', 'trashed', 'parent', 'md5', 'size')
    VALUES (OLD.id, OLD.drive_id, 1, OLD.name, OLD.trashed, OLD.parent, OLD.md5, OLD.size);
END;
CREATE TRIGGER file_update
AFTER UPDATE ON files
WHEN OLD.name <> NEW.name OR OLD.trashed <> NEW.trashed OR OLD.parent <> NEW.parent OR OLD.md5 <> NEW.md5 OR OLD.size <> NEW.size
BEGIN
    INSERT INTO file_changelog ('id', 'drive_id', 'deleted', 'name', 'trashed', 'parent', 'md5', 'size')
    VALUES
        (OLD.id, OLD.drive_id, 1, OLD.name, OLD.trashed, OLD.parent, OLD.md5, OLD.size),
        (NEW.id, NEW.drive_id, 0, NEW.name, NEW.trashed, NEW.parent, NEW.md5, NEW.size);
END;
CREATE TRIGGER file_create
AFTER INSERT ON files
BEGIN
    INSERT INTO file_changelog ('id', 'drive_id', 'deleted', 'name', 'trashed', 'parent', 'md5', 'size')
    VALUES (NEW.id, NEW.drive_id, 0, NEW.name, NEW.trashed, NEW.parent, NEW.md5, NEW.size);
END;
```

查看数据表的结构

```sql
PRAGMA table_info(table_name);  //将table_name替换为实际表的名称
```

```txt
0|id|TEXT|1||1
1|drive_id|TEXT|1||2
2|name|TEXT|1||0
3|trashed|BOOLEAN|1||0
4|parent|TEXT|1||0
5|md5|TEXT|1||0
6|size|BIGINT|1||0
```

## 退出Sqlite终端

```sql
.quit
```
