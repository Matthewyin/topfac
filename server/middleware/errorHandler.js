/**
 * 错误处理中间件
 * 统一处理API错误响应
 */

import logger from '../utils/logger.js'

/**
 * 自定义错误类
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

/**
 * 错误处理中间件
 */
export function errorHandler() {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      // 记录错误日志
      logger.error('API错误', {
        path: c.req.path,
        method: c.req.method,
        error: error.message,
        stack: error.stack
      })

      // 判断错误类型
      if (error instanceof APIError) {
        return c.json({
          success: false,
          error: error.message,
          error_code: error.errorCode,
          timestamp: new Date().toISOString()
        }, error.statusCode)
      }

      // 处理验证错误
      if (error.name === 'ValidationError') {
        return c.json({
          success: false,
          error: '请求参数验证失败',
          error_code: 'VALIDATION_ERROR',
          details: error.message,
          timestamp: new Date().toISOString()
        }, 400)
      }

      // 处理JSON解析错误
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return c.json({
          success: false,
          error: '无效的JSON格式',
          error_code: 'INVALID_JSON',
          timestamp: new Date().toISOString()
        }, 400)
      }

      // 默认错误响应
      return c.json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? '服务器内部错误' 
          : error.message,
        error_code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }
}

/**
 * 404处理
 */
export function notFoundHandler(c) {
  logger.warn('404 Not Found', {
    path: c.req.path,
    method: c.req.method
  })

  return c.json({
    success: false,
    error: '请求的资源不存在',
    error_code: 'NOT_FOUND',
    path: c.req.path,
    timestamp: new Date().toISOString()
  }, 404)
}

/**
 * 请求日志中间件
 */
export function requestLogger() {
  return async (c, next) => {
    const start = Date.now()
    const method = c.req.method
    const path = c.req.path

    await next()

    const duration = Date.now() - start
    const status = c.res.status

    logger.http(method, path, status, duration)
  }
}

/**
 * 请求验证中间件
 */
export function validateRequest(schema) {
  return async (c, next) => {
    try {
      const body = await c.req.json()
      
      // 简单的验证逻辑
      for (const [key, rules] of Object.entries(schema)) {
        const value = body[key]
        
        // 必填验证
        if (rules.required && (value === undefined || value === null || value === '')) {
          throw new APIError(`字段 ${key} 是必填的`, 400, 'VALIDATION_ERROR')
        }
        
        // 类型验证
        if (value !== undefined && rules.type) {
          const actualType = typeof value
          if (actualType !== rules.type) {
            throw new APIError(
              `字段 ${key} 类型错误，期望 ${rules.type}，实际 ${actualType}`,
              400,
              'VALIDATION_ERROR'
            )
          }
        }
        
        // 长度验证
        if (value && rules.maxLength && value.length > rules.maxLength) {
          throw new APIError(
            `字段 ${key} 长度超过限制（最大 ${rules.maxLength}）`,
            400,
            'VALIDATION_ERROR'
          )
        }
        
        if (value && rules.minLength && value.length < rules.minLength) {
          throw new APIError(
            `字段 ${key} 长度不足（最小 ${rules.minLength}）`,
            400,
            'VALIDATION_ERROR'
          )
        }
      }
      
      await next()
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError('请求验证失败', 400, 'VALIDATION_ERROR')
    }
  }
}

export default {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateRequest,
  APIError
}

