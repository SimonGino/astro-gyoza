---
title: FastJSON字段名智能匹配机制与解决方案
author: Jinx
date: 2024-04-15
slug: fastjson-field-smart-match-solution
featured: true
draft: false
category: java
tags:
  - JSON序列化
  - FastJSON配置
  - 字段映射
  - Feature配置
description: 详细解析FastJSON在反序列化时字段智能匹配导致的问题，包括_checked与checked字段冲突的案例分析，以及通过DisableFieldSmartMatch特性解决字段名自动忽略下划线的完整方案
---

想要序列化这样的JSONArray

```json
[
  {
    "_checked": true,
    "checked": 0,
    "key": "department",
    "label": "部门",
    "sortedEnabled": 0,
    "sortedType": ""
  },
  {
    "_checked": true,
    "checked": 2,
    "key": "username",
    "label": "用户名",
    "sortedEnabled": 0,
    "sortedType": ""
  }
]
```

对应的实体对象

```java
@Data
public class QueryOrderDTO {
    /**
     * 字段中文名
     */
    private String label;
    /**
     * 字段英文名
     */
    private String key;

    /**
     * 是否勾选 0勾选 1不勾 2默认
     */
    private Integer checked;

    /**
     * 排序开关 0-false 1-true
     */
    private Integer sortedEnabled;

    /**
     * 排序开关 ASC/DESC
     */
    private String sortedType;
}
```

发现因为增加了\_checked字符，导致序列化只能匹配到\_checked字段,具体生成打印数据如下

```java
public class JSONParseUtil {
    public static void main(String[] args) {
        String json = "[{\"_checked\":true,\"checked\":0,\"key\":\"department\",\"label\":\"部门\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":true,\"checked\":2,\"key\":\"username\",\"label\":\"用户名\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":true,\"checked\":2,\"key\":\"question\",\"label\":\"问题\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":true,\"checked\":2,\"key\":\"answer\",\"label\":\"答案\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":false,\"checked\":1,\"key\":\"employeeId\",\"label\":\"员工编号\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":false,\"checked\":1,\"key\":\"directory\",\"label\":\"目录\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":true,\"checked\":0,\"key\":\"referenceFiles\",\"label\":\"参考文件\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":true,\"checked\":0,\"key\":\"dislikeReason\",\"label\":\"点踩原因\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":true,\"checked\":0,\"key\":\"feedbackStatus\",\"label\":\"反馈状态\",\"sortedEnabled\":0,\"sortedType\":\"\"},{\"_checked\":true,\"checked\":0,\"key\":\"questionTime\",\"label\":\"提问时间\",\"sortedEnabled\":0,\"sortedType\":\"\"}]";

        List<QueryOrderDTO> queryOrderDTOS =
                JSON.parseArray(json, QueryOrderDTO.class);
        queryOrderDTOS.forEach(System.out::println);
    }
}
```

​

```
QueryOrderDTO(label=部门, key=department, checked=1, sortedEnabled=0, sortedType=)
QueryOrderDTO(label=用户名, key=username, checked=1, sortedEnabled=0, sortedType=)
```

fastjson把\_checked当作checked处理了，忽略了前面的下划线，导致真正的checked字段没有被获取到。具体原因参考GitHub的Issuehttps://github.com/alibaba/fastjson/issues/2026

https://github.com/alibaba/fastjson/issues/3035

解决办法参考：https://github.com/alibaba/fastjson/issues/3549

parse 默认开启了`FieldSmartMatch`， 处理key时会忽略掉下划线，因此在解析时，误把`aid`当做`a_id`进行解析，value应该为int但`aid`对应的value却是str，因此会出现类型转换异常。

**解决办法：**

1. 类注解加上`Feature.DisableFieldSmartMatch`关闭智能匹配即可

```java
    @JSONType(parseFeatures = Feature.DisableFieldSmartMatch)
    public static class ATest {
        private int a_id;
    }
```

1. 指定字段加上`Feature.DisableFieldSmartMatch`关闭智能匹配即可

```java
    public class ATest {
        @JSONField(parseFeatures = Feature.DisableFieldSmartMatch)
        private int a_id;
    }
```

> 参考 [wiki](https://github.com/alibaba/fastjson/wiki/Feature_DisableFieldSmartMatch_cn)
