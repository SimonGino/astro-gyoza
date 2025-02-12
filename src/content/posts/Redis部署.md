---
title: Redis高可用部署与配置指南
author: Jinx
date: 2024-02-01
slug: redis-ha-deployment-guide
featured: true
draft: false
category: database
tags:
  - 主从复制
  - 哨兵模式
  - 高可用
  - 服务部署
description: 详细介绍Redis的完整部署流程，包括源码编译安装、主从复制配置、哨兵模式部署，以及性能优化和安全配置等关键步骤
---

# Redis部署

## 一、下载并解压Redis

### 1、执行下面的命令下载redis：

```shell
wget https://download.redis.io/releases/redis-6.2.6.tar.gz
```

### 2、解压redis：

```shell
tar xzf redis-6.2.6.tar.gz
```

### 3、移动redis目录，一般都会将redis目录放置到 /usr/local/redis目录：

```shell
mv redis-6.2.6 /usr/local/redis
```

## 二、编译并安装redis

### 1、进入redis安装目录，执行make命令编译redis：

```shell
cd /usr/local/redis
make
```

等待make命令执行完成即可。如果执行make命令报错：cc 未找到命令。原因是虚拟机系统中缺少gcc，执行下面命令安装gcc：

```shell
yum -y install gcc automake autoconf libtool make
```

如果执行make命令报错：致命错误:jemalloc/jemalloc.h: 没有那个文件或目录，则需要在make指定分配器为libc。执行下面命令即可正常编译：

```shell
make MALLOC=libc
```

make命令执行完，redis就编译完成了。

### 2、执行下面命令安装redis，并指定安装目录

```shell
make install PREFIX=/usr/local/redis
```

redis即安装成功

## 三、启动redis

1、进入redis安装目录，执行下面命令启动redis服务

```shell
cd /usr/local/redis
./bin/redis-server redis.conf
```

可看到redis服务被成功启动。

但这种启动方式不能退出控制台，如果退出，那么redis服务也会停止。

<span style="color:red">如果想要redis以后台方式运行，需要修改redis的配置文件：redis.conf。将该配置文件中的daemonize no改为daemonize yes即可</span>

修改完成后，重新执行启动命令启动redis，然后通过下面命令查看redis进程，可以发现redis服务已经被启动了：

```shell
ps -ef | grep redis
```

2、通过redis-cli测试redis是否可用，在redis安装目录执行下面命令：

```python
./bin/redis-cli
```

3、执行以下命令切换database

```shell
select 1
```

4、redis.conf配置

```shell
切换到配置文件目录
cd /usr/local/redis
vi redis.conf

1、#bind 127.0.0.1 屏蔽这段，表示允许远程访问；
2、requirepass 123456 #设置下密码，123456为密码；
```

通过查看配置文件：vi redis.conf , 查看databases数据库数量（默认是16，0~15，各库之前的数据互不影响）

## 四、高可用

### 1、主从模式

1、切换到redis安装目录，配置：

```shell
cd /usr/local/redis
vi redis.conf

master的redis.conf配置文件
1、#bind 127.0.0.1 屏蔽这段，表示允许远程访问；
2、requirepass 123456 #设置下密码，123456为密码；

slave的redis.conf配置文件
1、从节点的redis.conf文件中，增加：
replicaof master节点IP master节点端口（适用于5.0.0版本之后）
slaveof master节点IP master节点端口（适用于5.0.0版本之前）
主节点无需任何配置；
2、masterauth password #主服务器密码，如果主服务有密码的话，这里一定要配置

启动redis：
./bin/redis-server redis.conf
```

2、slave节点启动后，可见从master同步的配置日志

