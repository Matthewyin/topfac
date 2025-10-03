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

# 步骤2: 安装OpenResty
echo -e "${YELLOW}[2/10] 安装OpenResty...${NC}"
ssh $SERVER "apt update && apt install -y git curl wget gnupg ca-certificates lsb-release && \
    wget -O - https://openresty.org/package/pubkey.gpg | gpg --dearmor -o /usr/share/keyrings/openresty.gpg && \
    echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/openresty.gpg] http://openresty.org/package/ubuntu \$(lsb_release -sc) main\" | tee /etc/apt/sources.list.d/openresty.list && \
    apt update && apt install -y openresty openresty-opm openresty-resty"
OPENRESTY_VERSION=$(ssh $SERVER "/usr/local/openresty/nginx/sbin/nginx -v 2>&1 | grep -oP 'openresty/\K[0-9.]+'" || echo "已安装")
echo -e "${GREEN}✓ OpenResty安装完成: $OPENRESTY_VERSION${NC}"

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

# 配置OpenResty服务
ssh $SERVER "cat > /etc/systemd/system/openresty.service << 'EOF'
[Unit]
Description=OpenResty - High Performance Web Server
Documentation=https://openresty.org/
After=network.target remote-fs.target nss-lookup.target

[Service]
Type=forking
PIDFile=/var/run/openresty.pid
ExecStartPre=/usr/local/openresty/nginx/sbin/nginx -t -c /usr/local/openresty/nginx/conf/nginx.conf
ExecStart=/usr/local/openresty/nginx/sbin/nginx -c /usr/local/openresty/nginx/conf/nginx.conf
ExecReload=/bin/kill -s HUP \\\$MAINPID
ExecStop=/bin/kill -s QUIT \\\$MAINPID
PrivateTmp=true
Restart=on-failure
RestartSec=5s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF
"

# 配置TopFac服务
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
# Google Analytics 4 配置（从环境变量文件读取）
EnvironmentFile=-$DEPLOY_DIR/client/.env.production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable topfac openresty && systemctl start topfac"
echo -e "${GREEN}✓ systemd服务配置完成${NC}"

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
            kill -USR1 \\\`cat /var/run/openresty.pid\\\`
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

# 步骤8: 配置OpenResty
echo -e "${YELLOW}[8/11] 配置OpenResty...${NC}"

# 创建配置目录结构
ssh $SERVER "mkdir -p /usr/local/openresty/nginx/conf/sites-available /usr/local/openresty/nginx/conf/sites-enabled /var/log/openresty /var/www/html"

# 更新主配置文件以包含sites-enabled
ssh $SERVER "grep -q 'sites-enabled' /usr/local/openresty/nginx/conf/nginx.conf || \
    sed -i '/http {/a\    include /usr/local/openresty/nginx/conf/sites-enabled/*;' /usr/local/openresty/nginx/conf/nginx.conf"

# 创建站点配置文件
ssh $SERVER "cat > /usr/local/openresty/nginx/conf/sites-available/topfac << 'EOFNGINX'
# HTTP配置
server {
    listen 80;
    server_name $DOMAIN1 $DOMAIN2;

    # Let's Encrypt验证路径（优先级最高）
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # 其他请求重定向到HTTPS
    location / {
        return 301 https://\\\$server_name\\\$request_uri;
    }
}

# HTTPS配置
server {
    listen 443 ssl;
    http2 on;
    server_name $DOMAIN1 $DOMAIN2;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection \"1; mode=block\" always;

    # API代理
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

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:30010;
        access_log off;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\\\$ {
        proxy_pass http://127.0.0.1:30010;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # SPA路由支持
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
ln -sf /usr/local/openresty/nginx/conf/sites-available/topfac /usr/local/openresty/nginx/conf/sites-enabled/"
echo -e "${GREEN}✓ OpenResty配置完成${NC}"

# 步骤9: 创建临时SSL证书并启动OpenResty
echo -e "${YELLOW}[9/11] 创建临时SSL证书...${NC}"
ssh $SERVER "mkdir -p /etc/ssl/topfac && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/topfac/topfac.key \
    -out /etc/ssl/topfac/topfac.crt \
    -subj '/CN=$DOMAIN1' && \
    sed -i '/server_name $DOMAIN1 $DOMAIN2;/a\    ssl_certificate /etc/ssl/topfac/topfac.crt;\n    ssl_certificate_key /etc/ssl/topfac/topfac.key;' /usr/local/openresty/nginx/conf/sites-available/topfac && \
    /usr/local/openresty/nginx/sbin/nginx -t && systemctl start openresty"
echo -e "${GREEN}✓ 临时SSL证书已创建，OpenResty已启动${NC}"

# 步骤10: 提示用户配置DNS和SSL证书
echo ""
echo -e "${YELLOW}=== 部署完成 ===${NC}"
echo -e "${GREEN}✓ TopFac已成功部署到服务器${NC}"
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
echo "4. DNS生效后，运行以下命令申请Let's Encrypt SSL证书："
echo ""
echo -e "${GREEN}ssh $SERVER << 'EOFSSL'
# 安装Certbot
apt install -y certbot

# 申请SSL证书（使用webroot模式）
certbot certonly --webroot -w /var/www/html \\
  -d $DOMAIN1 -d $DOMAIN2 \\
  --non-interactive --agree-tos --email $EMAIL

# 更新OpenResty配置使用正式证书
sed -i 's|/etc/ssl/topfac/topfac.crt|/etc/letsencrypt/live/$DOMAIN1/fullchain.pem|g' /usr/local/openresty/nginx/conf/sites-available/topfac
sed -i 's|/etc/ssl/topfac/topfac.key|/etc/letsencrypt/live/$DOMAIN1/privkey.pem|g' /usr/local/openresty/nginx/conf/sites-available/topfac

# 创建续期钩子
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-openresty.sh << 'EOFHOOK'
#!/bin/bash
systemctl reload openresty
logger \"Certbot renewed certificate, OpenResty reloaded\"
EOFHOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-openresty.sh

# 测试配置并重载OpenResty
/usr/local/openresty/nginx/sbin/nginx -t && systemctl reload openresty

# 测试自动续期
certbot renew --dry-run

echo \"SSL证书申请成功！\"
EOFSSL
${NC}"
echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo ""
echo "当前状态："
echo "  ✓ OpenResty已安装并运行"
echo "  ✓ TopFac应用已启动"
echo "  ✓ 临时SSL证书已配置"
echo ""
echo "访问地址："
echo "  - http://$SERVER_IP (临时，使用自签名证书)"
echo "  - https://$DOMAIN1 (DNS生效并申请SSL证书后)"
echo "  - https://$DOMAIN2 (DNS生效并申请SSL证书后)"
echo ""
echo "验证命令："
echo "  ssh $SERVER 'systemctl status openresty topfac'"
echo "  curl -k https://$SERVER_IP/health"

