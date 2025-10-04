# TopFac 脚本说明

本目录包含TopFac项目的各种运维和部署脚本。

---

## 📁 脚本列表

### 🔒 安全与日志相关

#### 1. `analyze-user-agent.sh`
**用途**: 分析JSON日志中的User-Agent，识别正常用户、爬虫、扫描器等

**使用方法**:
```bash
# 在服务器上运行
ssh root@8.211.149.80 '/usr/local/bin/analyze-user-agent.sh'

# 或本地运行（需要SSH访问权限）
./scripts/analyze-user-agent.sh
```

**功能**:
- 统计请求类型（浏览器、移动设备、爬虫、扫描器）
- 分析可疑请求（400/403/404错误）
- 显示Top 10 User-Agent和访问IP
- 性能统计（平均响应时间、慢请求）
- 安全建议

**定时任务**:
```bash
# 每天早上9点运行
0 9 * * * /usr/local/bin/analyze-user-agent.sh > /var/log/ua-analysis.log
```

---

#### 2. `deploy-json-logger.sh`
**用途**: 部署JSON日志系统到OpenResty服务器

**使用方法**:
```bash
./scripts/deploy-json-logger.sh
```

**功能**:
- 备份现有配置
- 上传Lua日志模块（logger.lua, log_buffer.lua）
- 更新nginx.conf和topfac配置
- 测试并重载Nginx

**部署内容**:
- JSON日志实时输出
- 按天自动分割日志文件
- 批量写入优化（1000条或5秒）
- 自动清理旧日志（保留180天）

---

#### 3. `deploy-security-rules.sh`
**用途**: 部署安全防护规则

**使用方法**:
```bash
./scripts/deploy-security-rules.sh
```

**功能**:
- 阻止无User-Agent的请求（返回403）
- 阻止已知扫描器（zgrab、masscan、nmap等）
- 全局限流：每IP每秒50个请求
- API限流：每IP每秒10个请求

**验证**:
```bash
# 测试无User-Agent请求（应该被拒绝）
curl -H "User-Agent:" -v https://topfac.nssa.io/

# 测试正常请求（应该成功）
curl -A 'Mozilla/5.0' https://topfac.nssa.io/
```

---

#### 4. `test-json-logger.sh`
**用途**: 测试JSON日志系统是否正常工作

**使用方法**:
```bash
./scripts/test-json-logger.sh
```

**测试项目**:
- ✓ 检查Lua模块是否存在
- ✓ 检查日志目录权限
- ✓ 检查Nginx配置
- ✓ 发送测试请求
- ✓ 验证JSON日志文件
- ✓ 验证JSON格式
- ✓ 验证日志字段完整性

---

### 🚀 应用部署相关

#### 5. `deploy.sh`
**用途**: TopFac本地版Docker容器化部署

**使用方法**:
```bash
./scripts/deploy.sh
```

**功能**:
- 检查Docker环境
- 构建Docker镜像
- 创建并启动容器
- 配置数据持久化
- 健康检查

**适用场景**: 本地开发、测试环境

---

#### 6. `dev.sh`
**用途**: 启动开发环境（前后端并行）

**使用方法**:
```bash
./scripts/dev.sh
```

**功能**:
- 检查Node.js版本（需要18+）
- 自动安装依赖
- 并行启动前端（Nuxt）和后端（Express）
- 支持热重载

**访问地址**:
- 前端: http://localhost:3000
- 后端API: http://localhost:3000/api

---

#### 7. `start-prod.sh`
**用途**: 启动生产环境

**使用方法**:
```bash
./scripts/start-prod.sh
```

**功能**:
- 检查环境变量配置
- 自动构建前端（如果需要）
- 启动生产服务器
- PM2进程管理

**前置条件**:
- 已配置.env文件
- 已构建前端（或自动构建）

---

## 📊 使用场景

### 场景1: 首次部署JSON日志系统
```bash
# 1. 部署JSON日志
./scripts/deploy-json-logger.sh

# 2. 测试日志系统
./scripts/test-json-logger.sh

# 3. 部署安全规则
./scripts/deploy-security-rules.sh

# 4. 分析日志
ssh root@8.211.149.80 '/usr/local/bin/analyze-user-agent.sh'
```

### 场景2: 日常安全监控
```bash
# 每天运行分析脚本
./scripts/analyze-user-agent.sh

# 查看被拒绝的请求
ssh root@8.211.149.80 'grep "\"status\":403" /var/log/openresty/json/access-$(date +%Y%m%d).json | jq .'
```

### 场景3: 本地开发
```bash
# 启动开发环境
./scripts/dev.sh

# 或使用Docker
./scripts/deploy.sh
```

### 场景4: 生产部署
```bash
# 启动生产服务
./scripts/start-prod.sh
```

---

## 🔧 维护建议

### 定期任务

1. **每天**: 运行`analyze-user-agent.sh`分析安全状况
2. **每周**: 检查日志文件大小和磁盘使用
3. **每月**: 审查被拒绝的请求，调整安全规则

### 监控指标

- 磁盘使用率（日志目录）
- 403错误数量（被拒绝的请求）
- 扫描器请求数量
- 平均响应时间

### 告警阈值

- ⚠️ 磁盘使用率 > 80%
- ⚠️ 403错误 > 100/天
- ⚠️ 扫描器请求 > 50/天
- ⚠️ 平均响应时间 > 1秒

---

## 📝 脚本依赖

### 系统要求

- **操作系统**: Linux (Ubuntu/Debian)
- **Shell**: Bash 4.0+
- **SSH**: 需要root@8.211.149.80的SSH访问权限

### 软件依赖

- **OpenResty**: 1.19+
- **jq**: JSON处理工具
- **Node.js**: 18+ (仅开发/生产脚本)
- **Docker**: 20+ (仅deploy.sh)

### 安装依赖

```bash
# Ubuntu/Debian
sudo apt-get install -y jq

# 检查OpenResty
/usr/local/openresty/nginx/sbin/nginx -v

# 检查Node.js
node -v
```

---

## 🆘 故障排查

### 问题1: JSON日志文件未生成

**检查步骤**:
```bash
# 1. 检查目录权限
ssh root@8.211.149.80 'ls -ld /var/log/openresty/json/'

# 2. 检查错误日志
ssh root@8.211.149.80 'tail -50 /var/log/openresty/error.log | grep -i logger'

# 3. 检查Lua模块
ssh root@8.211.149.80 'ls -l /usr/local/openresty/lualib/custom/'
```

### 问题2: 安全规则不生效

**检查步骤**:
```bash
# 1. 测试配置
ssh root@8.211.149.80 '/usr/local/openresty/nginx/sbin/nginx -t'

# 2. 重载Nginx
ssh root@8.211.149.80 'systemctl reload openresty'

# 3. 测试规则
curl -H "User-Agent:" -v https://topfac.nssa.io/
```

### 问题3: 分析脚本报错

**检查步骤**:
```bash
# 1. 检查jq是否安装
ssh root@8.211.149.80 'which jq'

# 2. 检查日志文件是否存在
ssh root@8.211.149.80 'ls -l /var/log/openresty/json/'

# 3. 手动运行脚本查看详细错误
ssh root@8.211.149.80 'bash -x /usr/local/bin/analyze-user-agent.sh'
```

---

## 📚 相关文档

- [JSON日志部署文档](../docs/json-logger-deployment.md)
- [OpenResty配置](../config/openresty/)
- [Lua模块](../config/openresty/lua/)

---

**最后更新**: 2025-10-04  
**维护者**: TopFac Team

