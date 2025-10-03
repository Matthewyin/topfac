# Google Analytics 4 + 日志系统部署指南

## 📋 概述

本文档说明如何部署TopFac的访客追踪和日志系统。

**系统组成：**
1. ✅ Google Analytics 4 - 用户行为分析（数据保留14个月）
2. ✅ OpenResty访问日志 - HTTP请求记录（保留180天）
3. ✅ Node.js应用日志 - 业务操作记录（保留10天）

---

## 🎯 第一部分：Google Analytics 4集成

### 1.1 GA4配置信息

**已完成的GA4配置：**
- ✅ Google账号：`tccio2023@gmail.com`
- ✅ 媒体资源：TopFac Production
- ✅ 衡量ID：`G-NV6BCFPN7W`
- ✅ 域名：`topfac.nssa.io`
- ✅ 数据保留期限：14个月

### 1.2 前端集成（已完成）

**已创建的文件：**
1. `client/plugins/google-analytics.client.ts` - GA4插件
2. `client/composables/useGoogleAnalytics.ts` - 事件追踪函数
3. `client/nuxt.config.ts` - 已添加GA4插件配置

**集成状态：**
- ✅ 基础GA4代码已集成
- ✅ 自动页面浏览追踪已启用
- ✅ 增强型衡量已配置
- ⚠️ 业务事件追踪需要在组件中添加

### 1.3 部署到生产环境

**步骤1：构建前端**

```bash
cd /opt/topfac/client
npm run build
```

**步骤2：复制构建产物**

```bash
# 备份旧版本
cp -r /opt/topfac/dist /opt/topfac/dist.backup.$(date +%Y%m%d_%H%M%S)

# 复制新版本
cp -r /opt/topfac/client/.output/public/* /opt/topfac/dist/
```

**步骤3：重启服务**

```bash
# 重启Node.js应用
sudo systemctl restart topfac

# 重载OpenResty配置
sudo systemctl reload openresty
```

**步骤4：验证GA4集成**

1. 访问网站：https://topfac.nssa.io
2. 打开浏览器开发者工具（F12）
3. 切换到"网络"标签
4. 刷新页面
5. 查找请求：`https://www.googletagmanager.com/gtag/js?id=G-NV6BCFPN7W`
6. 查找请求：`https://www.google-analytics.com/g/collect`

如果看到这两个请求，说明GA4已成功集成。

**步骤5：在GA4中验证**

1. 登录GA4：https://analytics.google.com
2. 选择媒体资源：TopFac Production
3. 左侧菜单：报告 > 实时
4. 访问网站：https://topfac.nssa.io
5. 在实时报告中应该能看到你的访问

---

## 🗂️ 第二部分：日志系统配置

### 2.1 OpenResty访问日志（180天）

**配置文件位置：**
- 日志轮转配置：`/etc/logrotate.d/openresty`
- 日志文件目录：`/var/log/openresty/`

**部署步骤：**

```bash
# 1. 进入项目目录
cd /opt/topfac

# 2. 赋予脚本执行权限
chmod +x scripts/setup-logging.sh

# 3. 执行配置脚本
sudo ./scripts/setup-logging.sh
```

**配置详情：**
- ✅ 每天轮转一次
- ✅ 保留180天（6个月）
- ✅ 自动压缩旧日志
- ✅ 单文件大小限制：100MB
- ✅ 日志格式：access.log-20251003.gz

**日志格式：**
```
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
```

**示例日志：**
```
8.8.8.8 - - [03/Oct/2025:14:30:15 +0800] "GET /api/projects HTTP/2.0" 200 1234 "https://topfac.nssa.io/" "Mozilla/5.0..."
```

### 2.2 Node.js应用日志（10天）

**配置文件位置：**
- 日志工具：`server/utils/logger.js`
- 日志文件目录：`/opt/topfac/logs/`

**配置详情：**
- ✅ 每天自动创建新日志文件
- ✅ 保留10天
- ✅ 自动清理过期日志
- ✅ 日志格式：YYYY-MM-DD.log

