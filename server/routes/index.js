// API 路由入口文件
import { Hono } from 'hono'
import projectRoutes from './projects.js'
import versionRoutes from './versions.js'
import aiRoutes from './ai.js'
import parseRoutes from './parse.js'
import generateRoutes from './generate.js'

const api = new Hono()

// 系统状态路由
api.get('/status', async (c) => {
  try {
    return c.json({
      success: true,
      data: {
        service_info: {
          name: 'topfac-local',
          version: '1.0.0',
          port: process.env.PORT || 3000,
          processing_mode: 'local'
        },
        database: {
          connected: true,
          type: 'json-files',
          engine: 'filesystem'
        },
        project_statistics: {
          total: 0, // 将在实现时更新
          active: 0,
          archived: 0,
          deleted: 0
        },
        text_parser: {
          status: 'ready',
          max_text_length: 50000
        },
        ai_services: {
          available_providers: ['gemini', 'deepseek'],
          default_provider: process.env.DEFAULT_AI_PROVIDER || 'gemini'
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Status check error:', error)
    return c.json({
      success: false,
      error: 'Status check failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// 挂载子路由
api.route('/projects', projectRoutes)
api.route('/versions', versionRoutes)
api.route('/ai', aiRoutes)
api.route('/parse', parseRoutes)
api.route('/generate', generateRoutes)

export default api
