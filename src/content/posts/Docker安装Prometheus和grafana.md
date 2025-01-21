---
title: Docker部署Prometheus与Grafana监控系统配置指南
author: Jinx
date: 2024-03-13
slug: docker-prometheus-grafana-setup
featured: true
draft: false
categories:
  - docker
tags:
  - 监控系统
  - 数据可视化
  - 容器配置
  - 服务集成
description: 详细介绍使用Docker部署Prometheus和Grafana监控系统的完整流程，包括容器间网络通信配置、数据源集成、监控目标配置以及常见问题的解决方案
---

<!-- more -->

使用docker安装prometheus和grafana后

当我使用prometheus时，服务正常，我可以从 `http://localhost:9090` 访问UI，所有目标都在运行。

我在grafana上`Add new connection`时，出现下述错误

```
 Error reading Prometheus: Post "http://localhost:9090/api/v1/query": dial tcp 127.0.0.1:9090: connect: connection refused
```

he `prometheus.yml` is:

```yaml
global:
  scrape_interval: 15s # By default, scrape targets every 15 seconds.

  # Attach these labels to any time series or alerts when communicating with
  # external systems (federation, remote storage, Alertmanager).
  external_labels:
    monitor: 'codelab-monitor'

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'histogram'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:1010']
```

从grafana-github的[issue](https://github.com/grafana/grafana/issues/46434)发现问题

> Grafana and Prometheus are both deployed using Docker?
> The localhost of one container is not the localhost of another container, even if you published the port to the host – you can't reach the Prometheus container or the host using localhost from the Grafana container. You need to use the IP address of the Prometheus container, or the hostname if you are using Docker Compose.If you need further help, please post your Docker configs (docker-compose.yml or docker run commands).

**解决办法：**

如果是用docker启动这两个容器可以尝试使用`http://host.docker.internal:9090` 去添加数据源

也可以 `prometheus:9090`，prometheus为容器的名称
