# GA4衡量ID环境变量迁移指南

## 📋 变更概述

为了提高安全性和灵活性，GA4衡量ID已从硬编码改为使用环境变量配置。

**变更日期：** 2025-10-03  
**影响范围：** 前端代码、部署脚本、文档

---

## 🔄 主要变更

### 1. 代码变更

#### ✅ 修改前（硬编码）

<augment_code_snippet path="client/plugins/google-analytics.client.ts" mode="EXCERPT">
````typescript
const GA_MEASUREMENT_ID = 'G-NV6BCFPN7W'
````
</augment_code_snippet>

#### ✅ 修改后（环境变量）

<augment_code_snippet path="client/plugins/google-analytics.client.ts" mode="EXCERPT">
````typescript
const config = useRuntimeConfig()
const GA_MEASUREMENT_ID = config.public.googleAnalyticsId

if (!GA_MEASUREMENT_ID) {
  console.warn('[GA4] Google Analytics ID not configured')
  return
}
````
</augment_code_snippet>

### 2. 配置变更

#### ✅ Nuxt配置更新

<augment_code_snippet path="client/nuxt.config.ts" mode="EXCERPT">
````typescript
runtimeConfig: {
  public: {
    // Google Analytics 4 衡量ID（从环境变量读取）
    googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID || '',
    topologyApiUrl: process.env.TOPOLOGY_API_URL || ''
  }
}
````
</augment_code_snippet>

### 3. 新增文件

| 文件 | 说明 | 提交到Git |
|------|------|----------|
| `client/.env.example` | 环境变量示例文件 | ✅ 是 |
| `client/.env.production` | 生产环境默认配置 | ✅ 是 |
| `docs/ENVIRONMENT_VARIABLES.md` | 环境变量配置指南 | ✅ 是 |
| `docs/GA4_ENV_VAR_MIGRATION.md` | 本迁移指南 | ✅ 是 |

### 4. 更新文件

| 文件 | 变更内容 |
|------|---------|
| `client/plugins/google-analytics.client.ts` | 使用环境变量替代硬编码 |
| `client/nuxt.config.ts` | 添加runtimeConfig配置 |
| `.gitignore` | 更新环境变量文件规则 |
| `deploy-to-new-server.sh` | 添加环境变量配置步骤 |
| `README.md` | 添加环境变量配置说明 |
| `client/docs/GA4_INTEGRATION_GUIDE.md` | 更新配置方式说明 |

---

## 🚀 迁移步骤

### 对于开发环境

**步骤1：拉取最新代码**

```bash
git pull origin main
```

**步骤2：创建环境变量文件**

```bash
cd client
cp .env.example .env
```

**步骤3：配置GA4 ID**

编辑 `client/.env`：

```env
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
TOPOLOGY_API_URL=http://localhost:30010
NODE_ENV=development
```

**步骤4：重启开发服务器**

```bash
cd ..
npm run dev
```

**步骤5：验证配置**

打开浏览器控制台，应该看到：

```
[GA4] Initialized with ID: G-NV6BCFPN7W
```

### 对于生产环境

#### 方法1：使用.env.production文件（已包含）

生产环境已经包含了 `.env.production` 文件，其中包含默认配置：

```env
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
TOPOLOGY_API_URL=
NODE_ENV=production
```

**无需额外操作**，重新构建即可：

```bash
cd client
npm run build
```

#### 方法2：使用系统环境变量（更安全）

如果需要覆盖默认配置，可以在服务器上设置环境变量：

```bash
# 编辑systemd服务文件
sudo nano /etc/systemd/system/topfac.service
```

添加环境变量：

```ini
[Service]
Environment=NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
```

重启服务：

```bash
sudo systemctl daemon-reload
sudo systemctl restart topfac
```

#### 方法3：使用.env.production.local文件（推荐）

创建本地覆盖文件：

```bash
# 在服务器上
cd /opt/topfac/client
nano .env.production.local
```

内容：

```env
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
```

这个文件不会被提交到Git，适合存储敏感信息。

---

## ✅ 验证清单

