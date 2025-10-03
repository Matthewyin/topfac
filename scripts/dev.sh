#!/bin/bash
# TopFac 开发环境启动脚本
# 并行启动前后端服务，支持热重载

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TopFac 开发环境启动${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}错误: 需要 Node.js 18 或更高版本${NC}"
    echo -e "${YELLOW}当前版本: $(node -v)${NC}"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}检测到未安装依赖，正在安装...${NC}"
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}检测到前端依赖未安装，正在安装...${NC}"
    cd client && npm install && cd ..
fi

# 创建必要的目录
mkdir -p data logs dist

# 设置环境变量
export NODE_ENV=development
export PORT=3000
export LOG_LEVEL=DEBUG

echo -e "${GREEN}✓ 环境检查完成${NC}"
echo ""

# 清理旧的进程
cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    echo -e "${GREEN}✓ 服务已停止${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动后端服务
echo -e "${BLUE}启动后端服务 (端口 3000)...${NC}"
(
    cd server
    node --watch index.js 2>&1 | sed "s/^/[${GREEN}后端${NC}] /"
) &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${RED}✗ 后端启动失败${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✓ 后端服务已启动${NC}"
echo ""

# 启动前端开发服务器
echo -e "${BLUE}启动前端开发服务器 (端口 30100)...${NC}"
(
    cd client
    npm run dev 2>&1 | sed "s/^/[${BLUE}前端${NC}] /"
) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  开发环境已启动${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}后端服务:${NC}"
echo -e "  - API地址: ${BLUE}http://localhost:3000${NC}"
echo -e "  - 健康检查: ${BLUE}http://localhost:3000/health${NC}"
echo -e "  - API状态: ${BLUE}http://localhost:3000/api/status${NC}"
echo ""
echo -e "${YELLOW}前端服务:${NC}"
echo -e "  - 开发地址: ${BLUE}http://localhost:30100${NC}"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo -e "  - 代码修改会自动重载"
echo -e "  - 按 ${RED}Ctrl+C${NC} 停止所有服务"
echo ""

# 等待进程
wait

