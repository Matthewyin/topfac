# 日志查看指南

## 📊 一、OpenResty访问日志

### 1.1 实时查看访问日志

```bash
# 实时查看访问日志（最常用）
sudo tail -f /var/log/openresty/access.log

# 实时查看最近100行
sudo tail -n 100 -f /var/log/openresty/access.log

# 实时查看错误日志
sudo tail -f /var/log/openresty/error.log
```

**日志格式示例：**
```
8.8.8.8 - - [03/Oct/2025:14:30:15 +0800] "GET /api/projects HTTP/2.0" 200 1234 "https://topfac.nssa.io/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
```

**字段说明：**
- `8.8.8.8` - 访客IP地址
- `[03/Oct/2025:14:30:15 +0800]` - 访问时间
- `GET` - HTTP方法
- `/api/projects` - 请求路径
- `HTTP/2.0` - 协议版本
- `200` - HTTP状态码
- `1234` - 响应大小（字节）
- `https://topfac.nssa.io/` - 来源页面（Referer）
- `Mozilla/5.0...` - 浏览器信息（User-Agent）

### 1.2 查看历史日志

```bash
# 查看今天的日志
sudo cat /var/log/openresty/access.log

# 查看昨天的日志（已压缩）
sudo zcat /var/log/openresty/access.log-$(date -d "yesterday" +%Y%m%d).gz

# 查看指定日期的日志
sudo zcat /var/log/openresty/access.log-20251003.gz

# 查看最近1000行
sudo tail -n 1000 /var/log/openresty/access.log
```

### 1.3 日志分析命令

**统计今天的访问量：**
```bash
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | wc -l
```

**统计今天的独立IP数：**
```bash
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | awk '{print $1}' | sort -u | wc -l
```

**查看访问最多的IP（Top 10）：**
```bash
sudo awk '{print $1}' /var/log/openresty/access.log | sort | uniq -c | sort -rn | head -10
```

**统计HTTP状态码分布：**
```bash
sudo awk '{print $9}' /var/log/openresty/access.log | sort | uniq -c | sort -rn
```

**查看所有404错误：**
```bash
sudo grep " 404 " /var/log/openresty/access.log
```

**查看所有500错误：**
```bash
sudo grep " 500 " /var/log/openresty/access.log
```

**查看最热门的页面（Top 10）：**
```bash
sudo awk '{print $7}' /var/log/openresty/access.log | sort | uniq -c | sort -rn | head -10
```

**查看某个IP的所有访问：**
```bash
sudo grep "8.8.8.8" /var/log/openresty/access.log
```

**查看API请求：**
```bash
sudo grep "/api/" /var/log/openresty/access.log
```

### 1.4 查看日志文件列表

```bash
# 查看所有日志文件
sudo ls -lh /var/log/openresty/

# 查看日志目录大小
sudo du -sh /var/log/openresty/

# 查看每个日志文件的大小
sudo du -h /var/log/openresty/* | sort -h
```

---

## 📝 二、Node.js应用日志

### 2.1 实时查看应用日志

```bash
# 实时查看今天的日志（最常用）
tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log

# 实时查看最近100行
tail -n 100 -f /opt/topfac/logs/$(date +%Y-%m-%d).log
```

**日志格式示例：**
```
[2025-10-03T14:30:15.123Z] [INFO] TopFac 本地版启动中...
[2025-10-03T14:30:16.456Z] [HTTP] GET /api/projects 200 - 45ms
[2025-10-03T14:30:17.789Z] [ERROR] 创建项目失败 {"error":"数据库连接失败"}
```

**字段说明：**
- `[2025-10-03T14:30:15.123Z]` - 时间戳（UTC时间）
- `[INFO]` - 日志级别（ERROR/WARN/INFO/DEBUG）
- `TopFac 本地版启动中...` - 日志消息
- `{"error":"..."}` - 附加元数据（JSON格式）

### 2.2 查看历史日志

```bash
# 查看昨天的日志
cat /opt/topfac/logs/$(date -d "yesterday" +%Y-%m-%d).log

# 查看指定日期的日志
cat /opt/topfac/logs/2025-10-03.log

# 查看最近1000行
tail -n 1000 /opt/topfac/logs/$(date +%Y-%m-%d).log
```

### 2.3 日志过滤

**只看错误日志：**
```bash
grep "\[ERROR\]" /opt/topfac/logs/$(date +%Y-%m-%d).log
```

**只看警告日志：**
```bash
grep "\[WARN\]" /opt/topfac/logs/$(date +%Y-%m-%d).log
```

**只看HTTP请求：**
```bash
grep "\[HTTP\]" /opt/topfac/logs/$(date +%Y-%m-%d).log
```

**查看包含特定关键词的日志：**
```bash
grep "创建项目" /opt/topfac/logs/$(date +%Y-%m-%d).log
```

**查看最近的错误（实时）：**
```bash
tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log | grep --line-buffered "\[ERROR\]"
```

### 2.4 查看日志文件列表

```bash
# 查看所有日志文件
ls -lh /opt/topfac/logs/

# 查看日志目录大小
du -sh /opt/topfac/logs/

# 查看最新的5个日志文件
ls -lt /opt/topfac/logs/ | head -6
```

---

## 🔍 三、systemd服务日志

### 3.1 查看TopFac应用日志

```bash
# 实时查看应用日志（最常用）
sudo journalctl -u topfac -f

# 查看最近100行
sudo journalctl -u topfac -n 100

# 查看今天的日志
sudo journalctl -u topfac --since today

# 查看最近1小时的日志
sudo journalctl -u topfac --since "1 hour ago"

# 查看指定时间范围的日志
sudo journalctl -u topfac --since "2025-10-03 14:00:00" --until "2025-10-03 15:00:00"
```

