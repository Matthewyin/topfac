# 部署脚本更新说明 - 2025-10-03

## 📋 更新概述

`deploy-to-new-server.sh` 部署脚本已更新，新增了环境变量配置和日志系统配置功能。

---

## ✅ 新增功能

### 1. 环境变量配置（步骤7.5）

**功能：**
- 自动创建 `.env.production` 文件
- 配置Google Analytics 4衡量ID
- 配置API基础URL

**实现代码：**
```bash
# 步骤7.5: 配置环境变量
echo -e "${YELLOW}[7.5/11] 配置环境变量...${NC}"
ssh $SERVER "cd $DEPLOY_DIR/client && \
    if [ ! -f .env.production ]; then \
        echo '创建生产环境配置文件...'; \
        cat > .env.production << 'ENVEOF'
# TopFac 生产环境配置
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
TOPOLOGY_API_URL=
NODE_ENV=production
ENVEOF
    fi && \
    echo '环境变量配置完成' && \
    cat .env.production"
echo -e "${GREEN}✓ 环境变量配置完成${NC}"
```

**配置内容：**
```env
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
TOPOLOGY_API_URL=
NODE_ENV=production
```

### 2. 日志系统配置（步骤7.6）

**功能：**
- 配置OpenResty日志轮转（保留180天）
- 创建日志目录
- 配置logrotate自动清理

**实现代码：**
```bash
# 步骤7.6: 配置日志系统
echo -e "${YELLOW}[7.6/11] 配置日志系统...${NC}"
ssh $SERVER "
    # 配置OpenResty日志轮转（保留180天）
    cat > /etc/logrotate.d/openresty << 'LOGEOF'
/var/log/openresty/*.log {
    daily
    rotate 180
    missingok
    notifempty
    compress
    delaycompress
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/openresty.pid ]; then
            kill -USR1 \`cat /var/run/openresty.pid\`
        fi
    endscript
    dateext
    dateformat -%Y%m%d
    maxsize 100M
}
LOGEOF
    chmod 644 /etc/logrotate.d/openresty && \
    echo 'OpenResty日志轮转配置完成' && \
    # 创建日志目录
    mkdir -p /var/log/openresty && \
    mkdir -p $DEPLOY_DIR/logs && \
    echo '日志目录创建完成'"
echo -e "${GREEN}✓ 日志系统配置完成${NC}"
```

**日志配置：**
- **OpenResty日志：** 保留180天，每天轮转，自动压缩
- **Node.js日志：** 保留10天，自动清理（在应用代码中配置）

### 3. systemd服务更新

**新增配置：**
```ini
[Service]
# Google Analytics 4 配置（从环境变量文件读取）
EnvironmentFile=-/opt/topfac/client/.env.production
```

**说明：**
- `-` 前缀表示文件不存在时不报错
- 环境变量会自动加载到服务进程中

---

## 📊 部署步骤对比

### 更新前（10步）

1. 检查SSH连接
2. 安装OpenResty
3. 安装Node.js
4. 创建部署目录
5. 上传代码
6. 安装依赖并构建
7. 配置systemd服务
8. 配置OpenResty
9. 创建临时SSL证书并启动OpenResty
10. 提示用户配置DNS和SSL证书

### 更新后（11步）

1. 检查SSH连接
2. 安装OpenResty
3. 安装Node.js
4. 创建部署目录
5. 上传代码
6. 安装依赖并构建
7. 配置systemd服务
8. **配置环境变量** ⭐ 新增
9. **配置日志系统** ⭐ 新增
10. 配置OpenResty
11. 创建临时SSL证书并启动OpenResty
12. 提示用户配置DNS和SSL证书

---

## 🔧 使用方法

### 基本用法（不变）

```bash
# 部署到新服务器
./deploy-to-new-server.sh <服务器IP>

# 示例
./deploy-to-new-server.sh 8.211.149.80
```

### 部署后验证

**1. 检查环境变量配置**
```bash
ssh root@8.211.149.80 "cat /opt/topfac/client/.env.production"
```

**预期输出：**
```env
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
TOPOLOGY_API_URL=
NODE_ENV=production
```

**2. 检查日志轮转配置**
```bash
ssh root@8.211.149.80 "cat /etc/logrotate.d/openresty"
```

**预期输出：**
```
/var/log/openresty/*.log {
    daily
    rotate 180
    ...
}
```

**3. 检查日志目录**
```bash
ssh root@8.211.149.80 "ls -la /var/log/openresty/ && ls -la /opt/topfac/logs/"
```

**4. 验证服务状态**
```bash
ssh root@8.211.149.80 "systemctl status topfac openresty"
```

---

## 📝 部署输出示例

