# TopFac - 智能网络拓扑生成系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Nuxt.js](https://img.shields.io/badge/Nuxt.js-3.19.2-00DC82)](https://nuxt.com/)
[![Hono](https://img.shields.io/badge/Hono-4.6.3-E36002)](https://hono.dev/)

## 📖 项目简介

TopFac 是一个智能网络拓扑生成系统，支持通过自然语言描述或结构化文本快速生成网络拓扑图。系统采用前后端分离架构，提供直观的可视化界面和强大的 AI 辅助功能。

### 核心功能

- 🤖 **AI 智能转换**：支持自然语言描述转换为标准拓扑文本
- 📝 **文本解析**：解析结构化文本生成拓扑数据
- 🎨 **可视化生成**：自动生成 DrawIO 格式的拓扑图
- 📊 **版本管理**：支持多版本管理和版本对比
- 💾 **本地存储**：基于 JSON 文件的轻量级数据存储
- 🔄 **实时预览**：即时查看生成的拓扑图效果

### 技术栈

**前端：**
- Nuxt.js 3.19.2 (Vue 3 框架)
- Vuetify 3 (Material Design UI 组件库)
- TypeScript (类型安全)

**后端：**
- Hono.js 4.6.3 (轻量级 Web 框架)
- Node.js 18+ (运行时环境)
- JSON 文件数据库 (数据持久化)

**部署：**
- Nginx (反向代理 + HTTPS)
- systemd (服务管理)

---

## 🏗️ 系统架构

### 整体架构

```
用户浏览器 (HTTPS:443)
    ↓
Nginx 反向代理 (SSL + 静态资源 + API代理)
    ↓
Hono.js 后端服务 (HTTP:30010)
    ├── API 路由 (projects, versions, ai, parse, generate)
    ├── 业务服务 (TextParser, DrawIOService)
    └── 数据库层 (JSON DB + File Lock)
        ↓
JSON 文件存储 (projects.json, project_versions.json, etc.)
```

```
┌─────────────────────────────────────────────────────────────┐
│                    阿里云ECS服务器                            │
│                 Ubuntu 22.04.5 LTS                          │
│                  IP: 公网IP。                                │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Nginx      │   │  Node.js     │   │  Certbot     │
│  (宿主机)     │   │  (宿主机)     │   │  (宿主机)     │
│  端口: 80     │   │  端口: 30010  │   │  SSL证书     │
│  端口: 443    │   │              │   │  自动续期     │
└──────────────┘   └──────────────┘   └──────────────┘
     systemd            systemd            systemd
   nginx.service     topfac.service     certbot.timer



### 前端架构

```
client/
├── pages/                    # 页面路由
│   ├── index.vue            # 首页
│   ├── topology-projects.vue # 项目列表
│   └── topology-editor/[id].vue # 拓扑编辑器
├── components/              # 可复用组件
│   ├── AIConversionPanel.vue    # AI 转换面板
│   ├── TopologyPreview.vue      # 拓扑预览
│   ├── ParsedDataViewer.vue     # 解析数据查看器
│   ├── XmlCodeViewer.vue        # XML 代码查看器
│   └── VersionHistory.vue       # 版本历史
├── services/                # API 服务
│   └── topology-api.ts      # API 客户端
└── plugins/                 # 插件
    └── vuetify.ts          # Vuetify 配置
```

### 后端架构

```
server/
├── index.js                 # 应用入口
├── routes/                  # API 路由
│   ├── projects.js         # 项目管理
│   ├── versions.js         # 版本管理
│   ├── ai.js               # AI 转换
│   ├── parse.js            # 文本解析
│   └── generate.js         # XML 生成
├── services/               # 业务服务
│   ├── TextParser.js       # 文本解析器
│   └── DrawIOService.js    # DrawIO XML 生成器
└── database/               # 数据库层
    └── index.js           # JSON 数据库
```

---

## 🔄 核心组件及调用关系

### 组件调用流程

**生成拓扑图流程：**

```
用户 → topology-editor → topology-api → projects.js
                                            ↓
                                      TextParser.parseTopologyText()
                                            ↓
                                      DrawIOService.generateXML()
                                            ↓
                                      JSONDatabase.create()
                                            ↓
                                      返回版本数据
```

**AI 转换流程：**

```
用户 → AIConversionPanel → topology-api → ai.js → AI API (外部)
                                                      ↓
                                                  标准文本
```

### API 路由

#### 项目管理

```
GET    /api/projects              # 获取项目列表
POST   /api/projects              # 创建项目
GET    /api/projects/:id          # 获取项目详情
PUT    /api/projects/:id          # 更新项目
DELETE /api/projects/:id          # 删除项目
GET    /api/projects/:id/versions # 获取版本列表
POST   /api/projects/:id/process  # 处理工作流（解析+生成）
```

#### 版本管理

```
GET    /api/versions/:id          # 获取版本详情
PUT    /api/versions/:id          # 更新版本
DELETE /api/versions/:id          # 删除版本
GET    /api/versions/:id/download # 下载 XML 文件
```

#### AI 转换

```
POST   /api/ai/convert            # AI 转换自然语言
GET    /api/ai/configs            # 获取 AI 配置列表
```

---

## 📦 部署指南

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- 操作系统: Linux / macOS / Windows
- 内存: >= 512MB
- 磁盘: >= 1GB

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/Matthewyin/topfac.git
cd topfac

# 2. 安装依赖
npm run install:all

# 3. 启动开发服务器
npm run dev

# 4. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:30010
```

### 生产部署

#### 1. 构建前端

```bash
npm run build
```

#### 2. 配置 SSL 证书（Let's Encrypt）

**安装 Certbot：**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install epel-release -y
sudo yum install certbot python3-certbot-nginx -y
```

**获取 SSL 证书（DNS 验证方式）：**

```bash
# 使用 DNS 验证（推荐，不需要开放 80 端口）
sudo certbot certonly --manual --preferred-challenges dns -d topfac.netc2c.com

# 按照提示在 DNS 服务商添加 TXT 记录
# 记录名称：_acme-challenge.topfac.netc2c.com
# 记录值：（Certbot 会提供）

# 等待 DNS 生效后按 Enter 继续
```

**或使用 HTTP 验证方式（需要开放 80 端口）：**

```bash
# 确保 80 端口开放
sudo certbot --nginx -d topfac.netc2c.com
```

#### 3. 配置 Nginx

创建 `/etc/nginx/sites-available/topfac`：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name topfac.netc2c.com;

    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name topfac.netc2c.com;

    # SSL 证书配置（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/topfac.netc2c.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/topfac.netc2c.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API 代理
    location /api/ {
        proxy_pass http://localhost:30010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置（支持长时间 AI 处理）
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:30010;
        access_log off;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:30010;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        proxy_pass http://localhost:30010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**启用配置：**

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/topfac /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

#### 4. SSL 证书续期

**DNS 验证方式（手动续期）：**

如果使用 DNS 验证，证书不会自动续期，需要在过期前手动续期：

```bash
# 在证书过期前 30 天执行
sudo certbot certonly --manual --preferred-challenges dns -d topfac.netc2c.com

# 按照提示添加新的 DNS TXT 记录
# 更新完成后重新加载 Nginx
sudo systemctl reload nginx
```

**HTTP 验证方式（自动续期）：**

如果使用 HTTP 验证，Certbot 会自动设置续期任务：

```bash
# 测试自动续期
sudo certbot renew --dry-run

# 查看自动续期任务
sudo systemctl list-timers | grep certbot
```

#### 5. 配置 systemd 服务

创建 `/etc/systemd/system/topfac.service`：

```ini
[Unit]
Description=TopFac - 智能网络拓扑生成系统
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/topfac
ExecStart=/usr/bin/node server/index.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=30010

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable topfac
sudo systemctl start topfac
```

---

## 📚 使用说明

### 创建项目

1. 访问首页，点击"创建项目"
2. 填写项目名称和描述
3. 点击"创建"保存

### 使用 AI 转换

1. 进入项目编辑页面
2. 切换到"AI 转换"标签
3. 输入自然语言描述（至少 10 个字符）
4. 点击"AI 转换"按钮
5. 等待转换完成（1-2 分钟）
6. 复制转换结果到文本编辑器

### 生成拓扑图

#### 文本格式规范

**设备定义：**
```
【环境名】【数据中心名】的【区域名】【设备名】
```

**连接定义：**
```
【环境名】【数据中心名】的【区域名】【设备A】连接【环境名】【数据中心名】的【区域名】【设备B】
```

**示例：**
```
【生产网】【数据中心】的【核心区】【核心路由器1】
【生产网】【数据中心】的【接入区】【接入交换机1】
【生产网】【数据中心】的【核心区】【核心路由器1】连接【生产网】【数据中心】的【接入区】【接入交换机1】
```

#### 生成步骤

1. 在文本编辑器中输入标准格式文本
2. 点击"生成拓扑图"按钮
3. 等待生成完成
4. 在"拓扑预览"标签查看结果

### 下载拓扑图

1. 生成拓扑图后，切换到"XML 代码"标签
2. 点击"下载拓扑图"按钮
3. 保存为 `.drawio` 文件
4. 使用 [draw.io](https://app.diagrams.net/) 打开编辑

---

## 🛠️ 开发指南

### 项目结构

```
topfac/
├── client/                  # 前端代码
│   ├── pages/              # 页面组件
│   ├── components/         # 可复用组件
│   ├── services/           # API 服务
│   └── nuxt.config.ts      # Nuxt 配置
├── server/                  # 后端代码
│   ├── routes/             # API 路由
│   ├── services/           # 业务服务
│   ├── database/           # 数据库层
│   └── index.js            # 应用入口
├── data/                    # 数据文件
├── dist/                    # 构建输出
└── package.json            # 项目配置
```

### 添加新功能

#### 1. 添加 API 端点

```javascript
// server/routes/example.js
import { Hono } from 'hono';
const example = new Hono();

example.get('/', async (c) => {
  return c.json({ success: true, data: [] });
});

export default example;
```

#### 2. 添加前端组件

```vue
<!-- client/components/Example.vue -->
<template>
  <v-card>
    <v-card-title>示例组件</v-card-title>
  </v-card>
</template>

<script setup lang="ts">
// 组件逻辑
</script>
```

### 代码规范

- 使用 ES6+ 语法
- 函数命名使用驼峰命名法
- 类命名使用帕斯卡命名法
- Vue 组件使用 Composition API
- API 响应格式: `{ success: boolean, data?: any, error?: string }`

### 调试技巧

```bash
# 前端调试
npm run dev:client

# 后端调试
npm run dev:server

# 查看日志
tail -f logs/app.log

# 测试 API
npm run test:api
```

---

## 📄 许可证

本项目采用 MIT 许可证。

---

## 🚀 代码更新与部署流程

### 更新代码到 GitHub

当你在本地修改了代码后，按照以下步骤提交到 GitHub：

```bash
# 1. 查看修改的文件
git status

# 2. 添加所有修改的文件到暂存区
git add -A

# 3. 提交修改（附带清晰的提交信息）
git commit -m "描述你的修改内容"

# 示例：
# git commit -m "feat: 添加新功能"
# git commit -m "fix: 修复某个bug"
# git commit -m "chore: 更新配置文件"

# 4. 推送到 GitHub
git push origin main

# 5. 验证推送成功
git log --oneline -5  # 查看最近5次提交
```

**提交信息规范：**
- `feat:` 新功能
- `fix:` 修复bug
- `chore:` 配置、依赖更新等
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构

### 更新代码到服务器

服务器部署在 `/opt/topfac`，使用 systemd 管理服务。

#### 方式一：手动更新单个文件（推荐用于小改动）

```bash
# 1. 备份当前版本
ssh root@8.216.32.61 "cd /opt/topfac && cp -r server server.backup.$(date +%Y%m%d_%H%M%S)"

# 2. 上传修改的文件
# 示例：上传后端文件
scp server/services/DrawIOService.js root@8.216.32.61:/opt/topfac/server/services/

# 示例：上传前端配置文件
scp client/nuxt.config.ts root@8.216.32.61:/opt/topfac/client/

# 3. 如果修改了前端代码，需要重新构建
ssh root@8.216.32.61 "cd /opt/topfac && npm run build"

# 4. 重启服务
ssh root@8.216.32.61 "systemctl restart topfac"

# 5. 验证服务状态
ssh root@8.216.32.61 "systemctl status topfac --no-pager"
```

#### 方式二：完整部署（推荐用于大改动）

```bash
# 1. SSH 登录服务器
ssh root@8.216.32.61

# 2. 进入项目目录
cd /opt/topfac

# 3. 备份当前版本
cp -r server server.backup.$(date +%Y%m%d_%H%M%S)
cp -r client client.backup.$(date +%Y%m%d_%H%M%S)

# 4. 如果是 Git 仓库，拉取最新代码
git pull origin main

# 如果不是 Git 仓库，需要手动上传所有文件
# 在本地执行：
# scp -r server root@8.216.32.61:/opt/topfac/
# scp -r client root@8.216.32.61:/opt/topfac/

# 5. 安装/更新依赖
npm install
cd client && npm install && cd ..

# 6. 重新构建前端
npm run build

# 7. 重启服务
systemctl restart topfac

# 8. 验证服务状态
systemctl status topfac

# 9. 查看服务日志
journalctl -u topfac -n 50 --no-pager
```

#### 方式三：使用部署脚本（最便捷）

创建本地部署脚本 `deploy-to-server.sh`：

```bash
#!/bin/bash
# 部署脚本

SERVER="root@8.216.32.61"
DEPLOY_DIR="/opt/topfac"

echo "=== 开始部署到服务器 ==="

# 1. 备份
echo "1. 备份当前版本..."
ssh $SERVER "cd $DEPLOY_DIR && cp -r server server.backup.\$(date +%Y%m%d_%H%M%S)"

# 2. 上传文件
echo "2. 上传文件..."
scp -r server $SERVER:$DEPLOY_DIR/
scp -r client $SERVER:$DEPLOY_DIR/

# 3. 构建
echo "3. 重新构建..."
ssh $SERVER "cd $DEPLOY_DIR && npm run build"

# 4. 重启服务
echo "4. 重启服务..."
ssh $SERVER "systemctl restart topfac"

# 5. 验证
echo "5. 验证服务状态..."
ssh $SERVER "systemctl status topfac --no-pager | head -20"

echo "=== 部署完成 ==="
```

使用方法：

```bash
# 赋予执行权限
chmod +x deploy-to-server.sh

# 执行部署
./deploy-to-server.sh
```

### 常见问题排查

#### 1. 服务启动失败

```bash
# 查看详细日志
journalctl -u topfac -n 100 --no-pager

# 检查端口占用
netstat -tlnp | grep 30010

# 手动启动测试
cd /opt/topfac
node server/index.js
```

#### 2. 前端构建失败

```bash
# 清理并重新安装依赖
cd /opt/topfac/client
rm -rf node_modules package-lock.json
npm install

# 重新构建
cd /opt/topfac
npm run build
```

#### 3. Nginx 配置问题

```bash
# 测试 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 重新加载配置
systemctl reload nginx
```

#### 4. SSL 证书问题

```bash
# 查看证书信息
certbot certificates

# 测试证书续期
certbot renew --dry-run

# 手动续期
certbot renew
```

### 服务管理命令

```bash
# 启动服务
systemctl start topfac

# 停止服务
systemctl stop topfac

# 重启服务
systemctl restart topfac

# 查看服务状态
systemctl status topfac

# 查看服务日志
journalctl -u topfac -f

# 查看最近50条日志
journalctl -u topfac -n 50 --no-pager

# 启用开机自启
systemctl enable topfac

# 禁用开机自启
systemctl disable topfac
```

### 监控与维护

```bash
# 查看服务运行状态
systemctl status topfac

# 查看端口监听
netstat -tlnp | grep 30010

# 查看进程信息
ps aux | grep node

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看数据文件大小
du -sh /opt/topfac/data/*

# 清理日志文件
cd /opt/topfac
npm run clean:logs
```

---



---

## 📋 部署架构确认

#### 1. **当前部署架构**

**架构类型：传统的宿主机直接部署（Native Deployment）**

```
┌─────────────────────────────────────────────────────────────┐
│                    阿里云ECS服务器                            │
│                  Ubuntu 22.04.5 LTS                          │
│                  IP: 8.216.32.61                             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Nginx      │   │  Node.js     │   │  Certbot     │
│  (宿主机)     │   │  (宿主机)     │   │  (宿主机)     │
│  端口: 80    │   │  端口: 30010  │   │  SSL证书     │
│  端口: 443   │   │              │   │  自动续期     │
└──────────────┘   └──────────────┘   └──────────────┘
     systemd            systemd            systemd
   nginx.service     topfac.service     certbot.timer
```

---

#### 2. **各组件部署方式详细说明**

##### **A. Nginx（反向代理 + SSL终止）**

- **部署方式**：直接安装在宿主机上
- **安装方式**：通过APT包管理器安装
- **安装路径**：`/usr/sbin/nginx`
- **配置文件**：`/etc/nginx/sites-available/topfac`
- **服务管理**：systemd (`nginx.service`)
- **运行用户**：
  - Master进程：root (PID 14686)
  - Worker进程：www-data (PID 23081, 23082)
- **监听端口**：
  - HTTP: 0.0.0.0:80
  - HTTPS: 0.0.0.0:443
- **功能**：
  - SSL/TLS终止（Let's Encrypt证书）
  - HTTP到HTTPS重定向
  - 反向代理到Node.js后端（30010端口）
  - 静态资源缓存
  - 安全头设置（HSTS、X-Frame-Options等）

**验证命令输出：**
```bash
root       14686  0.0  0.2  66584  2656 ?        Ss   01:06   0:00 nginx: master process
www-data   23081  0.0  0.8  67728  8096 ?        S    11:33   0:00 nginx: worker process
```

---

##### **B. Node.js后端服务（TopFac应用）**

- **部署方式**：直接在宿主机上运行
- **安装方式**：通过NodeSource仓库安装
- **版本**：Node.js v20.19.5
- **安装路径**：`/usr/bin/node`
- **应用目录**：`/opt/topfac`
- **启动命令**：`/usr/bin/node server/index.js`
- **服务管理**：systemd (`topfac.service`)
- **监听端口**：:::30010 (IPv6，同时支持IPv4)
- **环境变量**：
  - `NODE_ENV=production`
  - `PORT=30010`
  - `NODE_OPTIONS=--max-old-space-size=512`
- **自动重启**：是（Restart=always, RestartSec=10）
- **日志输出**：systemd journal

**验证命令输出：**
```bash
root       24847  0.1  6.3 11514904 57864 ?      Ssl  11:57   0:00 /usr/bin/node server/index.js
```

**systemd服务配置：**
```ini
[Unit]
Description=TopFac Local - 智能网络拓扑生成系统
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/topfac
Environment=NODE_ENV=production
Environment=PORT=30010
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-u
```

**运行中的相关服务：**
```
● docker.service    - Docker守护进程（已安装但未使用）
● nginx.service     - Nginx Web服务器
● topfac.service    - TopFac应用服务
● certbot.timer     - SSL证书自动续期定时器
```

---

### 📊 完整的请求流程

```
用户浏览器
    │
    │ HTTPS请求 (443端口)
    ▼
┌─────────────────────────────────────┐
│  Nginx (宿主机 - systemd管理)        │
│  - SSL终止 (Let's Encrypt证书)      │
│  - 域名: topfac.netc2c.com          │
│  - 域名: topfac.nssa.io             │
└─────────────────────────────────────┘
    │
    │ HTTP反向代理
    ▼
┌─────────────────────────────────────┐
│  Node.js (宿主机 - systemd管理)      │
│  - Hono.js框架                      │
│  - 端口: 30010                      │
│  - 工作目录: /opt/topfac            │
│  - 进程: /usr/bin/node server/index.js │
└─────────────────────────────────────┘
    │
    │ 文件系统访问
    ▼
┌─────────────────────────────────────┐
│  数据存储 (宿主机文件系统)            │
│  - JSON文件: /opt/topfac/data/*.json│
│  - 静态文件: /opt/topfac/dist/      │
│  - 日志文件: /opt/topfac/logs/      │
└─────────────────────────────────────┘
```

---

### 🔍 部署目录结构

```
/opt/topfac/                          # 应用根目录
├── server/                           # 后端代码
│   ├── index.js                     # 应用入口（被systemd启动）
│   ├── routes/                      # API路由
│   ├── services/                    # 业务服务
│   └── database/                    # 数据库层
├── client/                           # 前端源码
│   ├── pages/                       # Nuxt页面
│   ├── components/                  # Vue组件
│   └── nuxt.config.ts              # Nuxt配置
├── dist/                            # 前端构建产物（Nginx提供静态文件）
│   ├── index.html
│   └── _nuxt/                      # 打包后的JS/CSS
├── data/                            # JSON数据文件
│   ├── projects.json
│   └── project_versions.json
├── logs/                            # 应用日志
├── node_modules/                    # 依赖包
├── package.json                     # 项目配置
└── README.md                        # 项目文档
```

---

### 🔐 SSL证书管理

- **证书提供商**：Let's Encrypt
- **管理工具**：Certbot
- **证书路径**：`/etc/letsencrypt/live/topfac.netc2c.com/`
- **自动续期**：是（通过systemd timer: `certbot.timer`）
- **验证方式**：HTTP-01（通过80端口）
- **包含域名**：
  - topfac.netc2c.com
  - topfac.nssa.io
- **有效期**：90天（自动续期）

---

### 📦 软件版本信息

| 组件     | 版本               | 安装方式           |
| -------- | ------------------ | ------------------ |
| 操作系统 | Ubuntu 22.04.5 LTS | -                  |
| Nginx    | 1.18.0             | APT (系统包)       |
| Node.js  | v20.19.5           | NodeSource仓库     |
| Docker   | 28.4.0             | 官方仓库（未使用） |
| Certbot  | -                  | APT (系统包)       |

---

### ✅ 总结

**当前部署架构是：传统的宿主机直接部署（Native/Bare-metal Deployment）**

**特点：**
- ✅ 所有服务直接运行在宿主机上
- ✅ 使用systemd统一管理所有服务
- ✅ 没有使用任何容器化技术
- ✅ 简单、直接、易于维护
- ✅ 资源开销小（无容器层）

**优点：**
- 部署简单，无需学习容器技术
- 性能开销小，无容器虚拟化层
- 调试方便，直接查看进程和日志
- 资源利用率高

**缺点：**
- 环境隔离性较差
- 迁移和扩展相对复杂
- 依赖系统级软件包管理

这是一个**经典的LEMP/MEAN栈部署架构**（Linux + Nginx + Node.js），适合中小型应用的生产环境部署。



## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

- GitHub: [https://github.com/Matthewyin/topfac](https://github.com/Matthewyin/topfac)
- Issues: [https://github.com/Matthewyin/topfac/issues](https://github.com/Matthewyin/topfac/issues)

---

**TopFac** - 让网络拓扑生成更简单 🚀
