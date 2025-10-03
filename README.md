# TopFac - 智能网络拓扑生成系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Nuxt.js](https://img.shields.io/badge/Nuxt.js-3.19.2-00DC82)](https://nuxt.com/)
[![Hono](https://img.shields.io/badge/Hono-4.6.3-E36002)](https://hono.dev/)
[![OpenResty](https://img.shields.io/badge/OpenResty-1.27.1.2-00ADD8)](https://openresty.org/)

## 📖 项目简介

TopFac 是一个智能网络拓扑生成系统，支持通过自然语言描述或结构化文本快速生成网络拓扑图。系统采用前后端分离架构，提供直观的可视化界面和强大的 AI 辅助功能。

**在线访问：**
- 🌐 https://topfac.netc2c.com
- 🌐 https://topfac.nssa.io

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
- Node.js 20.19.5 (运行时环境)
- JSON 文件数据库 (数据持久化)

**Web服务器：**
- OpenResty 1.27.1.2 (高性能Web平台，基于Nginx 1.27.1)
- LuaJIT 2.1 (Lua脚本支持)
- OpenSSL 3.5.0 (SSL/TLS加密)

**部署环境：**
- Ubuntu 22.04.5 LTS
- systemd (服务管理)
- Let's Encrypt (SSL证书)

---

## 🏗️ 系统架构

### 生产环境部署架构

**服务器信息：**
- 云服务商：阿里云ECS
- 操作系统：Ubuntu 22.04.5 LTS
- 服务器IP：8.211.149.80
- 域名：topfac.netc2c.com, topfac.nssa.io

**架构类型：** 传统宿主机直接部署（Native Deployment）

```
┌─────────────────────────────────────────────────────────────┐
│                    阿里云ECS服务器                            │
│                 Ubuntu 22.04.5 LTS                          │
│                  IP: 8.211.149.80                           │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  OpenResty   │   │  Node.js     │   │  Certbot     │
│  (宿主机)     │   │  (宿主机)     │   │  (宿主机)     │
│  端口: 80    │   │  端口: 30010  │   │  SSL证书     │
│  端口: 443   │   │  Hono.js     │   │  自动续期     │
│  + LuaJIT    │   │  v20.19.5    │   │  Let's       │
│  1.27.1.2    │   │              │   │  Encrypt     │
└──────────────┘   └──────────────┘   └──────────────┘
     systemd            systemd            systemd
 openresty.service  topfac.service     certbot.timer
```

### 请求流程

```
用户浏览器
    │
    │ HTTPS请求 (443端口)
    ▼
┌─────────────────────────────────────┐
│  OpenResty (宿主机 - systemd管理)    │
│  - SSL终止 (Let's Encrypt证书)      │
│  - HTTP/2支持                       │
│  - 域名: topfac.netc2c.com          │
│  - 域名: topfac.nssa.io             │
│  - Lua脚本能力（可扩展）             │
└─────────────────────────────────────┘
    │
    │ HTTP反向代理 (127.0.0.1:30010)
    ▼
┌─────────────────────────────────────┐
│  Node.js (宿主机 - systemd管理)      │
│  - Hono.js框架                      │
│  - 端口: 30010                      │
│  - 工作目录: /opt/topfac            │
└─────────────────────────────────────┘
    │
    │ 文件系统访问
    ▼
┌─────────────────────────────────────┐
│  数据存储 (宿主机文件系统)            │
│  - JSON文件: /opt/topfac/data/      │
│  - 静态文件: /opt/topfac/dist/      │
│  - 日志文件: /opt/topfac/logs/      │
└─────────────────────────────────────┘
```



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

- Node.js >= 20.0.0
- npm >= 8.0.0
- 操作系统: Linux (推荐Ubuntu 22.04 LTS)
- 内存: >= 512MB
- 磁盘: >= 2GB

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/Matthewyin/topfac.git
cd topfac

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量（可选）
cd client
cp .env.example .env
# 编辑.env文件，填入Google Analytics ID等配置
nano .env

# 4. 启动开发服务器
cd ..
npm run dev

# 5. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:30010
```

**环境变量配置（可选）：**

TopFac使用环境变量管理敏感配置（如Google Analytics ID）。详见[环境变量配置指南](docs/ENVIRONMENT_VARIABLES.md)。

主要环境变量：
- `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID` - Google Analytics 4 衡量ID
- `TOPOLOGY_API_URL` - API基础URL（开发环境：`http://localhost:30010`）
- `NODE_ENV` - 运行环境（`development` | `production`）

### 生产部署（完整流程）

#### 方式一：使用自动化部署脚本（推荐）

项目提供了自动化部署脚本 `deploy-to-new-server.sh`，可一键部署到新服务器：

```bash
# 使用方法
./deploy-to-new-server.sh <服务器IP>

# 示例
./deploy-to-new-server.sh 8.211.149.80
```

脚本会自动完成：
1. ✅ 安装OpenResty和Node.js
2. ✅ 上传代码并安装依赖
3. ✅ 配置systemd服务
4. ✅ 配置OpenResty反向代理
5. ✅ 创建临时SSL证书

**部署后需要手动操作：**
1. 更新DNS记录指向新服务器IP
2. 申请Let's Encrypt正式证书

#### 方式二：手动部署（详细步骤）

##### 1. 安装OpenResty

```bash
# 添加OpenResty仓库
wget -O - https://openresty.org/package/pubkey.gpg | gpg --dearmor -o /usr/share/keyrings/openresty.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/openresty.gpg] http://openresty.org/package/ubuntu $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/openresty.list

# 安装OpenResty
apt-get update
apt-get install -y openresty openresty-opm openresty-resty
```

##### 2. 安装Node.js 20.x

```bash
# 添加NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# 安装Node.js
apt-get install -y nodejs
```

##### 3. 部署应用代码

```bash
# 创建部署目录
mkdir -p /opt/topfac

# 上传代码（从本地）
rsync -avz --exclude='node_modules' --exclude='dist' ./ root@<服务器IP>:/opt/topfac/

# 或使用Git克隆
cd /opt/topfac
git clone https://github.com/Matthewyin/topfac.git .

# 安装依赖
npm install
cd client && npm install && cd ..

# 构建前端
npm run build
```

##### 4. 配置OpenResty

创建 `/usr/local/openresty/nginx/conf/sites-available/topfac`：

```nginx
# HTTP配置
server {
    listen 80;
    server_name topfac.netc2c.com topfac.nssa.io;

    # Let's Encrypt验证路径（优先级最高）
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # 其他请求重定向到HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS配置
server {
    listen 443 ssl;
    http2 on;
    server_name topfac.netc2c.com topfac.nssa.io;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/topfac.netc2c.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/topfac.netc2c.com/privkey.pem;

    # SSL安全配置
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

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:30010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:30010;
        access_log off;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:30010;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        proxy_pass http://127.0.0.1:30010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**启用配置：**

```bash
# 创建软链接
ln -sf /usr/local/openresty/nginx/conf/sites-available/topfac /usr/local/openresty/nginx/conf/sites-enabled/

# 测试配置
/usr/local/openresty/nginx/sbin/nginx -t

# 启动OpenResty
systemctl start openresty
```

##### 5. 配置SSL证书（Let's Encrypt）

```bash
# 安装Certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书（支持多域名）
certbot --nginx -d topfac.netc2c.com -d topfac.nssa.io --non-interactive --agree-tos --email your@email.com

# 配置自动续期钩子
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-openresty.sh << 'EOF'
#!/bin/bash
systemctl reload openresty
logger "Certbot renewed certificate, OpenResty reloaded"
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-openresty.sh

# 测试自动续期
certbot renew --dry-run
```

##### 6. 配置systemd服务

创建 `/etc/systemd/system/topfac.service`：

```ini
[Unit]
Description=TopFac - 智能网络拓扑生成系统
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
WantedBy=multi-user.target
```

创建 `/etc/systemd/system/openresty.service`：

```ini
[Unit]
Description=OpenResty - High Performance Web Server
Documentation=https://openresty.org/
After=network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/var/run/openresty.pid
ExecStartPre=/usr/local/openresty/nginx/sbin/nginx -t -c /usr/local/openresty/nginx/conf/nginx.conf
ExecStart=/usr/local/openresty/nginx/sbin/nginx -c /usr/local/openresty/nginx/conf/nginx.conf
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s QUIT $MAINPID
PrivateTmp=true
Restart=on-failure
RestartSec=5s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重新加载systemd
systemctl daemon-reload

# 启用并启动服务
systemctl enable topfac openresty
systemctl start topfac openresty

# 验证服务状态
systemctl status topfac openresty
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

### 更新代码到GitHub

当你在本地修改了代码后，按照以下步骤提交到GitHub：

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

# 4. 推送到GitHub
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

**当前生产服务器：** 8.211.149.80
**部署目录：** `/opt/topfac`
**Web服务器：** OpenResty 1.27.1.2
**应用服务：** Node.js 20.19.5

#### 方式一：快速更新单个文件（小改动）

```bash
# 1. 备份当前版本
ssh root@8.211.149.80 "cd /opt/topfac && cp -r server server.backup.$(date +%Y%m%d_%H%M%S)"

# 2. 上传修改的文件
# 示例：上传后端文件
scp server/services/DrawIOService.js root@8.211.149.80:/opt/topfac/server/services/

# 示例：上传前端配置文件
scp client/nuxt.config.ts root@8.211.149.80:/opt/topfac/client/

# 3. 如果修改了前端代码，需要重新构建
ssh root@8.211.149.80 "cd /opt/topfac && npm run build"

# 4. 重启应用服务
ssh root@8.211.149.80 "systemctl restart topfac"

# 5. 验证服务状态
ssh root@8.211.149.80 "systemctl status topfac --no-pager"
```

#### 方式二：完整部署（大改动）

```bash
# 1. SSH登录服务器
ssh root@8.211.149.80

# 2. 进入项目目录
cd /opt/topfac

# 3. 备份当前版本
cp -r server server.backup.$(date +%Y%m%d_%H%M%S)
cp -r client client.backup.$(date +%Y%m%d_%H%M%S)

# 4. 拉取最新代码（如果是Git仓库）
git pull origin main

# 或手动上传所有文件（在本地执行）：
# rsync -avz --exclude='node_modules' --exclude='dist' ./ root@8.211.149.80:/opt/topfac/

# 5. 安装/更新依赖
npm install
cd client && npm install && cd ..

# 6. 重新构建前端
npm run build

# 7. 重启服务
systemctl restart topfac

# 8. 验证服务状态
systemctl status topfac openresty

# 9. 查看服务日志
journalctl -u topfac -n 50 --no-pager

# 10. 测试访问
curl -s https://topfac.netc2c.com/health | jq .
```

### 服务管理命令

#### OpenResty服务

```bash
# 启动OpenResty
systemctl start openresty

# 停止OpenResty
systemctl stop openresty

# 重启OpenResty
systemctl restart openresty

# 重载配置（无停机）
systemctl reload openresty

# 查看服务状态
systemctl status openresty

# 测试配置文件
/usr/local/openresty/nginx/sbin/nginx -t

# 查看错误日志
tail -f /var/log/openresty/error.log

# 查看访问日志
tail -f /var/log/openresty/access.log
```

#### TopFac应用服务

```bash
# 启动服务
systemctl start topfac

# 停止服务
systemctl stop topfac

# 重启服务
systemctl restart topfac

# 查看服务状态
systemctl status topfac

# 查看实时日志
journalctl -u topfac -f

# 查看最近50条日志
journalctl -u topfac -n 50 --no-pager

# 启用开机自启
systemctl enable topfac

# 禁用开机自启
systemctl disable topfac
```

### 常见问题排查

#### 1. 应用服务启动失败

```bash
# 查看详细日志
journalctl -u topfac -n 100 --no-pager

# 检查端口占用
netstat -tlnp | grep 30010

# 手动启动测试
cd /opt/topfac
node server/index.js

# 检查Node.js版本
node -v  # 应该是v20.19.5或更高
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

# 检查构建产物
ls -lh dist/
```

#### 3. OpenResty配置问题

```bash
# 测试配置文件
/usr/local/openresty/nginx/sbin/nginx -t

# 查看错误日志
tail -f /var/log/openresty/error.log

# 重新加载配置
systemctl reload openresty

# 检查端口监听
netstat -tlnp | grep -E ':(80|443)'
```

#### 4. SSL证书问题

```bash
# 查看证书信息
certbot certificates

# 测试证书续期
certbot renew --dry-run

# 手动续期
certbot renew

# 查看续期定时器
systemctl list-timers | grep certbot

# 查看证书有效期
echo | openssl s_client -servername topfac.netc2c.com -connect topfac.netc2c.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### 5. HTTPS访问失败

```bash
# 测试HTTPS访问
curl -I https://topfac.netc2c.com

# 测试健康检查
curl -s https://topfac.netc2c.com/health | jq .

# 检查DNS解析
nslookup topfac.netc2c.com

# 检查防火墙
ufw status
iptables -L -n | grep -E '(80|443)'
```

### 监控与维护

#### 系统监控

```bash
# 查看所有服务状态
systemctl status openresty topfac certbot.timer

# 查看端口监听
netstat -tlnp | grep -E ':(80|443|30010)'

# 查看进程信息
ps aux | grep -E '(openresty|node)'

# 查看系统资源
top -bn1 | head -20

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看数据文件大小
du -sh /opt/topfac/data/*
```

#### 日志管理

```bash
# 查看OpenResty访问日志
tail -f /var/log/openresty/access.log

# 查看OpenResty错误日志
tail -f /var/log/openresty/error.log

# 查看应用日志
journalctl -u topfac -f

# 清理旧日志（保留最近7天）
journalctl --vacuum-time=7d
```

#### 性能监控

```bash
# 查看HTTP请求统计
tail -1000 /var/log/openresty/access.log | awk '{print $9}' | sort | uniq -c | sort -rn

# 查看响应时间
tail -1000 /var/log/openresty/access.log | awk '{print $NF}' | sort -n | tail -20

# 查看访问IP统计
tail -1000 /var/log/openresty/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10
```

### 备份与恢复

#### 备份数据

```bash
# 备份数据文件
tar -czf /root/topfac-data-backup-$(date +%Y%m%d).tar.gz /opt/topfac/data/

# 备份配置文件
tar -czf /root/topfac-config-backup-$(date +%Y%m%d).tar.gz \
  /usr/local/openresty/nginx/conf/sites-available/topfac \
  /etc/systemd/system/topfac.service \
  /etc/systemd/system/openresty.service

# 备份SSL证书
tar -czf /root/letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
```

#### 恢复数据

```bash
# 恢复数据文件
tar -xzf /root/topfac-data-backup-20251003.tar.gz -C /

# 恢复配置文件
tar -xzf /root/topfac-config-backup-20251003.tar.gz -C /

# 重启服务
systemctl restart topfac openresty
```

---

## � OpenResty迁移说明

### 为什么迁移到OpenResty？

**迁移时间：** 2025年10月3日
**迁移状态：** ✅ 已完成

**迁移原因：**

1. **安全性提升**
   - Nginx 1.18.0发布于2020年，存在多个已知CVE漏洞
   - OpenResty 1.27.1.2基于Nginx 1.27.1（2025年最新稳定版）
   - 包含所有安全补丁和性能优化

2. **功能扩展**
   - 内置LuaJIT 2.1，支持Lua脚本
   - 可实现API限流、动态路由、WAF防护等高级功能
   - 支持HTTP/3（QUIC协议）

3. **性能优化**
   - 更新的Nginx核心
   - OpenSSL 3.5.0（最新版本）
   - PCRE2 10.45（性能提升）

### 迁移成果

**版本对比：**

| 组件 | 迁移前 | 迁移后 | 提升 |
|------|--------|--------|------|
| Web服务器 | Nginx 1.18.0 | OpenResty 1.27.1.2 | 基于Nginx 1.27.1 |
| 发布时间 | 2020年4月 | 2025年5月 | 5年版本跨越 |
| OpenSSL | 3.0.2 | 3.5.0 | 安全性提升 |
| Lua支持 | ❌ 无 | ✅ LuaJIT 2.1 | 新增功能 |
| HTTP/3 | ❌ 不支持 | ✅ 支持 | 新增功能 |

**迁移效果：**
- ✅ 停机时间：仅2秒
- ✅ 功能完整性：100%
- ✅ 性能影响：0%
- ✅ SSL证书：自动续期正常
- ✅ 所有服务：运行正常

**详细迁移报告：** 查看 [OPENRESTY_MIGRATION_REPORT.md](./OPENRESTY_MIGRATION_REPORT.md)

### 当前软件版本

| 组件 | 版本 | 说明 |
|------|------|------|
| 操作系统 | Ubuntu 22.04.5 LTS | 长期支持版 |
| OpenResty | 1.27.1.2 | 高性能Web平台 |
| Nginx核心 | 1.27.1 | 最新稳定版 |
| LuaJIT | 2.1.ROLLING | Lua脚本引擎 |
| OpenSSL | 3.5.0 | SSL/TLS加密 |
| PCRE2 | 10.45 | 正则表达式库 |
| Node.js | 20.19.5 | JavaScript运行时 |
| Certbot | 1.21.0 | SSL证书管理 |

### 未来扩展方向

基于OpenResty的Lua脚本能力，可以实现：

1. **API限流限速**
   - 基于IP的请求频率限制
   - 基于用户的API配额管理
   - 动态调整限流策略

2. **动态路由**
   - 灰度发布
   - A/B测试
   - 流量分发

3. **WAF防护**
   - SQL注入防护
   - XSS攻击防护
   - 恶意请求拦截

4. **性能优化**
   - 智能缓存
   - 请求合并
   - 响应压缩

---

## 🔍 部署目录结构

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
├── dist/                            # 前端构建产物
│   ├── index.html
│   └── _nuxt/                      # 打包后的JS/CSS
├── data/                            # JSON数据文件
│   ├── projects.json
│   └── project_versions.json
├── logs/                            # 应用日志
├── node_modules/                    # 依赖包
├── package.json                     # 项目配置
├── README.md                        # 项目文档
├── deploy-to-new-server.sh         # 自动化部署脚本
└── OPENRESTY_MIGRATION_REPORT.md   # OpenResty迁移报告
```

**OpenResty配置目录：**

```
/usr/local/openresty/nginx/conf/
├── nginx.conf                       # 主配置文件
├── mime.types                       # MIME类型
├── sites-available/
│   └── topfac                       # 站点配置
└── sites-enabled/
    └── topfac -> ../sites-available/topfac
```

---

## 🔐 SSL证书管理

**证书信息：**
- 提供商：Let's Encrypt
- 管理工具：Certbot 1.21.0
- 证书路径：`/etc/letsencrypt/live/topfac.netc2c.com/`
- 验证方式：webroot（HTTP-01）
- 包含域名：topfac.netc2c.com, topfac.nssa.io
- 有效期：90天
- 自动续期：✅ 已配置（certbot.timer）

**续期配置：**
- 检查时间：每天03:18
- 续期钩子：`/etc/letsencrypt/renewal-hooks/deploy/reload-openresty.sh`
- 续期后操作：自动重载OpenResty

**手动操作：**

```bash
# 查看证书信息
certbot certificates

# 测试自动续期
certbot renew --dry-run

# 手动续期
certbot renew

# 查看证书有效期
openssl x509 -in /etc/letsencrypt/live/topfac.netc2c.com/cert.pem -noout -dates
```



## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

- GitHub: [https://github.com/Matthewyin/topfac](https://github.com/Matthewyin/topfac)
- Issues: [https://github.com/Matthewyin/topfac/issues](https://github.com/Matthewyin/topfac/issues)

---

**TopFac** - 让网络拓扑生成更简单 🚀
