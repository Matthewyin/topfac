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
- 服务器IP：服务器
- 域名：topfac.netc2c.com, topfac.nssa.io

**架构类型：** 传统宿主机直接部署（Native Deployment）

```
┌─────────────────────────────────────────────────────────────┐
│                    阿里云ECS服务器                            │
│                 Ubuntu 22.04.5 LTS                          │
│                  IP: 服务器                           │
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

#### 使用自动化部署脚本

项目提供了自动化部署脚本 `deploy-to-new-server.sh`，可一键部署到新服务器

# 使用方法
./deploy-to-new-server.sh <服务器IP>


脚本会自动完成：
1. ✅ 安装OpenResty和Node.js
2. ✅ 上传代码并安装依赖
3. ✅ 配置systemd服务
4. ✅ 配置OpenResty反向代理
5. ✅ 创建临时SSL证书

**部署后需要手动操作：**
1. 更新DNS记录指向新服务器IP
2. 申请Let's Encrypt正式证书

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

【环境名】【数据中心名】的【区域名】【设备名】

**连接定义：**

【环境名】【数据中心名】的【区域名】【设备A】连接【环境名】【数据中心名】的【区域名】【设备B】

**示例：**

【生产网】【数据中心】的【核心区】【核心路由器1】
【生产网】【数据中心】的【接入区】【接入交换机1】
【生产网】【数据中心】的【核心区】【核心路由器1】连接【生产网】【数据中心】的【接入区】【接入交换机1】

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

## 🔍 目录结构

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
- 验证方式：webroot（HTTP-01）
- 包含域名：topfac.netc2c.com, topfac.nssa.io
- 有效期：90天
- 自动续期：✅ 已配置（certbot.timer）

**续期配置：**
- 检查时间：每天03:18
- 续期钩子：`/etc/letsencrypt/renewal-hooks/deploy/reload-openresty.sh`
- 续期后操作：自动重载OpenResty

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

- GitHub: [https://github.com/Matthewyin/topfac](https://github.com/Matthewyin/topfac)
- Issues: [https://github.com/Matthewyin/topfac/issues](https://github.com/Matthewyin/topfac/issues)

---

**TopFac** - 让网络拓扑生成更简单 🚀
