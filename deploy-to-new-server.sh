#!/bin/bash
# TopFac 部署脚本 - 部署到新服务器
# 使用方法: ./deploy-to-new-server.sh <服务器IP>

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供服务器IP地址${NC}"
    echo "使用方法: $0 <服务器IP>"
    echo "示例: $0 8.211.149.80"
    exit 1
fi

SERVER_IP=$1
SERVER="root@$SERVER_IP"
DEPLOY_DIR="/opt/topfac"
DOMAIN1="topfac.netc2c.com"
DOMAIN2="topfac.nssa.io"
EMAIL="2738550@qq.com"

echo -e "${GREEN}=== TopFac 部署脚本 ===${NC}"
echo "目标服务器: $SERVER_IP"
echo "部署目录: $DEPLOY_DIR"
echo "域名: $DOMAIN1, $DOMAIN2"
echo ""

# 步骤1: 检查SSH连接
echo -e "${YELLOW}[1/10] 检查SSH连接...${NC}"
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'SSH连接成功'" > /dev/null 2>&1; then
    echo -e "${RED}错误: 无法连接到服务器 $SERVER_IP${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSH连接正常${NC}"

# 步骤2: 安装必要软件
echo -e "${YELLOW}[2/10] 安装必要软件...${NC}"
ssh $SERVER "apt update && apt install -y nginx git curl"
echo -e "${GREEN}✓ Nginx和Git安装完成${NC}"

# 步骤3: 安装Node.js
echo -e "${YELLOW}[3/10] 安装Node.js 20.x...${NC}"
ssh $SERVER "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs"
NODE_VERSION=$(ssh $SERVER "node --version")
echo -e "${GREEN}✓ Node.js安装完成: $NODE_VERSION${NC}"

# 步骤4: 创建部署目录
echo -e "${YELLOW}[4/10] 创建部署目录...${NC}"
ssh $SERVER "mkdir -p $DEPLOY_DIR/data $DEPLOY_DIR/logs"
echo -e "${GREEN}✓ 部署目录已创建${NC}"

# 步骤5: 上传代码
echo -e "${YELLOW}[5/10] 上传代码...${NC}"
rsync -avz --exclude='node_modules' --exclude='client/node_modules' \
    --exclude='client/.nuxt' --exclude='client/.output' \
    --exclude='dist' --exclude='data' --exclude='logs' --exclude='.git' \
    ./ $SERVER:$DEPLOY_DIR/
echo -e "${GREEN}✓ 代码上传完成${NC}"

# 步骤6: 安装依赖并构建
echo -e "${YELLOW}[6/10] 安装依赖并构建...${NC}"
ssh $SERVER "cd $DEPLOY_DIR && npm install && cd client && npm install && cd .. && npm run build"
echo -e "${GREEN}✓ 依赖安装和构建完成${NC}"

# 步骤7: 配置systemd服务
echo -e "${YELLOW}[7/10] 配置systemd服务...${NC}"
ssh $SERVER "cat > /etc/systemd/system/topfac.service << 'EOF'
[Unit]
Description=TopFac - 智能网络拓扑生成系统
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR
Environment=NODE_ENV=production
Environment=PORT=30010
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable topfac && systemctl start topfac"
echo -e "${GREEN}✓ systemd服务配置完成${NC}"

# 步骤8: 配置Nginx
echo -e "${YELLOW}[8/10] 配置Nginx...${NC}"
ssh $SERVER "cat > /etc/nginx/sites-available/topfac << 'EOFNGINX'
server {
    listen 80;
    server_name $DOMAIN1 $DOMAIN2;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\\\$server_name\\\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN1 $DOMAIN2;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    location /api/ {
        proxy_pass http://127.0.0.1:30010;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:30010;
        access_log off;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\\\$ {
        proxy_pass http://127.0.0.1:30010;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
    
    location / {
        proxy_pass http://127.0.0.1:30010;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
    }
}
EOFNGINX
ln -sf /etc/nginx/sites-available/topfac /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default"
echo -e "${GREEN}✓ Nginx配置完成${NC}"

# 步骤9: 创建临时SSL证书并启动Nginx
echo -e "${YELLOW}[9/10] 创建临时SSL证书...${NC}"
ssh $SERVER "mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/topfac.key \
    -out /etc/nginx/ssl/topfac.crt \
    -subj '/CN=$DOMAIN1' && \
    sed -i '23i\    ssl_certificate /etc/nginx/ssl/topfac.crt;' /etc/nginx/sites-available/topfac && \
    sed -i '24i\    ssl_certificate_key /etc/nginx/ssl/topfac.key;' /etc/nginx/sites-available/topfac && \
    nginx -t && systemctl reload nginx"
echo -e "${GREEN}✓ 临时SSL证书已创建，Nginx已启动${NC}"

# 步骤10: 提示用户配置DNS
echo ""
echo -e "${YELLOW}=== 重要提示 ===${NC}"
echo -e "${RED}请先完成以下操作，然后运行SSL证书申请命令：${NC}"
echo ""
echo "1. 更新DNS记录："
echo "   $DOMAIN1  →  A记录  →  $SERVER_IP"
echo "   $DOMAIN2  →  A记录  →  $SERVER_IP"
echo ""
echo "2. 开启云服务器安全组："
echo "   - 开放80端口（HTTP）"
echo "   - 开放443端口（HTTPS）"
echo ""
echo "3. 等待DNS生效（1-5分钟），验证："
echo "   nslookup $DOMAIN1 8.8.8.8"
echo "   nslookup $DOMAIN2 8.8.8.8"
echo ""
echo "4. DNS生效后，运行以下命令申请SSL证书："
echo -e "${GREEN}   ssh $SERVER \"apt install -y certbot python3-certbot-nginx && certbot --nginx -d $DOMAIN1 -d $DOMAIN2 --non-interactive --agree-tos --email $EMAIL --redirect\"${NC}"
echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo "访问地址："
echo "  - http://$SERVER_IP (临时，使用自签名证书)"
echo "  - https://$DOMAIN1 (DNS生效并申请SSL证书后)"
echo "  - https://$DOMAIN2 (DNS生效并申请SSL证书后)"