![img](https://yumchina.feishu.cn/space/api/box/stream/download/asynccode/?code=NmZkNjQ3ZTZjODNiMDRkMTkyMzNmNzI4NTdiOTYyNTFfSFVLSUdscW1FejJSWTZnQVNqV3ZxalZVTFo5QUtjQlRfVG9rZW46Ym94Y25uRWtlUmZWTkxEdGN5blg5OG15TThmXzE3MDgzMDkzNjE6MTcwODMxMjk2MV9WNA)

3、登录redsi主节点，通过命令查看集群信息

```shell
cd /usr/local/redis
./bin/redis-cli -h 127.0.0.1 -p 6379 -a password
info replication
```

### 2、哨兵模式

继承与主从模式，相当于给主从加了一层代理。如果master节点宕机，会自动选举一台slave成为master，重新绑定主从关系；如果过段时间原master节点恢复，则会自动加入主从配置。

#### 2.1、先按主从配置、启动master和slave

#### 2.2、配置sentinel.conf

```shell
# 切换到redis安装目录
cd /usr/local/redis
vi sentinel.conf

# 默认开启保护模式，是否允许其他主机访问或者连接等。
改为no即其他客户端可以连接本机redis服务端，或者可以配置上面的ip地址为其他客户端的地址来访问也可，或者设置redis密码
protected-mode no

# 哨兵sentinel实例运行ip，最好加上本地ip
bind 127.0.0.1

# 哨兵sentinel实例运行的端口
port 26379

# 哨兵sentinel监控的redis主节点的 ip port
# master-name 可以自己命名的主节点名字 只能由字母A-z、数字0-9 、这三个字符".-_"组成。
# quorum 配置多少个sentinel哨兵统一认为master主节点失联 那么这时客观上认为主节点失联了
# 注意：如果 quorum 给的值过大， 超过主机数量， 可能会导致 master 主机挂掉之后， 没有新的 slave来替代 master
# quorum一般取值原则为：n为哨兵数量和，quorum = n/2 + 1
# sentinel monitor <master-name> <ip> <redis-port> <quorum>
sentinel monitor mymaster 127.0.0.1 6379 2

# 指定多少毫秒之后 主节点没有应答哨兵sentinel 此时 哨兵主观上认为主节点下线 默认30秒
# sentinel down-after-milliseconds <master-name> <milliseconds>
sentinel down-after-milliseconds mymaster 3000

# 故障转移的超时时间 failover-timeout 可以用在以下这些方面：
#1. 同一个sentinel对同一个master两次failover之间的间隔时间。
#2. 当一个slave从一个错误的master那里同步数据开始计算时间。直到slave被纠正为向正确的master那里同步数据时。
#3.当想要取消一个正在进行的failover所需要的时间。
#4.当进行failover时，配置所有slaves指向新的master所需的最大时间。不过，即使过了这个超时，slaves依然会被正确配置为指向master，但是就不按parallel-syncs所配置的规则来了
# 默认三分钟
# sentinel failover-timeout <master-name> <milliseconds>
sentinel failover-timeout mymaster 10000

# 设置哨兵sentinel 连接主从的密码 注意必须为主从设置一样的验证密码，没有的话不用设置
sentinel auth-pass mymaster 123456
```

#### 2.3、哨兵模式启动

切换到redis安装目录，执行启动

```sh
./bin/redis-sentinel sentinel.conf
```

### 3、cluster模式

<span style="color:red;font-weight:bold">业务能在哨兵下满足需求尽量用哨兵模式！</span>

```sql
哨兵模式已经可以一定程度实现Redis的高可用，不过存在单节点写入压力过大的问题，因为客户端写入数据只能在Master节点，当写入量特别大的时候主节点压力就会很大。
Redis 3.x开始提供了Cluster集群模式，可以实现对数据分布式写入。
但由于分布式集群的性能会相对较低，也不能支持Redis的所有操作，跨节点操作需要改进（flush、mget、keys等命令不能跨节点使用），客户端的维护也更复杂，所以业务能在哨兵下满足需求尽量用哨兵模式。
```

#### 3.1、配置redis.conf

```shell
# 切换到redis安装目录
cd /usr/local/redis
vi redis.conf

# 开启集群
cluster-enabled yes
#集群配置信息文件，由Redis自行更新，不用手动配置。每个节点都有一个集群配置文件用于持久化保存集群信息，需确保与运行中实例的配置文件名不冲突。
cluster-config-file nodes-6379.conf
# 节点互连超时时间，毫秒为单位
cluster-node-timeout 15000
# 在进行故障转移的时候全部slave都会请求申请为master，但是有些slave可能与master断开连接一段时间了导致数据过于陈旧，不应该被提升为master。该参数就是用来判断slave节点与master断线的时间是否过长。判断方法是：比较slave断开连接的时间和(node-timeout * slave-validity-factor)+ repl-ping-slave-period如果节点超时时间为三十秒, 并且slave-validity-factor为10，假设默认的repl-ping-slave-period是10秒，即如果超过310秒slave将不会尝试进行故障转移
cluster-slave-validity-factor 10
# master的slave数量大于该值，slave才能迁移到其他孤立master上，如这个参数被设为2，那么只有当一个主节点拥有2个可工作的从节点时，它的一个从节点才会尝试迁移。
cluster-migration-barrier 1
# 集群所有节点状态为ok才提供服务。建议设置为no，可以在slot没有全部分配的时候提供服务。
cluster-require-full-coverage yes
```

#### 3.2、启动cluster服务

切换到redis安装目录，执行启动命令（每个主从节点均需要启动cluster服务）

```shell
./bin/redis-server redis.conf
```

启动后查看下端口，可以看到端口后面多了[cluster]这样的信息

![img](https://yumchina.feishu.cn/space/api/box/stream/download/asynccode/?code=M2QzMTFhOWQ1OGE2ZTg5MmVkOWU2OGM2NTM3YWNiMjdfM0JLa2RhWFZFNVJ0Yk1EVDNlYTY1bHB6SHZDdEt1cTVfVG9rZW46Ym94Y253VElvUW82cGh3ekw1Qnp6ZnhWWG1jXzE3MDgzMDkzNjE6MTcwODMxMjk2MV9WNA)

#### 3.3、搭建集群

```shell
# create 创建集群
# replicas  代表每个主节点有几个从节点
# 后面跟上的IP和端口是所有master和slave的节点信息
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 --cluster-replicas 1
```

（我们可以使用 N 个Master 和 N+1 个 Slave，正常情况下多余的一个实例作为随机一个 Master 的 Slave，一旦有实例宕机，可以迅速顶替，以保证每个主节点总是有至少一个从节点保持数据同步）

![img](https://yumchina.feishu.cn/space/api/box/stream/download/asynccode/?code=NGQ5M2U3Zjg4MzAyZGVhMTRlZTQzMmFlZTU3OGI4MDRfMG9KUnZYVWU4VkZNY1JNcDhuWGlac2JLNDAzdDdsOU1fVG9rZW46Ym94Y25UZURueWlXaExJRTN2aG94TWlKbDFjXzE3MDgzMDkzNjE6MTcwODMxMjk2MV9WNA)

根据提示信息，键入yes，集群搭建完成

![img](https://yumchina.feishu.cn/space/api/box/stream/download/asynccode/?code=ODMzODgyNzg4NzVlMTI2MTNlNzBjMmFjMmZlNzJkYWZfY2kySzNXeU10c0xIUFZMQWQyM21xcDF1RXVRaXBtM0JfVG9rZW46Ym94Y244dVJRQjB0U05aZkFxRUIyelZaZHNmXzE3MDgzMDkzNjE6MTcwODMxMjk2MV9WNA)

#### 3.4、redis-cli --cluster命令

```shell
# 添加主节点，为一个指定集群添加节点，需要先连到该集群的任意一个节点IP（127.0.0.1:6379），再把新节点加入。该2个参数的顺序有要求：新加入的节点放前
redis-cli --cluster add-node 127.0.0.1:6382 127.0.0.1:6379

# 创建从节点，把6382节点加入到6379节点的集群中，并且当做node_id为 117457eab5071954faab5e81c3170600d5192270 的从节点。如果不指定 --cluster-master-id 会随机分配到任意一个主节点。
redis-cli --cluster add-node 127.0.0.1:6382 127.0.0.1:6379 --cluster-slave --cluster-master-id 117457eab5071954faab5e81c3170600d5192270

# 删除节点，指定IP、端口和node_id 来删除一个节点，从节点可以直接删除，主节点（即使没有key）不能删除，从节点删除之后，会被shutdown
redis-cli --cluster del-node 127.0.0.1:6384 f6a6957421b80409106cb36be3c7ba41f3b603ff

# 检查，任意连接一个集群节点，进行集群状态检查
redis-cli --cluster check 127.0.0.1:6384 --cluster-search-multiple-owners

# 查看，检查key、slots、从节点个数的分配情况
redis-cli --cluster info 127.0.0.1:6384

# 修复
redis-cli --cluster fix 127.0.0.1:6384 --cluster-search-multiple-owners

# 设置集群的超时时间
redis-cli --cluster set-timeout 127.0.0.1:6382 10000
```
