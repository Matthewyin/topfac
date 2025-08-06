# 🌐 智能网络拓扑生成系统 (TopFac)

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)
![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00C58E.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)
![Vuetify](https://img.shields.io/badge/Vuetify-3.x-1867C0.svg)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-JavaScript-orange.svg)
![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-SQLite-orange.svg)

**🚀 基于自然语言的智能网络拓扑图生成工具**

[🌐 在线体验](https://topfac.nssa.io) | [🔌 API文档](#-api接口) | [🎯 功能演示](#-核心功能) | [🔧 操作流程](#-操作流程)

</div>

## 📋 目录

- [✨ 项目特色](#-项目特色)
- [🚀 快速开始](#-快速开始)
- [🎯 核心功能](#-核心功能)
- [🏗️ 系统架构](#️-系统架构)
- [💻 技术栈](#-技术栈)
- [📁 项目结构](#-项目结构)
- [🔌 API接口](#-api接口)
- [🔧 操作流程](#-操作流程)
- [🔍 监控维护](#-监控维护)
- [📄 许可证](#-许可证)

## ✨ 项目特色

### 🎯 核心功能

- **🧠 AI智能转换**：支持多种AI模型（Gemini、DeepSeek等），将自然语言描述智能转换为标准化拓扑结构
- **🎨 自动拓扑生成**：自动生成标准DrawIO格式的网络拓扑图，支持直接导入编辑
- **📊 4级层次结构**：环境→数据中心→网络区域→设备的完整层次结构管理
- **📚 版本控制**：完整的项目版本管理，支持历史记录、版本比较和回滚
- **📱 响应式界面**：基于Material Design的现代化界面，完美适配各种设备
- **⚡ 实时状态更新**：AI配置状态实时同步，无需刷新页面

### 🔧 技术亮点

- **🌐 全栈JavaScript**：前后端统一使用JavaScript/TypeScript，降低维护成本
- **☁️ 无服务器架构**：基于Cloudflare Workers的边缘计算，全球低延迟访问
- **🗄️ 分布式数据库**：Cloudflare D1全球分布式SQLite，数据就近访问
- **🔄 实时同步**：前后端状态实时同步，提供流畅的用户体验
- **🛡️ 安全可靠**：自动HTTPS、DDoS防护、边缘安全防护


## 🔧 操作流程

### 📝 基本使用流程

1. **访问系统**: 打开 https://topfac.nssa.io
2. **创建项目**: 点击首页卡片或导航菜单进入项目管理
3. **配置AI**: 首次使用需配置AI服务API Key
4. **输入描述**: 在编辑器中输入网络拓扑的自然语言描述
5. **AI转换**: 点击"AI转换"将描述转换为标准格式
6. **生成拓扑**: 系统自动解析并生成DrawIO格式的拓扑图
7. **下载文件**: 下载XML文件，可直接在DrawIO中打开编辑

### 🧠 AI转换示例

**输入文本**:
```text
生产网的未知数据中心的内联接入区有两台路由器和两台接入交换机，
路由器1连接接入交换机1和接入交换机2，
路由器2也连接接入交换机1和接入交换机2。
```

**系统解析结果**:
- 环境: 1个 (生产网)
- 数据中心: 1个 (未知数据中心)
- 网络区域: 1个 (内联接入区)
- 设备: 4个 (路由器1、路由器2、接入交换机1、接入交换机2)
- 连接: 4条


## 🚀 快速开始

### ⚡ 一键部署到 Cloudflare

```bash
# 1. 克隆项目
git clone https://github.com/Matthewyin/topfac.git
cd topfac

# 2. 安装 Wrangler CLI
npm install -g wrangler
wrangler login

# 3. 构建前端
cd frontpage/nuxt-app
npm install
npm run generate

# 4. 复制前端文件到Workers
cp -r .output/public/* ../../cloudflare-workers/public/

# 5. 部署到Cloudflare
cd ../../cloudflare-workers
wrangler deploy
```

### 🌐 访问地址

- **生产环境**: https://topfac.nssa.io

### 📋 部署架构

```
topfac.nssa.io
├── / (前端 Nuxt.js 静态文件)
├── /api/* (后端 API)
└── Cloudflare D1 数据库
```

### ✨ 部署优势

- ✅ **全球 CDN**: 200+ 边缘节点，访问速度快
- ✅ **无服务器**: 自动扩展，按需付费
- ✅ **高可用**: 99.9% 可用性保证
- ✅ **安全**: 自动 HTTPS，DDoS 防护
- ✅ **成本低**: 免费额度足够小中型项目使用

### 🏠 本地开发

```bash
# 1. 启动前端开发服务器
cd frontpage/nuxt-app
npm install
npm run dev  # http://localhost:3000

# 2. 启动后端开发服务器
cd cloudflare-workers
npm install
wrangler dev  # http://localhost:8787
```

## 🏗️ 系统架构

### 📋 架构概览

```text
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   用户浏览器        │    │  Cloudflare Edge    │    │   Cloudflare D1     │
│   (Vue.js SPA)     │───▶│   Workers + Pages   │───▶│   (SQLite 数据库)   │
│   topfac.nssa.io   │    │   全球边缘计算      │    │   全球分布式        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## 💻 技术栈

### 🎨 前端技术栈

- **框架**: Nuxt.js 3 + Vue 3 + TypeScript
- **UI库**: Vuetify 3 (Material Design)
- **状态管理**: Pinia + Composables
- **HTTP客户端**: $fetch (Nuxt内置)
- **构建工具**: Vite + Nitro
- **代码规范**: ESLint + Prettier

### ⚙️ 后端技术栈

- **运行时**: Cloudflare Workers (V8 JavaScript)
- **框架**: Hono.js (轻量级Web框架)
- **数据库**: Cloudflare D1 (全球分布式SQLite)
- **AI集成**: 多AI服务商API集成
- **文件处理**: 原生JavaScript文本解析

### 🗄️ 数据库设计

- **projects**: 项目基础信息
- **project_versions**: 项目版本管理
- **parsed_data**: 解析后的结构化数据
- **全局索引**: 优化查询性能

## 📁 项目结构

```text
topfac/
├── README.md                           # 📖 项目文档 (本文件)
├── cloudflare-workers/                 # ⚙️ 后端服务
│   ├── src/
│   │   └── index.js                   # 🎯 核心API服务 (所有后端逻辑)
│   ├── public/                        # 📁 前端静态文件 (构建后)
│   ├── package.json                   # 📦 后端依赖
│   ├── wrangler.toml                  # ⚙️ Cloudflare配置
│   └── schema.sql                     # 🗄️ 数据库结构
└── frontpage/nuxt-app/                # 🎨 前端应用
    ├── pages/                         # 📄 页面组件
    │   ├── index.vue                  # 🏠 首页
    │   ├── topology-projects/         # 📊 项目管理
    │   └── topology-editor/           # ✏️ 拓扑编辑器
    ├── components/                    # 🧩 可复用组件
    │   ├── AIConversionPanel.vue      # 🧠 AI转换面板
    │   ├── AIConfigPanel.vue          # ⚙️ AI配置面板
    │   └── ParsedDataViewer.vue       # 📊 数据解析查看器
    ├── layouts/                       # 🎨 布局组件
    ├── assets/                        # 🎨 静态资源
    ├── package.json                   # 📦 前端依赖
    └── nuxt.config.ts                 # ⚙️ Nuxt配置
```

### 🎯 核心文件说明

- **`cloudflare-workers/src/index.js`**: 包含所有后端API逻辑的单一文件
- **`frontpage/nuxt-app/`**: 完整的前端Vue.js应用
- **`wrangler.toml`**: Cloudflare Workers部署配置
- **`schema.sql`**: 数据库表结构定义

## 🔌 API接口

### 🌐 服务端点

| 环境 | 域名 | 状态 |
|------|------|------|
| 生产环境 | https://topfac.nssa.io | ✅ 运行中 |

### 📋 完整API清单

#### 🏠 系统状态
```http
GET /api/status                             # 系统状态检查
```

#### 📊 项目管理
```http
GET    /api/projects                        # 获取项目列表
POST   /api/projects                        # 创建新项目
GET    /api/projects/{id}                   # 获取项目详情
DELETE /api/projects/{id}                   # 软删除项目
DELETE /api/projects/{id}/hard              # 硬删除项目
PATCH  /api/projects/{id}/restore           # 恢复已删除项目
POST   /api/projects/batch-delete           # 批量删除项目
```

#### 📝 版本管理
```http
GET    /api/projects/{project_id}/versions  # 获取项目版本列表
POST   /api/projects/{project_id}/versions  # 创建新版本
GET    /api/versions/{version_id}           # 获取版本详情
DELETE /api/versions/{version_id}           # 删除版本
```

#### 🧠 AI智能转换
```http
POST   /api/ai/convert-text                 # AI智能文本转换
POST   /api/ai/test-connection              # 测试AI服务连接
GET    /api/ai/providers                    # 获取AI服务提供商列表
GET    /api/ai/providers/{provider}/models  # 获取指定提供商的模型列表
```

#### 🔄 文本解析与处理
```http
POST   /api/parse                           # 文本解析（简化版）
POST   /api/projects/{id}/process           # 完整项目工作流处理
POST   /api/projects/{id}/process-workflow  # 处理完整工作流（简化版）
```

#### 🎨 拓扑生成
```http
POST   /api/generate                        # 生成拓扑XML
```

#### 📥 文件下载
```http
GET    /api/projects/{project_id}/versions/{version_id}/download  # 通过版本ID下载
GET    /api/projects/{id}/download                                # 下载项目最新版本
GET    /api/download/{version_id}                                 # 按版本ID下载拓扑文件
```


## 🔍 监控维护

### 📊 系统监控

- **健康检查**: `/api/status` 端点提供系统状态
- **性能监控**: Cloudflare Analytics 提供详细的性能数据
- **错误追踪**: Cloudflare Workers 内置错误日志

### 🛠️ 维护操作

```bash
# 查看部署状态
wrangler deployments list

# 查看实时日志
wrangler tail

# 数据库操作
wrangler d1 execute topfac-db --command="SELECT COUNT(*) FROM projects"

# 回滚部署
wrangler rollback [deployment-id]
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- **项目维护者**: Matthewyin
- **邮箱**: tccio2023@gmail.com
- **GitHub**: [Matthewyin/topfac](https://github.com/Matthewyin/topfac)

---

<div align="center">

**🎯 让网络拓扑设计变得简单高效！**

[![Star this repo](https://img.shields.io/github/stars/Matthewyin/topfac?style=social)](https://github.com/Matthewyin/topfac)

</div>
