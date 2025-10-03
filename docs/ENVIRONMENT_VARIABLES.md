# TopFac 环境变量配置指南

## 📋 概述

TopFac使用环境变量来管理敏感配置信息（如Google Analytics ID），避免将这些信息提交到Git仓库。

---

## 🔐 为什么使用环境变量？

### 安全性
- ✅ 避免将API密钥、衡量ID等敏感信息提交到公开仓库
- ✅ 不同环境可以使用不同的配置
- ✅ 便于团队协作，每个开发者可以有自己的配置

### 灵活性
- ✅ 开发环境和生产环境使用不同的配置
- ✅ 可以在不修改代码的情况下更改配置
- ✅ 支持CI/CD流程

---

## 📁 环境变量文件

### 文件说明

| 文件 | 用途 | 是否提交到Git |
|------|------|--------------|
| `.env.example` | 环境变量示例文件 | ✅ 提交 |
| `.env.production` | 生产环境默认配置 | ✅ 提交（不含敏感信息） |
| `.env` | 本地开发环境配置 | ❌ 不提交 |
| `.env.local` | 本地覆盖配置 | ❌ 不提交 |
| `.env.development` | 开发环境配置 | ❌ 不提交 |

### 文件优先级

Nuxt.js按以下顺序加载环境变量（后面的会覆盖前面的）：

1. `.env`
2. `.env.production` 或 `.env.development`（根据NODE_ENV）
3. `.env.local`
4. 系统环境变量

---

## 🔧 配置步骤

### 1. 开发环境配置

**步骤1：复制示例文件**

```bash
cd client
cp .env.example .env
```

**步骤2：编辑.env文件**

```bash
nano .env
```

**步骤3：填入配置**

```env
# Google Analytics 4 衡量ID
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# API基础URL（开发环境）
TOPOLOGY_API_URL=http://localhost:30010

# Node环境
NODE_ENV=development
```

**步骤4：保存并重启开发服务器**

```bash
npm run dev
```

### 2. 生产环境配置

#### 方法1：使用.env.production文件（推荐）

生产环境已经包含了`.env.production`文件，其中包含默认配置：

```env
# client/.env.production
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
TOPOLOGY_API_URL=
NODE_ENV=production
```

这个文件会被提交到Git，因为它只包含生产环境的默认配置。

#### 方法2：使用系统环境变量（更安全）

在服务器上设置环境变量：

```bash
# 编辑systemd服务文件
sudo nano /etc/systemd/system/topfac.service
```

添加环境变量：

```ini
[Service]
Environment=NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
Environment=TOPOLOGY_API_URL=
```

重启服务：

```bash
sudo systemctl daemon-reload
sudo systemctl restart topfac
```

#### 方法3：使用EnvironmentFile（最佳实践）

创建独立的环境变量文件：

```bash
# 创建环境变量文件
sudo nano /opt/topfac/client/.env.production.local
```

内容：

```env
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
```

修改systemd服务文件：

```bash
sudo nano /etc/systemd/system/topfac.service
```

添加：

```ini
[Service]
EnvironmentFile=/opt/topfac/client/.env.production
EnvironmentFile=-/opt/topfac/client/.env.production.local
```

注意：`-`前缀表示文件不存在时不报错。

---

## 📊 可用的环境变量

### 前端环境变量（client/）

#### NUXT_PUBLIC_GOOGLE_ANALYTICS_ID

- **说明：** Google Analytics 4 衡量ID
- **格式：** `G-XXXXXXXXXX`
- **必需：** 否（如果不配置，GA4功能将被禁用）
- **示例：** `G-NV6BCFPN7W`
- **获取方式：**
  1. 登录 https://analytics.google.com
  2. 选择媒体资源
  3. 管理 > 数据流 > 选择网站数据流
  4. 复制"衡量ID"

#### TOPOLOGY_API_URL

- **说明：** TopFac API基础URL
- **必需：** 否（默认使用相对路径）
- **开发环境：** `http://localhost:30010`
- **生产环境：** 留空（使用相对路径）

