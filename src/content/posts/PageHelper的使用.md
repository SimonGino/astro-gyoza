---
title: MyBatis PageHelper分页插件使用指南
author: Jinx
date: 2024-04-15
slug: mybatis-pagehelper-guide
featured: true
draft: false
category: java
tags:
  - PageHelper
  - 分页查询
  - MyBatis插件
  - 性能优化
description: 详细介绍MyBatis PageHelper分页插件的使用方法和实现原理，包括基础配置、查询示例、ThreadLocal原理分析以及PageInterceptor拦截器的核心实现
---

## PageHelper使用

maven引入

```xml
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.2.8</version>
</dependency>
```

代码使用

```java
// 设置分页参数，第一页，分页条数为10
PageHelper.startPage(1, 10);
// 开始查询
List<FastName> list = fastNameMapper.queryNameByTopicTitle();
// 将查询结果包装到PageInfo，PageInfo中包含了页码，查询结果，当前页码等信息
PageInfo pageInfo = new PageInfo<>(list);
```

or

```java
PageInfo pageInfo = PageHelper.startPage(1, 10).doSelectPageInfo(
() -> fastNameMapper.queryNameByTopicTitle());
```

## PageHelper原理

先看下刚刚的`startPage`方法

```java
public static <E> Page<E> startPage(int pageNum, int pageSize) {
      return startPage(pageNum, pageSize, DEFAULT_COUNT);
}

public static <E> Page<E> startPage(int pageNum, int pageSize, boolean count) {
        return startPage(pageNum, pageSize, count, (Boolean)null, (Boolean)null);
    }

public static <E> Page<E> startPage(int pageNum, int pageSize, boolean count, Boolean reasonable, Boolean pageSizeZero) {
        Page<E> page = new Page(pageNum, pageSize, count);
        page.setReasonable(reasonable);
        page.setPageSizeZero(pageSizeZero);
        Page<E> oldPage = getLocalPage();
        if (oldPage != null && oldPage.isOrderByOnly()) {
            page.setOrderBy(oldPage.getOrderBy());
        }
		// @核心代码
        setLocalPage(page);
        return page;
    }

protected static final ThreadLocal<Page> LOCAL_PAGE = new ThreadLocal();
protected static boolean DEFAULT_COUNT = true;

protected static void setLocalPage(Page page) {
    	// @核心代码
        LOCAL_PAGE.set(page);
    }
```

根据分页参数保存了一个Page设置到ThreadLocal中保存起来。

**核心的类：PageInterceptor**

```java
@Intercepts({@Signature(
    type = Executor.class,
    method = "query",
    args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}
), @Signature(
    type = Executor.class,
    method = "query",
    args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class, CacheKey.class, BoundSql.class}
)})
public class PageInterceptor implements Interceptor {
    private volatile Dialect dialect;
    private String countSuffix = "_COUNT";
    protected Cache<String, MappedStatement> msCountMap = null;
    private String default_dialect_class = "com.github.pagehelper.PageHelper";

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        try {
            Object[] args = invocation.getArgs();
            MappedStatement ms = (MappedStatement) args[0];
            Object parameter = args[1];
            RowBounds rowBounds = (RowBounds) args[2];
            ResultHandler resultHandler = (ResultHandler) args[3];
            Executor executor = (Executor) invocation.getTarget();
            CacheKey cacheKey;
            BoundSql boundSql;
            //由于逻辑关系，只会进入一次
            if (args.length == 4) {
                //4 个参数时
                boundSql = ms.getBoundSql(parameter);
                cacheKey = executor.createCacheKey(ms, parameter, rowBounds, boundSql);
            } else {
                //6 个参数时
                cacheKey = (CacheKey) args[4];
                boundSql = (BoundSql) args[5];
            }
            checkDialectExists();

            List resultList;
            //调用方法判断是否需要进行分页，如果不需要，直接返回结果
            if (!dialect.skip(ms, parameter, rowBounds)) {
                //判断是否需要进行 count 查询
                if (dialect.beforeCount(ms, parameter, rowBounds)) {
                    //查询总数
                    Long count = count(executor, ms, parameter, rowBounds, resultHandler, boundSql);
                    //处理查询总数，返回 true 时继续分页查询，false 时直接返回
                    if (!dialect.afterCount(count, parameter, rowBounds)) {
                        //当查询总数为 0 时，直接返回空的结果
                        return dialect.afterPage(new ArrayList(), parameter, rowBounds);
                    }
                }
                // @1 核心代码1
                resultList = ExecutorUtil.pageQuery(dialect, executor,
                        ms, parameter, rowBounds, resultHandler, boundSql, cacheKey);
            } else {
                //rowBounds用参数值，不使用分页插件处理时，仍然支持默认的内存分页
                resultList = executor.query(ms, parameter, rowBounds, resultHandler, cacheKey, boundSql);
            }
            return dialect.afterPage(resultList, parameter, rowBounds);
        } finally {
            if(dialect != null){
            	// @2 核心代码2
                dialect.afterAll();
            }
        }
    }
    xxxxxx......
}



public static  <E> List<E> pageQuery(Dialect dialect, Executor executor, MappedStatement ms, Object parameter,
                             RowBounds rowBounds, ResultHandler resultHandler,
                             BoundSql boundSql, CacheKey cacheKey) throws SQLException {
    //判断是否需要进行分页查询
    if (dialect.beforePage(ms, parameter, rowBounds)) {
        //生成分页的缓存 key
        CacheKey pageKey = cacheKey;
        //处理参数对象
        parameter = dialect.processParameterObject(ms, parameter, boundSql, pageKey);
        //调用方言获取分页 sql
        // @核心代码
        String pageSql = dialect.getPageSql(ms, boundSql, parameter, rowBounds, pageKey);
        BoundSql pageBoundSql = new BoundSql(ms.getConfiguration(), pageSql, boundSql.getParameterMappings(), parameter);

        Map<String, Object> additionalParameters = getAdditionalParameter(boundSql);
        //设置动态参数
        for (String key : additionalParameters.keySet()) {
            pageBoundSql.setAdditionalParameter(key, additionalParameters.get(key));
        }
        //执行分页查询
        return executor.query(ms, parameter, RowBounds.DEFAULT, resultHandler, pageKey, pageBoundSql);
    } else {
        //不执行分页的情况下，也不执行内存分页
        return executor.query(ms, parameter, RowBounds.DEFAULT, resultHandler, cacheKey, boundSql);
    }
}


 @Override
    public String getPageSql(MappedStatement ms, BoundSql boundSql, Object parameterObject, RowBounds rowBounds, CacheKey pageKey) {
        return autoDialect.getDelegate().getPageSql(ms, boundSql, parameterObject, rowBounds, pageKey);
    }


# getPageSql方法
  @Override
    public String getPageSql(MappedStatement ms, BoundSql boundSql, Object parameterObject, RowBounds rowBounds, CacheKey pageKey) {
        String sql = boundSql.getSql();
        Page page = getLocalPage();
        //支持 order by
        String orderBy = page.getOrderBy();
        if (StringUtil.isNotEmpty(orderBy)) {
            pageKey.update(orderBy);
            sql = OrderByParser.converToOrderBySql(sql, orderBy);
        }
        if (page.isOrderByOnly()) {
            return sql;
        }
        // @核心代码
        return getPageSql(sql, page, pageKey);
    }


```

