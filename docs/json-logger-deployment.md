# OpenResty JSON日志系统部署文档

## 📋 概述

本文档描述如何部署OpenResty JSON日志系统（第一阶段：log_by_lua_block + 文件操作）。

## 🎯 功能特性

- ✅ 实时输出JSON格式日志
- ✅ 自动按天分割日志文件
- ✅ 包含40+个详细字段
- ✅ 批量写入，性能优化
- ✅ 自动清理旧日志（保留180天）
- ✅ 不影响现有日志系统

## 📁 文件结构

```
config/openresty/
├── lua/
│   ├── logger.lua              # 日志收集模块
│   └── log_buffer.lua          # 缓冲区管理模块
├── nginx.conf                  # 主配置文件
└── sites-available/
    └── topfac                  # 站点配置

scripts/
├── deploy-json-logger.sh       # 部署脚本
└── test-json-logger.sh         # 测试脚本

/var/log/openresty/json/        # JSON日志目录（服务器上）
└── access-YYYYMMDD.json        # 按日期分割的日志文件
```

## 🚀 部署步骤

### 前置条件

1. OpenResty已安装
2. 有root权限访问服务器
3. SSH密钥已配置

### 步骤1：准备部署

```bash
# 给脚本添加执行权限
chmod +x scripts/deploy-json-logger.sh
chmod +x scripts/test-json-logger.sh
```

### 步骤2：执行部署

```bash
# 部署到服务器（默认8.211.149.80）
./scripts/deploy-json-logger.sh

# 或指定服务器IP
./scripts/deploy-json-logger.sh 1.2.3.4
```

部署脚本会自动：
1. 备份现有配置
2. 创建必要的目录
3. 上传Lua模块
4. 上传配置文件
5. 测试配置
6. 重载Nginx

### 步骤3：验证部署

```bash
# 运行测试脚本
./scripts/test-json-logger.sh

# 或手动验证
ssh root@8.211.149.80 'ls -lh /var/log/openresty/json/'
ssh root@8.211.149.80 'tail -f /var/log/openresty/json/access-$(date +%Y%m%d).json'
```

## 📊 JSON日志格式

每行一个JSON对象（NDJSON格式），包含以下字段：

### 基础请求信息
- `timestamp`: ISO8601时间戳
- `log_time`: Unix时间戳
- `request_id`: 请求唯一ID
- `remote_addr`: 客户端IP
- `remote_port`: 客户端端口
- `request_method`: 请求方法
- `request_uri`: 请求URI
- `uri`: URI路径
- `args`: 查询参数

### 服务器信息
- `scheme`: http/https
- `host`: 主机名
- `server_name`: 服务器名称
- `server_addr`: 服务器IP
- `server_port`: 服务器端口

### 响应信息
- `status`: HTTP状态码
- `body_bytes_sent`: 响应体大小
- `bytes_sent`: 总发送字节数
- `request_length`: 请求长度

### 性能指标
- `request_time`: 总请求时间（秒）
- `upstream_response_time`: 后端响应时间
- `upstream_connect_time`: 后端连接时间
- `upstream_header_time`: 后端响应头时间

### SSL/TLS信息
- `ssl_protocol`: SSL协议版本
- `ssl_cipher`: 加密套件
- `ssl_session_id`: 会话ID
- `ssl_session_reused`: 会话复用

### HTTP头信息
- `http_referer`: 来源页面
- `http_user_agent`: 用户代理
- `http_x_forwarded_for`: 真实IP
- `http_accept_language`: 接受语言
- `http_accept_encoding`: 接受编码

完整字段列表请参考 `config/openresty/lua/logger.lua`

## 🔍 日志查询示例

### 安装jq工具（JSON处理）

```bash
ssh root@8.211.149.80 'apt-get install -y jq'
```

### 查询示例