#### NODE_ENV

- **说明：** Node.js运行环境
- **可选值：** `development` | `production`
- **默认值：** `development`

### 后端环境变量（server/）

#### PORT

- **说明：** 服务器监听端口
- **默认值：** `30010`
- **示例：** `PORT=30010`

#### LOG_LEVEL

- **说明：** 日志级别
- **可选值：** `ERROR` | `WARN` | `INFO` | `DEBUG`
- **默认值：** `INFO`

#### ENABLE_FILE_LOG

- **说明：** 是否启用文件日志
- **可选值：** `true` | `false`
- **默认值：** `true`

---

## 🔍 验证配置

### 1. 检查环境变量是否加载

**开发环境：**

在浏览器控制台执行：

```javascript
// 查看运行时配置
const config = useRuntimeConfig()
console.log('GA4 ID:', config.public.googleAnalyticsId)
console.log('API URL:', config.public.topologyApiUrl)
```

**生产环境：**

查看构建日志：

```bash
cd client
npm run build
```

查看输出中是否包含环境变量。

### 2. 检查GA4是否正常工作

1. 访问网站
2. 打开浏览器开发者工具（F12）
3. 切换到"控制台"标签
4. 查找：`[GA4] Initialized with ID: G-XXXXXXXXXX`
5. 切换到"网络"标签
6. 刷新页面
7. 查找请求：`gtag/js?id=G-XXXXXXXXXX`

---

## 🚨 常见问题

### Q1: 为什么我的GA4 ID没有生效？

**A:** 检查以下几点：

1. 环境变量名称是否正确：`NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`
2. 是否重启了开发服务器或重新构建了生产版本
3. 浏览器控制台是否有错误信息
4. 检查`.env`文件是否在正确的位置（`client/.env`）

### Q2: 生产环境如何更新GA4 ID？

**A:** 有三种方法：

1. **修改.env.production文件**（不推荐，因为会提交到Git）
2. **创建.env.production.local文件**（推荐）
3. **使用systemd环境变量**（最安全）

### Q3: 如何在不同域名使用不同的GA4 ID？

**A:** 使用系统环境变量：

```bash
# 域名1的服务器
Environment=NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-AAAAAAAAAA

# 域名2的服务器
Environment=NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-BBBBBBBBBB
```

### Q4: 环境变量在哪里定义？

**A:** 优先级从高到低：

1. 系统环境变量（最高优先级）
2. `.env.local`
3. `.env.production` 或 `.env.development`
4. `.env`
5. `nuxt.config.ts`中的默认值（最低优先级）

---

## 📝 最佳实践

### 1. 开发环境

- ✅ 使用`.env`文件存储本地配置
- ✅ 不要提交`.env`文件到Git
- ✅ 使用`.env.example`作为模板

### 2. 生产环境

- ✅ 使用`.env.production`存储默认配置
- ✅ 使用`.env.production.local`或系统环境变量存储敏感信息
- ✅ 定期轮换API密钥和衡量ID

### 3. 团队协作

- ✅ 保持`.env.example`文件更新
- ✅ 在文档中说明每个环境变量的用途
- ✅ 使用密码管理工具共享敏感信息

### 4. CI/CD

- ✅ 在CI/CD平台设置环境变量
- ✅ 不要在构建日志中输出敏感信息
- ✅ 使用加密的环境变量

---

## 🔗 相关文档

- [Nuxt.js环境变量文档](https://nuxt.com/docs/guide/going-further/runtime-config)
- [Google Analytics 4文档](https://developers.google.com/analytics/devguides/collection/ga4)
- [systemd环境变量文档](https://www.freedesktop.org/software/systemd/man/systemd.exec.html#Environment)

---

## 📞 支持

如有问题，请查看：
- TopFac文档：`docs/`
- GA4集成指南：`client/docs/GA4_INTEGRATION_GUIDE.md`
- 部署指南：`docs/GA4_AND_LOGGING_DEPLOYMENT.md`

