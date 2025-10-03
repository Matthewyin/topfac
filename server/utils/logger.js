/**
 * 日志工具
 * 提供统一的日志记录功能
 */

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOG_DIR = path.join(__dirname, '../../logs')
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
}

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
}

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO'
    this.enableFileLog = process.env.ENABLE_FILE_LOG !== 'false'
    this.initLogDir()
  }

  /**
   * 初始化日志目录
   */
  async initLogDir() {
    try {
      await fs.ensureDir(LOG_DIR)
    } catch (error) {
      console.error('创建日志目录失败:', error)
    }
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] [${level}] ${message}${metaStr}`
  }

  /**
   * 写入日志文件
   */
  async writeToFile(level, message) {
    if (!this.enableFileLog) return

    try {
      const date = new Date().toISOString().split('T')[0]
      const logFile = path.join(LOG_DIR, `${date}.log`)
      await fs.appendFile(logFile, message + '\n')
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }
  }

  /**
   * 输出到控制台（带颜色）
   */
  logToConsole(level, message, color) {
    console.log(`${color}${message}${colors.reset}`)
  }

  /**
   * 记录错误日志
   */
  error(message, meta = {}) {
    const formattedMessage = this.formatMessage(LOG_LEVELS.ERROR, message, meta)
    this.logToConsole(LOG_LEVELS.ERROR, formattedMessage, colors.red)
    this.writeToFile(LOG_LEVELS.ERROR, formattedMessage)
  }

  /**
   * 记录警告日志
   */
  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage(LOG_LEVELS.WARN, message, meta)
    this.logToConsole(LOG_LEVELS.WARN, formattedMessage, colors.yellow)
    this.writeToFile(LOG_LEVELS.WARN, formattedMessage)
  }

  /**
   * 记录信息日志
   */
  info(message, meta = {}) {
    const formattedMessage = this.formatMessage(LOG_LEVELS.INFO, message, meta)
    this.logToConsole(LOG_LEVELS.INFO, formattedMessage, colors.green)
    this.writeToFile(LOG_LEVELS.INFO, formattedMessage)
  }

  /**
   * 记录调试日志
   */
  debug(message, meta = {}) {
    if (this.logLevel !== 'DEBUG') return
    
    const formattedMessage = this.formatMessage(LOG_LEVELS.DEBUG, message, meta)
    this.logToConsole(LOG_LEVELS.DEBUG, formattedMessage, colors.gray)
    this.writeToFile(LOG_LEVELS.DEBUG, formattedMessage)
  }

  /**
   * 记录HTTP请求
   */
  http(method, path, status, duration) {
    const color = status >= 400 ? colors.red : status >= 300 ? colors.yellow : colors.green
    const message = `${method} ${path} ${status} - ${duration}ms`
    this.logToConsole('HTTP', message, color)
    this.writeToFile('HTTP', this.formatMessage('HTTP', message))
  }

  /**
   * 清理旧日志文件
   */
  async cleanupOldLogs(keepDays = 7) {
    try {
      const files = await fs.readdir(LOG_DIR)
      const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000)

      for (const file of files) {
        if (!file.endsWith('.log')) continue

        const filePath = path.join(LOG_DIR, file)
        const stats = await fs.stat(filePath)

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.remove(filePath)
          this.info(`已删除旧日志文件: ${file}`)
        }
      }
    } catch (error) {
      this.error('清理旧日志失败', { error: error.message })
    }
  }
}

// 导出单例
export const logger = new Logger()
export default logger

