#!/bin/bash
# 测试JSON日志系统
# 使用方法: ./scripts/test-json-logger.sh [SERVER_IP]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务器IP
SERVER=${1:-"8.211.149.80"}
DOMAIN="topfac.nssa.io"

echo -e "${GREEN}=== 测试JSON日志系统 ===${NC}"
echo "目标服务器: $SERVER"
echo "域名: $DOMAIN"
echo ""

# 测试1: 检查Lua模块是否存在
echo -e "${YELLOW}[测试1] 检查Lua模块...${NC}"
ssh root@$SERVER "
    if [ -f /usr/local/openresty/lualib/custom/logger.lua ]; then
        echo '✓ logger.lua 存在'
    else
        echo '✗ logger.lua 不存在'
        exit 1
    fi
    
    if [ -f /usr/local/openresty/lualib/custom/log_buffer.lua ]; then
        echo '✓ log_buffer.lua 存在'
    else
        echo '✗ log_buffer.lua 不存在'
        exit 1
    fi
"

# 测试2: 检查日志目录
echo -e "${YELLOW}[测试2] 检查日志目录...${NC}"
ssh root@$SERVER "
    if [ -d /var/log/openresty/json ]; then
        echo '✓ JSON日志目录存在'
        ls -lh /var/log/openresty/json/ || echo '目录为空（正常）'
    else
        echo '✗ JSON日志目录不存在'
        exit 1
    fi
"

# 测试3: 检查Nginx配置
echo -e "${YELLOW}[测试3] 检查Nginx配置...${NC}"
ssh root@$SERVER "
    /usr/local/openresty/nginx/sbin/nginx -t
"

# 测试4: 发送测试请求
echo -e "${YELLOW}[测试4] 发送测试请求...${NC}"
echo "发送10个测试请求..."
for i in {1..10}; do
    curl -s -o /dev/null -w "请求 $i: HTTP %{http_code}\n" https://$DOMAIN/
    sleep 0.5
done

# 等待日志刷新
echo "等待5秒让日志刷新..."
sleep 5

# 测试5: 检查JSON日志文件
echo -e "${YELLOW}[测试5] 检查JSON日志文件...${NC}"
TODAY=$(date +%Y%m%d)
ssh root@$SERVER "
    LOG_FILE=/var/log/openresty/json/access-$TODAY.json
    
    if [ -f \$LOG_FILE ]; then
        echo '✓ JSON日志文件已创建: '\$LOG_FILE
        echo ''
        echo '文件大小:'
        ls -lh \$LOG_FILE
        echo ''
        echo '日志行数:'
        wc -l \$LOG_FILE
        echo ''
        echo '最新的3条日志:'
        tail -3 \$LOG_FILE
    else
        echo '✗ JSON日志文件不存在: '\$LOG_FILE
        echo ''
        echo '检查错误日志:'
        tail -20 /var/log/openresty/error.log | grep -i 'logger\|buffer' || echo '没有相关错误'
        exit 1
    fi
"

# 测试6: 验证JSON格式
echo -e "${YELLOW}[测试6] 验证JSON格式...${NC}"
ssh root@$SERVER "
    LOG_FILE=/var/log/openresty/json/access-$TODAY.json
    
    echo '验证JSON格式（使用jq）...'
    if command -v jq &> /dev/null; then
        if tail -1 \$LOG_FILE | jq . > /dev/null 2>&1; then
            echo '✓ JSON格式正确'
            echo ''
            echo '示例日志（格式化）:'
            tail -1 \$LOG_FILE | jq .
        else
            echo '✗ JSON格式错误'
            echo '最后一行内容:'
            tail -1 \$LOG_FILE
            exit 1
        fi
    else
        echo '⚠ jq未安装，跳过JSON格式验证'
        echo '安装jq: apt-get install -y jq'
    fi
"

# 测试7: 检查关键字段
echo -e "${YELLOW}[测试7] 检查关键字段...${NC}"
ssh root@$SERVER "
    LOG_FILE=/var/log/openresty/json/access-$TODAY.json
    
    if command -v jq &> /dev/null; then
        echo '检查必需字段...'
        LAST_LOG=\$(tail -1 \$LOG_FILE)
        
        # 检查关键字段
        FIELDS='timestamp remote_addr request_method request_uri status request_time'
        for field in \$FIELDS; do
            if echo \"\$LAST_LOG\" | jq -e \".\$field\" > /dev/null 2>&1; then
                VALUE=\$(echo \"\$LAST_LOG\" | jq -r \".\$field\")
                echo \"  ✓ \$field: \$VALUE\"
            else
                echo \"  ✗ \$field: 缺失\"
            fi
        done
    fi
"

# 测试8: 性能测试
echo -e "${YELLOW}[测试8] 性能测试...${NC}"
echo "发送100个并发请求..."
ab -n 100 -c 10 -q https://$DOMAIN/ > /dev/null 2>&1 || echo "⚠ ab命令未安装，跳过性能测试"

echo "等待5秒让日志刷新..."
sleep 5

ssh root@$SERVER "
    LOG_FILE=/var/log/openresty/json/access-$TODAY.json
    if [ -f \$LOG_FILE ]; then
        echo '当前日志行数:'
        wc -l \$LOG_FILE
    fi
"

# 测试9: 检查错误日志
echo -e "${YELLOW}[测试9] 检查错误日志...${NC}"
ssh root@$SERVER "
    echo '最近的错误日志（如果有）:'
    tail -20 /var/log/openresty/error.log | grep -i 'error\|failed' || echo '✓ 没有错误'
"

echo ""
echo -e "${GREEN}=== 测试完成 ===${NC}"
echo ""
echo "后续操作："
echo "1. 实时查看JSON日志："
echo "   ssh root@$SERVER 'tail -f /var/log/openresty/json/access-\$(date +%Y%m%d).json'"
echo ""
echo "2. 使用jq查询日志："
echo "   ssh root@$SERVER 'cat /var/log/openresty/json/access-\$(date +%Y%m%d).json | jq \"select(.status >= 400)\"'"
echo ""
echo "3. 统计状态码分布："
echo "   ssh root@$SERVER 'cat /var/log/openresty/json/access-\$(date +%Y%m%d).json | jq -r .status | sort | uniq -c'"
echo ""
echo "4. 查看慢请求（>1秒）："
echo "   ssh root@$SERVER 'cat /var/log/openresty/json/access-\$(date +%Y%m%d).json | jq \"select(.request_time > 1)\"'"