### 3.2 查看OpenResty服务日志

```bash
# 实时查看OpenResty服务日志
sudo journalctl -u openresty -f

# 查看最近100行
sudo journalctl -u openresty -n 100

# 查看今天的日志
sudo journalctl -u openresty --since today
```

### 3.3 查看服务状态

```bash
# 查看TopFac服务状态
sudo systemctl status topfac

# 查看OpenResty服务状态
sudo systemctl status openresty

# 查看服务是否在运行
sudo systemctl is-active topfac
sudo systemctl is-active openresty
```

---

## 📊 四、综合日志查看

### 4.1 同时查看多个日志

**方法1：使用tmux分屏**
```bash
# 安装tmux（如果没有）
sudo apt install tmux

# 启动tmux
tmux

# 分屏（Ctrl+B 然后按 "）
# 在第一个窗口：
sudo tail -f /var/log/openresty/access.log

# 切换到第二个窗口（Ctrl+B 然后按方向键）
# 在第二个窗口：
tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log
```

**方法2：使用multitail**
```bash
# 安装multitail
sudo apt install multitail

# 同时查看多个日志
sudo multitail /var/log/openresty/access.log /opt/topfac/logs/$(date +%Y-%m-%d).log
```

### 4.2 日志搜索

**在所有日志中搜索关键词：**
```bash
# 搜索OpenResty日志
sudo grep -r "关键词" /var/log/openresty/

# 搜索Node.js日志
grep -r "关键词" /opt/topfac/logs/

# 搜索压缩的日志文件
sudo zgrep "关键词" /var/log/openresty/*.gz
```

---

## 🛠️ 五、常用日志查看场景

### 场景1：网站访问异常

```bash
# 1. 查看OpenResty错误日志
sudo tail -n 100 /var/log/openresty/error.log

# 2. 查看最近的500错误
sudo grep " 500 " /var/log/openresty/access.log | tail -n 20

# 3. 查看应用错误日志
grep "\[ERROR\]" /opt/topfac/logs/$(date +%Y-%m-%d).log | tail -n 20

# 4. 查看服务状态
sudo systemctl status topfac
sudo systemctl status openresty
```

### 场景2：某个功能不工作

```bash
# 1. 实时查看应用日志
tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log

# 2. 在浏览器中操作该功能

# 3. 观察日志输出，查找错误信息
```

### 场景3：查看访问统计

```bash
# 1. 今天的总访问量
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | wc -l

# 2. 今天的独立IP数
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | awk '{print $1}' | sort -u | wc -l

# 3. 访问最多的IP
sudo awk '{print $1}' /var/log/openresty/access.log | sort | uniq -c | sort -rn | head -10

# 4. 最热门的页面
sudo awk '{print $7}' /var/log/openresty/access.log | sort | uniq -c | sort -rn | head -10
```

### 场景4：性能问题排查

```bash
# 1. 查看响应时间（需要在OpenResty配置中添加$request_time）
# 暂时可以通过应用日志查看
grep "\[HTTP\]" /opt/topfac/logs/$(date +%Y-%m-%d).log | grep -E "[0-9]{3,}ms"

# 2. 查看慢请求（超过1秒）
grep "\[HTTP\]" /opt/topfac/logs/$(date +%Y-%m-%d).log | grep -E "[0-9]{4,}ms"
```

---

## 📱 六、快捷命令别名（可选）

在`~/.bashrc`中添加以下别名，方便日志查看：

```bash
# 编辑bashrc
nano ~/.bashrc

# 添加以下内容：
alias log-openresty='sudo tail -f /var/log/openresty/access.log'
alias log-openresty-error='sudo tail -f /var/log/openresty/error.log'
alias log-topfac='tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log'
alias log-topfac-error='grep "\[ERROR\]" /opt/topfac/logs/$(date +%Y-%m-%d).log'
alias log-service='sudo journalctl -u topfac -f'

# 保存后执行
source ~/.bashrc

# 使用别名
log-openresty      # 查看OpenResty访问日志
log-topfac         # 查看TopFac应用日志
log-topfac-error   # 查看TopFac错误日志
```

---

## 🎯 七、日志查看最佳实践

### 7.1 日常监控

**每天检查一次：**
```bash
# 1. 查看是否有错误
sudo grep " 500 " /var/log/openresty/access.log | wc -l
grep "\[ERROR\]" /opt/topfac/logs/$(date +%Y-%m-%d).log | wc -l

# 2. 查看访问量
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | wc -l

# 3. 查看服务状态
sudo systemctl status topfac
sudo systemctl status openresty
```

### 7.2 问题排查流程

1. **查看服务状态**
   ```bash
   sudo systemctl status topfac
   sudo systemctl status openresty
   ```

2. **查看最近的错误**
   ```bash
   sudo tail -n 50 /var/log/openresty/error.log
   grep "\[ERROR\]" /opt/topfac/logs/$(date +%Y-%m-%d).log | tail -n 20
   ```

3. **实时监控日志**
   ```bash
   tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log
   ```

4. **重现问题并观察日志输出**

5. **根据错误信息定位问题**

---

## 📞 快速参考

### 最常用的命令

```bash
# OpenResty访问日志（实时）
sudo tail -f /var/log/openresty/access.log

# OpenResty错误日志（实时）
sudo tail -f /var/log/openresty/error.log

# TopFac应用日志（实时）
tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log

# TopFac错误日志
grep "\[ERROR\]" /opt/topfac/logs/$(date +%Y-%m-%d).log

# 服务状态
sudo systemctl status topfac
sudo systemctl status openresty

# 今天的访问量
sudo grep "$(date +%d/%b/%Y)" /var/log/openresty/access.log | wc -l
```

---

**提示：** 按 `Ctrl+C` 可以退出实时日志查看（tail -f）