总结：流程大致为：

1. 设置分页参数到ThreadLocal中
2. 调用查询，基于插件（拦截器）拦截query方法，从ThreadLocal中获取分页参数，针对不同的数据库类型使用不同的数据库分页方案
3. 根据结果包装返回PageInfo，这里注意的是调用了查询方法返回的List实际上是PageHelper的一个内部实现类Page，Page继承自ArrayList，保存了分页使用的参数

## 封装PageReult

```java
import lombok.Data;

import java.io.Serializable;

@Data
public class Page implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 当前为第几页（可在入参指定）,从1开始
     */
    private int pageNum;

    /**
     * 每页的数据行数（可在入参指定）
     */
    private int pageSize;

    /**
     * 是否获取总行数
     * 入参指定为true的场合，表示本次查询总页数信息
     * 返回值为true的场合，表示为本次返回值包含总页数信息
     */
    private Boolean count;

    /**
     * 总页数
     * 非入参，入参指定获取总行数的场合，返回值中可获取
     */
    private Integer pages;

    /**
     * 总行数
     * 非入参，入参指定获取总行数的场合，返回值中可获取
     */
    private Long total;

    /**
     * 是否有下一页
     */
    private Boolean hasNextPage;

    public Page(){}

    public Page(int pageNum, int pageSize, boolean count){
        this.pageNum = pageNum;
        this.pageSize = pageSize;
        this.count = count;
    }
}
```

```java
import com.github.pagehelper.PageHelper;
import lombok.Data;

@Data
public class PageModel {

    /**
     * 分页信息对象
     */
    private Page page;

    public void startPage() {
        PageHelper.startPage(page.getPageNum(), page.getPageSize(), page.getCount() == null ? false : page.getCount());
    }
}
```

```java
@Data
public class PageResult<T> {

    /**
     * 分页信息对象
     */
    private Page page;

    /**
     * 结果集
     */
    private List<T> list;


    public PageResult(List<T> list){
        initializePageResult(list, null);
    }

    public PageResult(List<T> list, PageInfo<T> pageInfo) {
        initializePageResult(list, pageInfo);
    }

    private void initializePageResult(List<T> list, PageInfo<T> pageInfo) {
        //封入结果集
        this.list = list;
        this.page = new Page();

        if (pageInfo == null) {
            pageInfo = new PageInfo<>(list);
        }

        //当前页码
        page.setPageNum(pageInfo.getPageNum());
        //每页的数据行数
        page.setPageSize(pageInfo.getPageSize());

        if (pageInfo.getTotal() > -1) {
            //本次查询了总页数信息的场合
            //标记为本次结果有总页数信息
            page.setCount(true);
            //总页数
            page.setPages(pageInfo.getPages());
            //总记录数
            page.setTotal(pageInfo.getTotal());
            //是否有下一页
            page.setHasNextPage(pageInfo.isHasNextPage());
        }
    }
}
```

### Reference

https://blog.csdn.net/qq_31086797/article/details/106628523
