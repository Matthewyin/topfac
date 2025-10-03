// TopFac 本地单机版 - 主服务器文件
// 基于 Hono.js + Node.js + JSON存储

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js'
import { securityHeaders, requestSizeLimit, sanitizeInput } from './middleware/security.js'
import logger from './utils/logger.js'

// 加载环境变量
dotenv.config()

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建 Hono 应用
const app = new Hono()

// 中间件配置
app.use('*', honoLogger())
app.use('*', requestLogger())
app.use('*', securityHeaders())
app.use('*', requestSizeLimit(10 * 1024 * 1024)) // 10MB限制
app.use('*', sanitizeInput())
app.use('*', errorHandler())
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:30010',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:30010',
    'https://8.216.32.61'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'TopFac Local',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000
  })
})

// 导入API路由
import apiRoutes from './routes/index.js'

// 挂载API路由
app.route('/api', apiRoutes)

// 静态文件服务 (服务前端构建文件)
app.use('/*', serveStatic({
  root: path.join(__dirname, '../dist')
}))

// SPA fallback - 所有非API、非静态文件的请求都返回 index.html
app.get('*', async (c) => {
  const requestPath = c.req.path

  // 如果是API请求，跳过
  if (requestPath.startsWith('/api/') || requestPath === '/health') {
    return c.notFound()
  }

  // 检查是否是静态文件请求
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.json']
  const hasStaticExtension = staticExtensions.some(ext => requestPath.endsWith(ext))

  if (hasStaticExtension) {
    return c.notFound()
  }

  // 对于所有其他请求（SPA路由），返回 index.html
  try {
    const indexPath = path.join(__dirname, '../dist/index.html')
    const fs = await import('fs/promises')
    const html = await fs.readFile(indexPath, 'utf-8')
    return c.html(html)
  } catch (error) {
    logger.error('读取 index.html 失败', { error: error.message })
    return c.notFound()
  }
})

// 404 处理
app.notFound(notFoundHandler)

// 启动服务器
const port = parseInt(process.env.PORT || '3000')

logger.info('TopFac 本地版启动中...')
logger.info(`端口: ${port}`)
logger.info(`访问地址: http://localhost:${port}`)
logger.info(`健康检查: http://localhost:${port}/health`)
logger.info(`API状态: http://localhost:${port}/api/status`)

// 启动日志清理任务（保留10天）
logger.startCleanupSchedule()

// 定期清理旧备份（保留7天）
setInterval(async () => {
  try {
    const { db } = await import('./database/index.js')
    await db.cleanupOldBackups(7)
  } catch (error) {
    logger.error('清理备份任务失败', { error: error.message })
  }
}, 24 * 60 * 60 * 1000) // 每24小时执行一次

serve({
  fetch: app.fetch,
  port: port
})