```
=== TopFac 部署脚本 ===
目标服务器: 8.211.149.80
部署目录: /opt/topfac
域名: topfac.netc2c.com, topfac.nssa.io

[1/11] 检查SSH连接...
✓ SSH连接正常

[2/11] 安装OpenResty...
✓ OpenResty安装完成: 1.27.1.2

[3/11] 安装Node.js 20.x...
✓ Node.js安装完成: v20.19.5

[4/11] 创建部署目录...
✓ 部署目录已创建

[5/11] 上传代码...
✓ 代码上传完成

[6/11] 安装依赖并构建...
✓ 依赖安装和构建完成

[7/11] 配置systemd服务...
✓ systemd服务配置完成

[7.5/11] 配置环境变量...
创建生产环境配置文件...
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-NV6BCFPN7W
TOPOLOGY_API_URL=
NODE_ENV=production
环境变量配置完成
✓ 环境变量配置完成

[7.6/11] 配置日志系统...
OpenResty日志轮转配置完成
日志目录创建完成
✓ 日志系统配置完成

[8/11] 配置OpenResty...
✓ OpenResty配置完成

[9/11] 创建临时SSL证书并启动OpenResty...
✓ 临时SSL证书已创建，OpenResty已启动

=== 部署完成 ===
✓ TopFac已成功部署到服务器

当前状态：
  ✓ OpenResty已安装并运行
  ✓ TopFac应用已启动
  ✓ 临时SSL证书已配置
  ✓ 环境变量已配置（GA4 ID: G-NV6BCFPN7W）
  ✓ 日志系统已配置（OpenResty: 180天, Node.js: 10天）

访问地址：
  - http://8.211.149.80 (临时，使用自签名证书)
  - https://topfac.netc2c.com (DNS生效并申请SSL证书后)
  - https://topfac.nssa.io (DNS生效并申请SSL证书后)

验证命令：
  ssh root@8.211.149.80 'systemctl status openresty topfac'
  curl -k https://8.211.149.80/health

查看日志：
  ssh root@8.211.149.80 'tail -f /var/log/openresty/access.log'
  ssh root@8.211.149.80 'tail -f /opt/topfac/logs/$(date +%Y-%m-%d).log'

环境变量配置：
  配置文件: /opt/topfac/client/.env.production
  查看配置: ssh root@8.211.149.80 'cat /opt/topfac/client/.env.production'
  详细文档: docs/ENVIRONMENT_VARIABLES.md
```

---

## 🔍 故障排查

### 问题1：环境变量未生效

**症状：** GA4没有初始化

**检查步骤：**
```bash
# 1. 检查环境变量文件是否存在
ssh root@8.211.149.80 "ls -la /opt/topfac/client/.env.production"

# 2. 检查文件内容
ssh root@8.211.149.80 "cat /opt/topfac/client/.env.production"

# 3. 检查systemd服务配置
ssh root@8.211.149.80 "grep EnvironmentFile /etc/systemd/system/topfac.service"

# 4. 重启服务
ssh root@8.211.149.80 "systemctl daemon-reload && systemctl restart topfac"
```

### 问题2：日志轮转未工作

**症状：** 日志文件持续增长，没有轮转

**检查步骤：**
```bash
# 1. 检查logrotate配置
ssh root@8.211.149.80 "cat /etc/logrotate.d/openresty"

# 2. 测试logrotate配置
ssh root@8.211.149.80 "logrotate -d /etc/logrotate.d/openresty"

# 3. 手动执行logrotate
ssh root@8.211.149.80 "logrotate -f /etc/logrotate.d/openresty"

# 4. 检查日志文件
ssh root@8.211.149.80 "ls -lh /var/log/openresty/"
```

### 问题3：部署脚本执行失败

**症状：** 脚本在某个步骤失败

**解决方案：**
```bash
# 1. 检查SSH连接
ssh root@8.211.149.80 "echo 'SSH连接正常'"

# 2. 检查服务器磁盘空间
ssh root@8.211.149.80 "df -h"

# 3. 检查服务器内存
ssh root@8.211.149.80 "free -h"

# 4. 查看详细错误信息
# 脚本会在失败时自动退出并显示错误信息
```

---

## 📚 相关文档

- [环境变量配置指南](ENVIRONMENT_VARIABLES.md)
- [GA4环境变量迁移指南](GA4_ENV_VAR_MIGRATION.md)
- [日志查看指南](LOG_VIEWING_GUIDE.md)
- [部署总结](DEPLOYMENT_SUMMARY_20251003.md)

---

## 🎯 最佳实践

### 1. 部署前准备

- ✅ 确保服务器可以SSH访问
- ✅ 确保服务器有足够的磁盘空间（至少2GB）
- ✅ 确保服务器有足够的内存（至少512MB）
- ✅ 准备好域名和DNS配置

### 2. 部署后验证

- ✅ 检查所有服务状态
- ✅ 验证环境变量配置
- ✅ 验证日志轮转配置
- ✅ 测试网站访问
- ✅ 检查GA4数据收集

### 3. 安全建议

- ✅ 定期更新系统和依赖
- ✅ 配置防火墙规则
- ✅ 定期备份数据和配置
- ✅ 监控日志文件大小
- ✅ 定期检查SSL证书有效期

---

## 📞 支持

如有问题，请查看：
- 部署脚本源码：`deploy-to-new-server.sh`
- 环境变量文档：`docs/ENVIRONMENT_VARIABLES.md`
- 故障排查部分（本文档）

---

**脚本更新完成！** 🎉

现在部署脚本会自动配置环境变量和日志系统，让部署更加简单和可靠。

