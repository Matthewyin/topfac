# TopFac 本地版 Docker 镜像
# 基于 Node.js 20 Alpine 镜像

FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# 复制 package.json 文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安装依赖
RUN npm install --omit=dev --cache /tmp/npm-cache && \
    cd client && npm install --omit=dev --cache /tmp/npm-cache && \
    rm -rf /tmp/npm-cache

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 创建数据和日志目录
RUN mkdir -p data logs && \
    chown -R node:node /app

# 切换到非root用户
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["npm", "run", "start:prod"]
