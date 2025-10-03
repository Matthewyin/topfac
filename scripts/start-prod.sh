#!/bin/bash
# TopFac 生产环境启动脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TopFac 生产环境启动${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查环境
if [ ! -f ".env" ]; then
    echo -e "${RED}错误: 未找到 .env 文件${NC}"
    echo -e "${YELLOW}请从 .env.example 复制并配置环境变量${NC}"
    exit 1
fi

# 检查前端构建文件
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo -e "${YELLOW}未找到前端构建文件，正在构建...${NC}"
    npm run build
fi

# 设置生产环境变量
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=512"

# 加载环境变量
source .env

echo -e "${GREEN}✓ 环境检查完成${NC}"
echo ""

# 启动服务器
echo -e "${BLUE}启动生产服务器...${NC}"
echo -e "${YELLOW}端口: ${PORT:-3000}${NC}"
echo ""

node server/index.js

