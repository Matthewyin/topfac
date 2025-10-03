#!/bin/bash

# TopFac日志配置脚本
# 配置OpenResty日志轮转（保留180天）
# 
# 使用方法：
# chmod +x scripts/setup-logging.sh
# sudo ./scripts/setup-logging.sh

set -e

echo "========================================="
echo "TopFac 日志配置脚本"
echo "========================================="
echo ""

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 错误：请使用sudo运行此脚本"
    echo "   sudo ./scripts/setup-logging.sh"
    exit 1
fi

echo "📋 配置内容："
echo "  - OpenResty访问日志：保留180天"
echo "  - Node.js应用日志：保留10天（代码中已配置）"
echo ""

# 1. 配置OpenResty日志轮转
echo "1️⃣  配置OpenResty日志轮转..."

# 检查logrotate是否安装
if ! command -v logrotate &> /dev/null; then
    echo "   安装logrotate..."
    apt-get update
    apt-get install -y logrotate
fi

# 复制配置文件
if [ -f "config/logrotate-openresty.conf" ]; then
    echo "   复制配置文件到 /etc/logrotate.d/openresty"
    cp config/logrotate-openresty.conf /etc/logrotate.d/openresty
    chmod 644 /etc/logrotate.d/openresty
    echo "   ✅ OpenResty日志轮转配置完成"
else
    echo "   ⚠️  警告：找不到 config/logrotate-openresty.conf"
    echo "   手动创建配置文件..."
    
    cat > /etc/logrotate.d/openresty << 'EOF'
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
            kill -USR1 `cat /var/run/openresty.pid`
        fi
    endscript
    dateext
    dateformat -%Y%m%d
    maxsize 100M
}
EOF
    
    chmod 644 /etc/logrotate.d/openresty
    echo "   ✅ OpenResty日志轮转配置完成（手动创建）"
fi

# 2. 测试logrotate配置
echo ""
echo "2️⃣  测试logrotate配置..."
if logrotate -d /etc/logrotate.d/openresty 2>&1 | grep -qi "error:"; then
    echo "   ❌ 配置测试失败"
    logrotate -d /etc/logrotate.d/openresty
    exit 1
else
    echo "   ✅ 配置测试通过"
fi

# 3. 确保日志目录存在
echo ""
echo "3️⃣  检查日志目录..."

if [ ! -d "/var/log/openresty" ]; then
    echo "   创建 /var/log/openresty 目录"
    mkdir -p /var/log/openresty
    chown www-data:adm /var/log/openresty
    chmod 755 /var/log/openresty
fi

if [ ! -d "/opt/topfac/logs" ]; then
    echo "   创建 /opt/topfac/logs 目录"
    mkdir -p /opt/topfac/logs
    chown topfac:topfac /opt/topfac/logs 2>/dev/null || chown $SUDO_USER:$SUDO_USER /opt/topfac/logs
    chmod 755 /opt/topfac/logs
fi

echo "   ✅ 日志目录检查完成"

# 4. 显示当前日志文件
echo ""
echo "4️⃣  当前日志文件："
echo ""
echo "   OpenResty日志："
if [ -d "/var/log/openresty" ]; then
    ls -lh /var/log/openresty/ 2>/dev/null || echo "   （暂无日志文件）"
else
    echo "   （目录不存在）"
fi

echo ""
echo "   Node.js应用日志："
if [ -d "/opt/topfac/logs" ]; then
    ls -lh /opt/topfac/logs/ 2>/dev/null || echo "   （暂无日志文件）"
else
    echo "   （目录不存在）"
fi

# 5. 显示配置摘要
echo ""
echo "========================================="
echo "✅ 日志配置完成"
echo "========================================="
echo ""
echo "📊 配置摘要："
echo ""
echo "  OpenResty访问日志："
echo "    - 位置：/var/log/openresty/"
echo "    - 保留期限：180天"
echo "    - 轮转频率：每天"
echo "    - 压缩：是（延迟1天）"
echo "    - 单文件大小限制：100MB"
echo ""
echo "  Node.js应用日志："
echo "    - 位置：/opt/topfac/logs/"
echo "    - 保留期限：10天"
echo "    - 轮转频率：每天（自动）"
echo "    - 格式：YYYY-MM-DD.log"
echo ""
echo "🔧 管理命令："
echo ""
echo "  查看OpenResty日志："
echo "    sudo tail -f /var/log/openresty/access.log"
echo "    sudo tail -f /var/log/openresty/error.log"
echo ""
echo "  查看Node.js日志："
echo "    tail -f /opt/topfac/logs/\$(date +%Y-%m-%d).log"
echo ""
echo "  手动执行日志轮转："
echo "    sudo logrotate -f /etc/logrotate.d/openresty"
echo ""
echo "  查看日志轮转状态："
echo "    sudo cat /var/lib/logrotate/status | grep openresty"
echo ""
echo "  查看日志磁盘占用："
echo "    du -sh /var/log/openresty/"
echo "    du -sh /opt/topfac/logs/"
echo ""
echo "========================================="

