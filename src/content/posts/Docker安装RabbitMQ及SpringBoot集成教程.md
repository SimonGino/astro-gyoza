---
title: Docker安装RabbitMQ及SpringBoot集成实战指南
author: Jinx
date: 2024-10-25 10:30:00
slug: docker-rabbitmq-springboot-integration
featured: true
draft: false
tags:
  - docker
categories:
  - 后端开发
  - 中间件
  - 容器化部署
keywords:
  - Docker
  - RabbitMQ
  - SpringBoot
  - 消息队列
  - AMQP
  - 消息中间件
  - 分布式系统
description: 本文详细介绍如何使用Docker部署RabbitMQ消息队列，以及在SpringBoot项目中进行集成。包含完整的安装配置步骤、三种交换机类型的实战示例和运行效果展示。
---

# Docker安装RabbitMQ及SpringBoot集成实战指南

## 1. 概述

RabbitMQ是一个开源的消息代理中间件，它可以为应用程序提供一个通用的消息发送和接收平台，并保证消息的安全传递。本文将详细介绍如何使用Docker安装RabbitMQ，以及在SpringBoot应用中集成RabbitMQ，实现消息的发布和订阅。

## 2. Docker安装RabbitMQ

### 2.1 查询RabbitMQ镜像

首先使用docker search命令查看可用的RabbitMQ镜像：

```shell
docker search rabbitmq
```

### 2.2 拉取镜像

拉取官方最新版本的RabbitMQ镜像：

```shell
docker pull rabbitmq
```

如果需要特定版本，可以在rabbitmq后面加上版本号，如：`rabbitmq:3.9`

### 2.3 运行RabbitMQ容器

使用以下命令运行RabbitMQ容器：

```shell
docker run -d --hostname my-rabbit --name rabbit \
  -p 15672:15672 \
  -p 5673:5672 \
  rabbitmq
```

参数说明：

- `-d`: 后台运行容器
- `--hostname`: 设置容器主机名
- `--name`: 设置容器名称
- `-p 15672:15672`: 映射管理界面端口
- `-p 5673:5672`: 映射AMQP协议端口

### 2.4 启用管理插件

进入容器并启用Web管理界面：

```shell
# 进入容器
docker exec -it <容器ID> /bin/bash

# 启用管理插件
rabbitmq-plugins enable rabbitmq_management

# 退出容器
exit
```

现在可以通过`http://localhost:15672`访问RabbitMQ管理界面，默认用户名和密码都是`guest`。

## 3. SpringBoot集成RabbitMQ

### 3.1 添加依赖

在`pom.xml`中添加RabbitMQ依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

### 3.2 配置RabbitMQ连接

在`application.yml`中配置RabbitMQ连接信息：

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5673
    username: guest
    password: guest
```

### 3.3 配置交换机和队列

RabbitMQ支持多种类型的交换机，我们将实现以下三种主要类型：

#### 3.3.1 Direct Exchange（直连交换机）

```java
@Configuration
public class DirectExchangeConfig {
    public static final String DIRECT_QUEUE = "directQueue";
    public static final String DIRECT_EXCHANGE = "directExchange";
    public static final String DIRECT_ROUTING_KEY = "direct";

    @Bean
    public Queue directQueue() {
        return new Queue(DIRECT_QUEUE, true);
    }

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(DIRECT_EXCHANGE);
    }

    @Bean
    public Binding bindingDirect(Queue directQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(directQueue)
                .to(directExchange)
                .with(DIRECT_ROUTING_KEY);
    }
}
```

#### 3.3.2 Fanout Exchange（广播交换机）

```java
@Configuration
public class FanoutExchangeConfig {
    public static final String FANOUT_QUEUE = "fanoutQueue";
    public static final String FANOUT_EXCHANGE = "fanoutExchange";

    @Bean
    public Queue fanoutQueue() {
        return new Queue(FANOUT_QUEUE, true);
    }

    @Bean
    public FanoutExchange fanoutExchange() {
        return new FanoutExchange(FANOUT_EXCHANGE);
    }

    @Bean
    public Binding bindingFanout(Queue fanoutQueue, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(fanoutQueue).to(fanoutExchange);
    }
}
```

#### 3.3.3 Topic Exchange（主题交换机）

```java
@Configuration
public class TopicExchangeConfig {
    public static final String TOPIC_QUEUE = "topicQueue";
    public static final String TOPIC_EXCHANGE = "topicExchange";

    @Bean
    public Queue topicQueue() {
        return new Queue(TOPIC_QUEUE, true);
    }

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(TOPIC_EXCHANGE);
    }

    @Bean
    public Binding bindingTopic(Queue topicQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(topicQueue)
                .to(topicExchange)
                .with("topic.#");
    }
}
```

### 3.4 消息生产者

创建消息发送的Controller：

```java
@RestController
@RequestMapping("/mq")
@Slf4j
public class MessageController {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    @GetMapping("/direct")
    public String sendDirect() {
        rabbitTemplate.convertAndSend(
            DirectExchangeConfig.DIRECT_EXCHANGE,
            DirectExchangeConfig.DIRECT_ROUTING_KEY,
            "Direct message"
        );
        return "Direct message sent";
    }

    @GetMapping("/fanout")
    public String sendFanout() {
        rabbitTemplate.convertAndSend(
            FanoutExchangeConfig.FANOUT_EXCHANGE,
            "",
            "Fanout message"
        );
        return "Fanout message sent";
    }

    @GetMapping("/topic")
    public String sendTopic() {
        rabbitTemplate.convertAndSend(
            TopicExchangeConfig.TOPIC_EXCHANGE,
            "topic.test",
            "Topic message"
        );
        return "Topic message sent";
    }
}
```

### 3.5 消息消费者

创建消息监听器：

```java
@Component
@Slf4j
public class MessageListener {
    @RabbitListener(queues = DirectExchangeConfig.DIRECT_QUEUE)
    public void receiveDirect(String message) {
        log.info("Received direct message: {}", message);
    }

    @RabbitListener(queues = FanoutExchangeConfig.FANOUT_QUEUE)
    public void receiveFanout(String message) {
        log.info("Received fanout message: {}", message);
    }

    @RabbitListener(queues = TopicExchangeConfig.TOPIC_QUEUE)
    public void receiveTopic(String message) {
        log.info("Received topic message: {}", message);
    }
}
```

## 4. 测试

启动SpringBoot应用后，可以通过以下方式测试：

1. Direct Exchange测试：
   访问 `http://localhost:8080/mq/direct`

2. Fanout Exchange测试：
   访问 `http://localhost:8080/mq/fanout`

3. Topic Exchange测试：
   访问 `http://localhost:8080/mq/topic`

## 5. 总结

本文介绍了如何使用Docker安装RabbitMQ，以及在SpringBoot应用中集成RabbitMQ的完整过程。通过实现三种不同类型的交换机，展示了RabbitMQ的灵活性和强大功能。这种消息队列的使用可以有效地解耦应用程序，提高系统的可扩展性和可维护性。

希望本文对你理解和使用RabbitMQ有所帮助。如果你在实践过程中遇到任何问题，欢迎在评论区讨论。

## 参考资料

- [RabbitMQ官方文档](https://www.rabbitmq.com/documentation.html)
- [Spring AMQP文档](https://docs.spring.io/spring-amqp/docs/current/reference/html/)
- [Docker官方文档](https://docs.docker.com/)