**日志级别：**
- `ERROR` - 错误日志（红色）
- `WARN` - 警告日志（黄色）
- `INFO` - 信息日志（绿色）
- `DEBUG` - 调试日志（灰色）

**日志格式：**
```json
[2025-10-03T14:30:15.123Z] [INFO] TopFac 本地版启动中...
[2025-10-03T14:30:16.456Z] [HTTP] GET /api/projects 200 - 45ms
[2025-10-03T14:30:17.789Z] [ERROR] 创建项目失败 {"error":"数据库连接失败"}
```

**已自动启用：**
- ✅ 应用启动时自动启动清理任务
- ✅ 每24小时执行一次清理
- ✅ 立即清理一次过期日志

---

## 📊 第三部分：数据记录对比

### 3.1 数据覆盖范围

| 数据类型 | GA4 | OpenResty日志 | Node.js日志 |
|---------|-----|--------------|------------|
| **基础访问信息** |
| IP地址 | ❌ 不显示 | ✅ 完整IP | ✅ 完整IP |
| 访问时间 | ✅ 精确到秒 | ✅ 精确到秒 | ✅ 精确到毫秒 |
| 访问URL | ✅ 完整路径 | ✅ 完整路径 | ✅ 完整路径 |
| HTTP方法 | ❌ 不记录 | ✅ GET/POST等 | ✅ GET/POST等 |
| 响应状态码 | ❌ 不记录 | ✅ 200/404/500 | ✅ 200/404/500 |
| 响应时间 | ⚠️ 部分支持 | ❌ 不记录 | ✅ 毫秒级 |
| Referer | ✅ 流量来源 | ✅ 完整Referer | ❌ 不记录 |
| User-Agent | ✅ 解析后 | ✅ 原始UA | ❌ 不记录 |
| **地理位置信息** |
| 国家/城市 | ✅ 自动识别 | ❌ 需要IP库 | ❌ 需要IP库 |
| ISP | ❌ 不记录 | ❌ 需要IP库 | ❌ 需要IP库 |
| **设备信息** |
| 设备类型 | ✅ 自动识别 | ❌ 需要解析UA | ❌ 不记录 |
| 操作系统 | ✅ 自动识别 | ❌ 需要解析UA | ❌ 不记录 |
| 浏览器 | ✅ 自动识别 | ❌ 需要解析UA | ❌ 不记录 |
| **用户行为** |
| 页面停留时间 | ✅ 自动计算 | ❌ 不记录 | ❌ 不记录 |
| 点击事件 | ✅ 可配置 | ❌ 不记录 | ❌ 不记录 |
| 滚动深度 | ✅ 自动追踪 | ❌ 不记录 | ❌ 不记录 |
| **业务信息** |
| 创建项目 | ✅ 自定义事件 | ❌ 不记录 | ✅ 应用日志 |
| AI转换 | ✅ 自定义事件 | ❌ 不记录 | ✅ 应用日志 |
| 错误信息 | ✅ 自定义事件 | ❌ 不记录 | ✅ 错误日志 |

### 3.2 数据保留期限

| 系统 | 保留期限 | 存储位置 | 数据所有权 |
|------|---------|---------|-----------|
| GA4 | 14个月 | Google服务器 | Google托管 |
| OpenResty日志 | 180天 | ECS服务器 | 完全掌控 |
| Node.js日志 | 10天 | ECS服务器 | 完全掌控 |

---

## 🔍 第四部分：日志查看和分析

### 4.1 实时查看日志

**OpenResty访问日志：**
```bash
# 实时查看访问日志
sudo tail -f /var/log/openresty/access.log

# 查看错误日志
sudo tail -f /var/log/openresty/error.log

# 查看最近100行
sudo tail -n 100 /var/log/openresty/access.log
```

**Node.js应用日志：**
```bash
# 实时查看今天的日志
tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log

# 查看最近100行
tail -n 100 /opt/topfac/logs/$(date +%Y-%m-%d).log

# 查看所有日志文件
ls -lh /opt/topfac/logs/
```

