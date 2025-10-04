#!/bin/bash
# 部署安全防护规则
# 1. 阻止无User-Agent的请求
# 2. 限制扫描器访问频率
# 3. 部署User-Agent分析脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器IP
SERVER=${1:-"8.211.149.80"}

echo -e "${GREEN}=== 部署安全防护规则 ===${NC}"
echo "目标服务器: $SERVER"
echo ""

# 步骤1: 备份现有配置
echo -e "${YELLOW}[1/6] 备份现有配置...${NC}"
ssh root@$SERVER "
    mkdir -p /root/nginx-backup/security-\$(date +%Y%m%d_%H%M%S)
    cp /usr/local/openresty/nginx/conf/nginx.conf /root/nginx-backup/security-\$(date +%Y%m%d_%H%M%S)/
    cp /usr/local/openresty/nginx/conf/sites-available/topfac /root/nginx-backup/security-\$(date +%Y%m%d_%H%M%S)/
    echo '✓ 配置已备份'
"

# 步骤2: 上传nginx.conf
echo -e "${YELLOW}[2/6] 上传nginx.conf（添加限流配置）...${NC}"
scp config/openresty/nginx.conf root@$SERVER:/usr/local/openresty/nginx/conf/nginx.conf
echo -e "${GREEN}✓ nginx.conf上传完成${NC}"

# 步骤3: 上传topfac配置
echo -e "${YELLOW}[3/6] 上传topfac配置（添加安全规则）...${NC}"
scp config/openresty/sites-available/topfac root@$SERVER:/usr/local/openresty/nginx/conf/sites-available/topfac
echo -e "${GREEN}✓ topfac配置上传完成${NC}"

# 步骤4: 上传分析脚本
echo -e "${YELLOW}[4/6] 上传User-Agent分析脚本...${NC}"
scp scripts/analyze-user-agent.sh root@$SERVER:/usr/local/bin/analyze-user-agent.sh
ssh root@$SERVER "chmod +x /usr/local/bin/analyze-user-agent.sh"
echo -e "${GREEN}✓ 分析脚本上传完成${NC}"

# 步骤5: 测试配置
echo -e "${YELLOW}[5/6] 测试Nginx配置...${NC}"
ssh root@$SERVER "
    /usr/local/openresty/nginx/sbin/nginx -t
"

# 步骤6: 重载Nginx
echo -e "${YELLOW}[6/6] 重载Nginx...${NC}"
ssh root@$SERVER "
    systemctl reload openresty || /usr/local/openresty/nginx/sbin/nginx -s reload
    echo '✓ Nginx已重载'
"

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo ""
echo "已启用的安全规则："
echo "  ✅ 阻止无User-Agent的请求（返回403）"
echo "  ✅ 阻止已知扫描器（zgrab、masscan、nmap等）"
echo "  ✅ 全局限流：每IP每秒50个请求"
echo "  ✅ API限流：每IP每秒10个请求"
echo ""
echo "验证步骤："
echo "1. 测试无User-Agent请求（应该被拒绝）："
echo "   curl -v https://topfac.nssa.io/"
echo ""
echo "2. 测试正常请求（应该成功）："
echo "   curl -A 'Mozilla/5.0' https://topfac.nssa.io/"
echo ""
echo "3. 运行User-Agent分析："
echo "   ssh root@$SERVER '/usr/local/bin/analyze-user-agent.sh'"
echo ""
echo "4. 查看被拒绝的请求："
echo "   ssh root@$SERVER 'grep \"status\":403 /var/log/openresty/json/access-\$(date +%Y%m%d).json | jq .'"
echo ""
echo "回滚方法："
echo "   ssh root@$SERVER 'cp /root/nginx-backup/security-YYYYMMDD_HHMMSS/nginx.conf /usr/local/openresty/nginx/conf/'"
echo "   ssh root@$SERVER 'cp /root/nginx-backup/security-YYYYMMDD_HHMMSS/topfac /usr/local/openresty/nginx/conf/sites-available/'"
echo "   ssh root@$SERVER 'systemctl reload openresty'"

