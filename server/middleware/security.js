/**
 * 安全中间件
 * 提供基本的安全防护
 */

import logger from '../utils/logger.js'
import { APIError } from './errorHandler.js'

/**
 * 请求速率限制
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, // 时间窗口（默认1分钟）
    max = 100, // 最大请求数
    message = '请求过于频繁，请稍后再试'
  } = options

  const requests = new Map()

  return async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const key = `${ip}:${c.req.path}`
    
    const now = Date.now()
    const record = requests.get(key) || { count: 0, resetTime: now + windowMs }

    // 重置计数器
    if (now > record.resetTime) {
      record.count = 0
      record.resetTime = now + windowMs
    }

    record.count++
    requests.set(key, record)

    // 检查是否超过限制
    if (record.count > max) {
      logger.warn('请求速率超限', { ip, path: c.req.path, count: record.count })
      throw new APIError(message, 429, 'RATE_LIMIT_EXCEEDED')
    }

    await next()
  }
}

/**
 * 请求大小限制
 */
export function requestSizeLimit(maxSize = 10 * 1024 * 1024) { // 默认10MB
  return async (c, next) => {
    const contentLength = parseInt(c.req.header('content-length') || '0')
    
    if (contentLength > maxSize) {
      logger.warn('请求体过大', { 
        contentLength, 
        maxSize,
        path: c.req.path 
      })
      throw new APIError(
        `请求体过大，最大允许 ${maxSize / 1024 / 1024}MB`,
        413,
        'REQUEST_TOO_LARGE'
      )
    }

    await next()
  }
}

/**
 * 安全头设置
 */
export function securityHeaders() {
  return async (c, next) => {
    await next()

    // 设置安全响应头
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('X-XSS-Protection', '1; mode=block')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // 仅在生产环境启用 HSTS
    if (process.env.NODE_ENV === 'production') {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
  }
}

/**
 * 输入清理
 */
export function sanitizeInput() {
  return async (c, next) => {
    try {
      const contentType = c.req.header('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        const body = await c.req.json()
        
        // 递归清理对象中的字符串
        const sanitize = (obj) => {
          if (typeof obj === 'string') {
            // 移除潜在的XSS攻击代码
            return obj
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
          }
          
          if (Array.isArray(obj)) {
            return obj.map(sanitize)
          }
          
          if (obj && typeof obj === 'object') {
            const cleaned = {}
            for (const [key, value] of Object.entries(obj)) {
              cleaned[key] = sanitize(value)
            }
            return cleaned
          }
          
          return obj
        }
        
        // 将清理后的数据重新注入请求
        c.req.sanitizedBody = sanitize(body)
      }
    } catch (error) {
      logger.error('输入清理失败', { error: error.message })
    }
    
    await next()
  }
}

/**
 * API密钥验证（可选）
 */
export function apiKeyAuth(options = {}) {
  const {
    header = 'x-api-key',
    required = false
  } = options

  return async (c, next) => {
    const apiKey = c.req.header(header)
    const validApiKey = process.env.API_KEY

    // 如果配置了API密钥且要求验证
    if (validApiKey && required) {
      if (!apiKey) {
        throw new APIError('缺少API密钥', 401, 'MISSING_API_KEY')
      }

      if (apiKey !== validApiKey) {
        logger.warn('无效的API密钥', { 
          providedKey: apiKey.substring(0, 8) + '...',
          ip: c.req.header('x-forwarded-for') || 'unknown'
        })
        throw new APIError('无效的API密钥', 401, 'INVALID_API_KEY')
      }
    }

    await next()
  }
}

/**
 * CORS预检请求处理
 */
export function handlePreflight() {
  return async (c, next) => {
    if (c.req.method === 'OPTIONS') {
      return c.text('', 204)
    }
    await next()
  }
}

export default {
  rateLimit,
  requestSizeLimit,
  securityHeaders,
  sanitizeInput,
  apiKeyAuth,
  handlePreflight
}