### 4.2 日志分析示例

**统计访问量：**
```bash
# 统计今天的总访问量
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | wc -l

# 统计今天的独立IP数
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | awk '{print $1}' | sort -u | wc -l

# 统计最多访问的IP（Top 10）
sudo awk '{print $1}' /var/log/openresty/access.log | sort | uniq -c | sort -rn | head -10
```

**统计HTTP状态码：**
```bash
# 统计各状态码数量
sudo awk '{print $9}' /var/log/openresty/access.log | sort | uniq -c | sort -rn

# 统计404错误
sudo grep " 404 " /var/log/openresty/access.log | wc -l

# 统计500错误
sudo grep " 500 " /var/log/openresty/access.log
```

**统计最热门的页面：**
```bash
# 统计访问最多的URL（Top 10）
sudo awk '{print $7}' /var/log/openresty/access.log | sort | uniq -c | sort -rn | head -10
```

### 4.3 GA4数据查看

**实时报告：**
1. 登录：https://analytics.google.com
2. 选择：TopFac Production
3. 报告 > 实时

**事件报告：**
1. 报告 > 互动 > 事件
2. 查看所有事件列表
3. 点击事件名称查看详细参数

**用户报告：**
1. 报告 > 用户 > 用户属性
2. 查看设备、地理位置、浏览器等信息

---

## 🛠️ 第五部分：维护和故障排查

### 5.1 日志轮转故障排查

**检查logrotate状态：**
```bash
# 查看logrotate状态
sudo cat /var/lib/logrotate/status | grep openresty

# 测试配置
sudo logrotate -d /etc/logrotate.d/openresty

# 强制执行轮转
sudo logrotate -f /etc/logrotate.d/openresty
```

**常见问题：**

1. **日志文件没有轮转**
   - 检查logrotate配置：`sudo cat /etc/logrotate.d/openresty`
   - 检查cron任务：`sudo systemctl status cron`
   - 手动执行：`sudo logrotate -f /etc/logrotate.d/openresty`

2. **日志文件权限错误**
   ```bash
   sudo chown www-data:adm /var/log/openresty/*.log
   sudo chmod 640 /var/log/openresty/*.log
   ```

3. **磁盘空间不足**
   ```bash
   # 查看磁盘使用情况
   df -h
   
   # 查看日志目录大小
   du -sh /var/log/openresty/
   du -sh /opt/topfac/logs/
   
   # 手动清理旧日志
   sudo find /var/log/openresty/ -name "*.gz" -mtime +180 -delete
   ```

### 5.2 GA4故障排查

**检查GA4是否正常工作：**

1. **浏览器开发者工具检查**
   - F12 > 网络标签
   - 查找：`google-analytics.com/g/collect`
   - 如果没有，说明GA4代码未加载

2. **控制台日志检查**
   - F12 > 控制台
   - 查找：`[GA4] Event sent:`
   - 如果没有，说明事件未发送

3. **GA4 DebugView**
   - 登录GA4
   - 配置 > DebugView
   - 在浏览器控制台执行：
     ```javascript
     window.gtag('config', 'G-NV6BCFPN7W', { debug_mode: true })
     ```

---

## ✅ 部署检查清单

### GA4集成检查

- [ ] GA4插件文件已创建
- [ ] Nuxt配置已更新
- [ ] 前端已重新构建
- [ ] 生产环境已部署
- [ ] 浏览器能看到GA4请求
- [ ] GA4实时报告能看到数据

### 日志系统检查

- [ ] OpenResty日志轮转配置已安装
- [ ] logrotate配置测试通过
- [ ] 日志目录权限正确
- [ ] Node.js日志清理任务已启动
- [ ] 能够正常查看日志文件

---

## 📞 支持

如有问题，请查看：
- GA4文档：https://developers.google.com/analytics/devguides/collection/ga4
- OpenResty文档：https://openresty.org/cn/
- Logrotate文档：`man logrotate`

