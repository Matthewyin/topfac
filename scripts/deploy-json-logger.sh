#!/bin/bash
# 部署JSON日志系统到OpenResty
# 使用方法: ./scripts/deploy-json-logger.sh [SERVER_IP]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器IP
SERVER=${1:-"8.211.149.80"}

echo -e "${GREEN}=== 部署JSON日志系统 ===${NC}"
echo "目标服务器: $SERVER"
echo ""

# 步骤1: 备份现有配置
echo -e "${YELLOW}[1/7] 备份现有配置...${NC}"
ssh root@$SERVER "
    mkdir -p /root/nginx-backup/\$(date +%Y%m%d_%H%M%S)
    cp /usr/local/openresty/nginx/conf/nginx.conf /root/nginx-backup/\$(date +%Y%m%d_%H%M%S)/
    cp /usr/local/openresty/nginx/conf/sites-available/topfac /root/nginx-backup/\$(date +%Y%m%d_%H%M%S)/
    echo '✓ 配置已备份到 /root/nginx-backup/\$(date +%Y%m%d_%H%M%S)/'
"

# 步骤2: 创建Lua模块目录
echo -e "${YELLOW}[2/7] 创建Lua模块目录...${NC}"
ssh root@$SERVER "
    mkdir -p /usr/local/openresty/lualib/custom
    mkdir -p /var/log/openresty/json
    chown -R www-data:www-data /var/log/openresty/json
    chmod 755 /var/log/openresty/json
    echo '✓ 目录创建完成（权限已设置）'
"

# 步骤3: 上传Lua模块
echo -e "${YELLOW}[3/7] 上传Lua模块...${NC}"
scp config/openresty/lua/logger.lua root@$SERVER:/usr/local/openresty/lualib/custom/
scp config/openresty/lua/log_buffer.lua root@$SERVER:/usr/local/openresty/lualib/custom/
echo -e "${GREEN}✓ Lua模块上传完成${NC}"

# 步骤4: 上传nginx.conf
echo -e "${YELLOW}[4/7] 上传nginx.conf...${NC}"
scp config/openresty/nginx.conf root@$SERVER:/usr/local/openresty/nginx/conf/nginx.conf
echo -e "${GREEN}✓ nginx.conf上传完成${NC}"

# 步骤5: 上传topfac站点配置
echo -e "${YELLOW}[5/7] 上传topfac站点配置...${NC}"
scp config/openresty/sites-available/topfac root@$SERVER:/usr/local/openresty/nginx/conf/sites-available/topfac
echo -e "${GREEN}✓ topfac配置上传完成${NC}"

# 步骤6: 测试配置
echo -e "${YELLOW}[6/7] 测试Nginx配置...${NC}"
ssh root@$SERVER "
    /usr/local/openresty/nginx/sbin/nginx -t
"

# 步骤7: 重载Nginx
echo -e "${YELLOW}[7/7] 重载Nginx...${NC}"
ssh root@$SERVER "
    systemctl reload openresty || /usr/local/openresty/nginx/sbin/nginx -s reload
    echo '✓ Nginx已重载'
"

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo ""
echo "验证步骤："
echo "1. 访问网站触发几个请求"
echo "2. 检查JSON日志文件："
echo "   ssh root@$SERVER 'ls -lh /var/log/openresty/json/'"
echo "3. 查看日志内容："
echo "   ssh root@$SERVER 'tail -f /var/log/openresty/json/access-\$(date +%Y%m%d).json'"
echo "4. 检查错误日志："
echo "   ssh root@$SERVER 'tail -f /var/log/openresty/error.log'"
echo ""
echo "回滚方法："
echo "   ssh root@$SERVER 'cp /root/nginx-backup/YYYYMMDD_HHMMSS/nginx.conf /usr/local/openresty/nginx/conf/'"
echo "   ssh root@$SERVER 'cp /root/nginx-backup/YYYYMMDD_HHMMSS/topfac /usr/local/openresty/nginx/conf/sites-available/'"
echo "   ssh root@$SERVER 'systemctl reload openresty'"