### 开发环境

- [ ] 已创建 `client/.env` 文件
- [ ] 已配置 `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`
- [ ] 开发服务器启动正常
- [ ] 浏览器控制台显示 `[GA4] Initialized with ID: G-XXXXXXXXXX`
- [ ] 网络请求中能看到 `gtag/js` 和 `g/collect`

### 生产环境

- [ ] 已拉取最新代码
- [ ] 已重新构建前端（`npm run build`）
- [ ] 已上传构建产物到服务器
- [ ] 服务重启成功
- [ ] 网站访问正常
- [ ] GA4实时报告能看到数据

---

## 🔍 故障排查

### 问题1：GA4没有初始化

**症状：** 浏览器控制台显示 `[GA4] Google Analytics ID not configured`

**原因：** 环境变量未配置或配置错误

**解决方案：**

1. 检查环境变量文件是否存在：
   ```bash
   ls -la client/.env*
   ```

2. 检查环境变量内容：
   ```bash
   cat client/.env
   ```

3. 确保变量名正确：`NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`

4. 重启开发服务器或重新构建

### 问题2：生产环境GA4不工作

**症状：** 生产环境没有GA4请求

**原因：** 构建时环境变量未加载

**解决方案：**

1. 检查 `.env.production` 文件是否存在：
   ```bash
   ls -la /opt/topfac/client/.env.production
   ```

2. 检查文件内容：
   ```bash
   cat /opt/topfac/client/.env.production
   ```

3. 重新构建前端：
   ```bash
   cd /opt/topfac/client
   npm run build
   ```

4. 上传到服务器并重启服务

### 问题3：环境变量被提交到Git

**症状：** `.env` 文件出现在Git状态中

**原因：** `.gitignore` 配置错误

**解决方案：**

1. 检查 `.gitignore` 文件：
   ```bash
   grep "\.env" .gitignore
   ```

2. 应该包含：
   ```
   .env
   .env.local
   .env.development
   .env.development.local
   .env.test
   .env.test.local
   ```

3. 从Git中移除已提交的文件：
   ```bash
   git rm --cached client/.env
   git commit -m "chore: remove .env from git"
   ```

---

## 📊 环境变量优先级

Nuxt.js按以下顺序加载环境变量（后面的会覆盖前面的）：

1. `.env` - 基础配置
2. `.env.production` 或 `.env.development` - 环境特定配置
3. `.env.local` - 本地覆盖配置
4. 系统环境变量 - 最高优先级

**示例：**

```
.env                    → NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-AAAAAAAAAA
.env.production         → NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-BBBBBBBBBB
系统环境变量             → NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-CCCCCCCCCC

最终使用：G-CCCCCCCCCC
```

---

## 🔐 安全建议

### ✅ 应该做的

1. **使用环境变量** - 不要硬编码敏感信息
2. **提交.env.example** - 提供配置模板
3. **忽略.env文件** - 不要提交到Git
4. **使用.env.production** - 存储生产环境默认配置（非敏感）
5. **使用.env.production.local** - 存储敏感信息（不提交）

### ❌ 不应该做的

1. **不要硬编码** - 避免在代码中直接写入API密钥
2. **不要提交.env** - 避免泄露敏感信息
3. **不要在日志中输出** - 避免在构建日志中显示敏感信息
4. **不要共享.env文件** - 使用密码管理工具共享

---

## 📚 相关文档

- [环境变量配置指南](ENVIRONMENT_VARIABLES.md)
- [GA4集成指南](../client/docs/GA4_INTEGRATION_GUIDE.md)
- [部署指南](GA4_AND_LOGGING_DEPLOYMENT.md)
- [Nuxt.js运行时配置文档](https://nuxt.com/docs/guide/going-further/runtime-config)

---

## 📞 支持

如有问题，请查看：
- 环境变量配置指南：`docs/ENVIRONMENT_VARIABLES.md`
- 故障排查部分（本文档）
- GitHub Issues

---

**变更完成！** 🎉

现在TopFac使用环境变量管理GA4配置，更加安全和灵活。

