#!/bin/bash

# TopFac 本地版一键部署脚本
# 支持 Docker 容器化部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
IMAGE_NAME="topfac-local"
CONTAINER_NAME="topfac-app"
HOST_PORT="30010"
CONTAINER_PORT="3000"
DATA_DIR="$(pwd)/data"
LOGS_DIR="$(pwd)/logs"
ENV_FILE="$(pwd)/.env"

# 函数：打印彩色消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 函数：检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "❌ Docker 未安装，请先安装 Docker" $RED
        exit 1
    fi
    print_message "✅ Docker 已安装" $GREEN
}

# 函数：停止并删除旧容器
cleanup_old_container() {
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_message "🛑 停止旧容器..." $YELLOW
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
        print_message "✅ 旧容器已清理" $GREEN
    fi
}

# 函数：构建 Docker 镜像
build_image() {
    print_message "🔨 构建 Docker 镜像..." $BLUE
    docker build -t $IMAGE_NAME .
    print_message "✅ 镜像构建完成" $GREEN
}

# 函数：创建必要的目录
create_directories() {
    print_message "📁 创建数据目录..." $BLUE
    mkdir -p "$DATA_DIR" "$LOGS_DIR"
    print_message "✅ 目录创建完成" $GREEN
}

# 函数：创建环境变量文件
create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_message "📝 创建环境变量文件..." $BLUE
        cat > "$ENV_FILE" << EOF
# TopFac 本地版环境配置
NODE_ENV=production
PORT=3000

# 数据存储配置
DATA_DIR=/app/data
BACKUP_DIR=/app/data/backups
LOG_DIR=/app/logs

# AI 服务配置
DEFAULT_AI_PROVIDER=gemini
GEMINI_API_KEY=
DEEPSEEK_API_KEY=

# 缓存配置
ENABLE_CACHE=true
CACHE_TTL=3600
EOF
        print_message "✅ 环境变量文件已创建: $ENV_FILE" $GREEN
        print_message "⚠️  请编辑 .env 文件配置 AI API 密钥" $YELLOW
    else
        print_message "✅ 环境变量文件已存在" $GREEN
    fi
}

# 函数：启动容器
start_container() {
    print_message "🚀 启动容器..." $BLUE
    
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $HOST_PORT:$CONTAINER_PORT \
        -v "$DATA_DIR:/app/data" \
        -v "$LOGS_DIR:/app/logs" \
        -v "$ENV_FILE:/app/.env" \
        $IMAGE_NAME
    
    print_message "✅ 容器启动成功" $GREEN
}

# 函数：等待服务启动
wait_for_service() {
    print_message "⏳ 等待服务启动..." $YELLOW
    
    for i in {1..30}; do
        if curl -s http://localhost:$HOST_PORT/health > /dev/null; then
            print_message "✅ 服务启动成功！" $GREEN
            return 0
        fi
        sleep 2
        echo -n "."
    done
    
    print_message "❌ 服务启动超时" $RED
    return 1
}

# 函数：显示部署信息
show_deployment_info() {
    print_message "\n🎉 部署完成！" $GREEN
    print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $BLUE
    print_message "📱 应用访问地址: http://localhost:$HOST_PORT" $BLUE
    print_message "🔍 健康检查: http://localhost:$HOST_PORT/health" $BLUE
    print_message "📊 API 状态: http://localhost:$HOST_PORT/api/status" $BLUE
    print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $BLUE
    print_message "📁 数据目录: $DATA_DIR" $BLUE
    print_message "📄 日志目录: $LOGS_DIR" $BLUE
    print_message "⚙️  配置文件: $ENV_FILE" $BLUE
    print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $BLUE
    print_message "🐳 容器名称: $CONTAINER_NAME" $BLUE
    print_message "📦 镜像名称: $IMAGE_NAME" $BLUE
    print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $BLUE
    print_message "\n常用命令:" $YELLOW
    print_message "  查看日志: docker logs -f $CONTAINER_NAME" $NC
    print_message "  停止服务: docker stop $CONTAINER_NAME" $NC
    print_message "  重启服务: docker restart $CONTAINER_NAME" $NC
    print_message "  删除容器: docker rm -f $CONTAINER_NAME" $NC
}

# 主函数
main() {
    print_message "🚀 TopFac 本地版部署开始..." $GREEN
    print_message "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $BLUE
    
    check_docker
    cleanup_old_container
    create_directories
    create_env_file
    build_image
    start_container
    
    if wait_for_service; then
        show_deployment_info
    else
        print_message "❌ 部署失败，请检查日志: docker logs $CONTAINER_NAME" $RED
        exit 1
    fi
}

# 执行主函数
main "$@"