```bash
# 1. 查看最新10条日志
ssh root@8.211.149.80 'tail -10 /var/log/openresty/json/access-$(date +%Y%m%d).json | jq .'

# 2. 查询所有4xx错误
ssh root@8.211.149.80 'cat /var/log/openresty/json/access-$(date +%Y%m%d).json | jq "select(.status >= 400 and .status < 500)"'

# 3. 查询所有5xx错误
ssh root@8.211.149.80 'cat /var/log/openresty/json/access-$(date +%Y%m%d).json | jq "select(.status >= 500)"'

# 4. 统计状态码分布
ssh root@8.211.149.80 'cat /var/log/openresty/json/access-$(date +%Y%m%d).json | jq -r .status | sort | uniq -c | sort -rn'

# 5. 查询慢请求（>1秒）
ssh root@8.211.149.80 'cat /var/log/openresty/json/access-$(date +%Y%m%d).json | jq "select(.request_time > 1)"'

# 6. 查询特定IP的请求
ssh root@8.211.149.80 'cat /var/log/openresty/json/access-$(date +%Y%m%d).json | jq "select(.remote_addr == \"1.2.3.4\")"'

# 7. 统计访问最多的URI
ssh root@8.211.149.80 'cat /var/log/openresty/json/access-$(date +%Y%m%d).json | jq -r .request_uri | sort | uniq -c | sort -rn | head -10'

# 8. 计算平均响应时间
ssh root@8.211.149.80 'cat /var/log/openresty/json/access-$(date +%Y%m%d).json | jq -s "add/length | {avg_request_time: .request_time}"'
```

## 🔧 配置参数

### 缓冲区配置（log_buffer.lua）

```lua
local BUFFER_SIZE = 1000           -- 缓冲区大小（条数）
local FLUSH_INTERVAL = 5           -- 刷新间隔（秒）
local LOG_DIR = "/var/log/openresty/json"
```

### 共享内存配置（nginx.conf）

```nginx
lua_shared_dict log_buffer 100m;  # 100MB缓冲区
```

### 日志保留天数

```lua
log_buffer.cleanup_old_logs(180)  -- 保留180天
```

## ⚠️ 注意事项

1. **磁盘空间**：确保有足够的磁盘空间存储日志
2. **性能影响**：日志写入是异步的，对性能影响很小
3. **备份策略**：传统日志仍然保留，作为备份
4. **健康检查**：/health路径不记录JSON日志

## 🔄 回滚方案

如果需要回滚：

```bash
# 1. 找到备份目录
ssh root@8.211.149.80 'ls -lt /root/nginx-backup/ | head -5'

# 2. 恢复配置（替换YYYYMMDD_HHMMSS为实际时间）
ssh root@8.211.149.80 'cp /root/nginx-backup/YYYYMMDD_HHMMSS/nginx.conf /usr/local/openresty/nginx/conf/'
ssh root@8.211.149.80 'cp /root/nginx-backup/YYYYMMDD_HHMMSS/topfac /usr/local/openresty/nginx/conf/sites-available/'

# 3. 重载Nginx
ssh root@8.211.149.80 'systemctl reload openresty'
```

## 📈 监控建议

### 监控指标

1. **日志文件大小增长速度**
   ```bash
   watch -n 60 'ls -lh /var/log/openresty/json/access-$(date +%Y%m%d).json'
   ```

2. **磁盘使用率**
   ```bash
   df -h /var/log/openresty/json/
   ```

3. **错误日志**
   ```bash
   tail -f /var/log/openresty/error.log | grep -i 'logger\|buffer'
   ```

### 告警条件

- 磁盘使用率 > 80%
- 日志写入失败
- 共享内存使用率 > 90%

## 🐛 故障排查

### 问题1：JSON日志文件未生成

**检查步骤：**
```bash
# 1. 检查目录权限
ssh root@8.211.149.80 'ls -ld /var/log/openresty/json/'

# 2. 检查错误日志
ssh root@8.211.149.80 'tail -50 /var/log/openresty/error.log | grep -i logger'

# 3. 检查Lua模块是否存在
ssh root@8.211.149.80 'ls -l /usr/local/openresty/lualib/custom/'
```

### 问题2：JSON格式错误

**检查步骤：**
```bash
# 验证JSON格式
ssh root@8.211.149.80 'tail -1 /var/log/openresty/json/access-$(date +%Y%m%d).json | jq .'
```

### 问题3：性能下降

**检查步骤：**
```bash
# 1. 检查缓冲区大小
# 2. 调整FLUSH_INTERVAL
# 3. 增加共享内存大小
```

## 📞 技术支持

如有问题，请检查：
1. `/var/log/openresty/error.log` - 错误日志
2. `/var/log/openresty/access.log` - 传统访问日志（备份）
3. 本文档的故障排查部分

## 🎯 下一步

第二阶段将实现HTTP API，提供：
- 日志文件列表
- 日志下载
- 日志查询
- 日志统计
- 实时日志流

敬请期待！

