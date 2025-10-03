// JSON 数据访问层
// 提供类似 ORM 的数据操作接口

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { randomBytes } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据目录路径
const DATA_DIR = path.join(__dirname, '../../data')

// 数据文件配置
const DATA_FILES = {
  projects: 'projects.json',
  project_versions: 'project_versions.json',
  parsed_data: 'parsed_data.json',
  ai_configs: 'ai_configs.json',
  component_templates: 'component_templates.json'
}

/**
 * JSON 数据库类
 */
class JSONDatabase {
  constructor() {
    this.cache = new Map() // 数据缓存
    this.locks = new Map() // 文件锁映射
    this.cacheTimeout = 60000 // 缓存超时时间（60秒）
    this.cacheTimestamps = new Map() // 缓存时间戳
    this.initializeDataFiles()
  }

  /**
   * 初始化数据文件
   */
  async initializeDataFiles() {
    // 确保数据目录存在
    await fs.ensureDir(DATA_DIR)
    await fs.ensureDir(path.join(DATA_DIR, 'backups'))

    // 初始化数据文件
    for (const [table, filename] of Object.entries(DATA_FILES)) {
      const filePath = path.join(DATA_DIR, filename)
      
      if (!await fs.pathExists(filePath)) {
        const initialData = {
          data: [],
          metadata: {
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            total_count: 0
          }
        }
        await fs.writeJson(filePath, initialData, { spaces: 2 })
        console.log(`📄 初始化数据文件: ${filename}`)
      }
    }
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(table) {
    if (!this.cache.has(table)) return false

    const timestamp = this.cacheTimestamps.get(table)
    if (!timestamp) return false

    return (Date.now() - timestamp) < this.cacheTimeout
  }

  /**
   * 读取数据文件（带缓存）
   */
  async readData(table, useCache = true) {
    const filename = DATA_FILES[table]
    if (!filename) {
      throw new Error(`未知的数据表: ${table}`)
    }

    // 检查缓存
    if (useCache && this.isCacheValid(table)) {
      return this.cache.get(table)
    }

    const filePath = path.join(DATA_DIR, filename)

    try {
      const data = await fs.readJson(filePath)

      // 更新缓存
      this.cache.set(table, data)
      this.cacheTimestamps.set(table, Date.now())

      return data
    } catch (error) {
      console.error(`读取数据文件失败: ${filename}`, error)
      const defaultData = {
        data: [],
        metadata: {
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          total_count: 0
        }
      }

      // 缓存默认数据
      this.cache.set(table, defaultData)
      this.cacheTimestamps.set(table, Date.now())

      return defaultData
    }
  }

  /**
   * 清除缓存
   */
  clearCache(table = null) {
    if (table) {
      this.cache.delete(table)
      this.cacheTimestamps.delete(table)
    } else {
      this.cache.clear()
      this.cacheTimestamps.clear()
    }
  }

  /**
   * 获取文件锁
   */
  async acquireLock(table) {
    const lockKey = `lock_${table}`

    // 如果已经有锁，等待释放
    while (this.locks.has(lockKey)) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // 设置锁
    this.locks.set(lockKey, Date.now())
  }

  /**
   * 释放文件锁
   */
  releaseLock(table) {
    const lockKey = `lock_${table}`
    this.locks.delete(lockKey)
  }

  /**
   * 原子写入数据文件
   */
  async writeData(table, data) {
    const filename = DATA_FILES[table]
    if (!filename) {
      throw new Error(`未知的数据表: ${table}`)
    }

    const filePath = path.join(DATA_DIR, filename)
    const tempPath = `${filePath}.tmp.${randomBytes(8).toString('hex')}`

    // 更新元数据
    data.metadata = {
      ...data.metadata,
      last_updated: new Date().toISOString(),
      total_count: data.data.length
    }

    try {
      // 获取文件锁
      await this.acquireLock(table)

      // 先写入临时文件
      await fs.writeJson(tempPath, data, { spaces: 2 })

      // 原子性移动到目标文件
      await fs.move(tempPath, filePath, { overwrite: true })

      // 清除缓存
      this.clearCache(table)

      console.log(`💾 数据已保存: ${filename} (${data.data.length} 条记录)`)
    } catch (error) {
      // 清理临时文件
      try {
        await fs.remove(tempPath)
      } catch (cleanupError) {
        console.warn(`清理临时文件失败: ${tempPath}`, cleanupError)
      }

      console.error(`写入数据文件失败: ${filename}`, error)
      throw error
    } finally {
      // 释放文件锁
      this.releaseLock(table)
    }
  }

  /**
   * 查找所有记录
   */
  async findAll(table, filter = {}) {
    const fileData = await this.readData(table)
    let records = fileData.data

    // 简单过滤
    if (Object.keys(filter).length > 0) {
      records = records.filter(record => {
        return Object.entries(filter).every(([key, value]) => {
          return record[key] === value
        })
      })
    }

    return records
  }

  /**
   * 按 ID 查找记录
   */
  async findById(table, id) {
    const records = await this.findAll(table)
    return records.find(record => record.id === id) || null
  }

  /**
   * 创建记录
   */
  async create(table, record) {
    const fileData = await this.readData(table)
    
    // 生成 ID (如果没有)
    if (!record.id) {
      record.id = this.generateId()
    }

    // 添加时间戳
    record.created_at = new Date().toISOString()
    record.updated_at = new Date().toISOString()

    fileData.data.push(record)
    await this.writeData(table, fileData)

    return record
  }

  /**
   * 更新记录
   */
  async update(table, id, updates) {
    const fileData = await this.readData(table)
    const index = fileData.data.findIndex(record => record.id === id)

    if (index === -1) {
      throw new Error(`记录不存在: ${id}`)
    }

    // 更新记录
    fileData.data[index] = {
      ...fileData.data[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    await this.writeData(table, fileData)
    return fileData.data[index]
  }

  /**
   * 删除记录
   */
  async delete(table, id) {
    const fileData = await this.readData(table)
    const index = fileData.data.findIndex(record => record.id === id)

    if (index === -1) {
      throw new Error(`记录不存在: ${id}`)
    }

    const deletedRecord = fileData.data.splice(index, 1)[0]
    await this.writeData(table, fileData)

    return deletedRecord
  }

  /**
   * 创建数据备份
   */
  async createBackup(table = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(DATA_DIR, 'backups', timestamp)

    await fs.ensureDir(backupDir)

    const tablesToBackup = table ? [table] : Object.keys(DATA_FILES)

    for (const tableName of tablesToBackup) {
      const filename = DATA_FILES[tableName]
      const sourcePath = path.join(DATA_DIR, filename)
      const backupPath = path.join(backupDir, filename)

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, backupPath)
      }
    }

    console.log(`📦 数据备份已创建: ${backupDir}`)
    return backupDir
  }

  /**
   * 恢复数据备份
   */
  async restoreBackup(backupPath) {
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`备份目录不存在: ${backupPath}`)
    }

    // 先创建当前数据的备份
    await this.createBackup()

    // 恢复备份数据
    for (const [tableName, filename] of Object.entries(DATA_FILES)) {
      const backupFilePath = path.join(backupPath, filename)
      const targetPath = path.join(DATA_DIR, filename)

      if (await fs.pathExists(backupFilePath)) {
        await fs.copy(backupFilePath, targetPath, { overwrite: true })
      }
    }

    // 清理缓存
    this.cache.clear()

    console.log(`🔄 数据已从备份恢复: ${backupPath}`)
  }

  /**
   * 清理旧备份
   */
  async cleanupOldBackups(keepDays = 7) {
    const backupDir = path.join(DATA_DIR, 'backups')
    const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000)

    try {
      const backupFolders = await fs.readdir(backupDir)

      for (const folder of backupFolders) {
        const folderPath = path.join(backupDir, folder)
        const stats = await fs.stat(folderPath)

        if (stats.isDirectory() && stats.mtime.getTime() < cutoffTime) {
          await fs.remove(folderPath)
          console.log(`🗑️ 已删除旧备份: ${folder}`)
        }
      }
    } catch (error) {
      console.warn('清理旧备份时出错:', error)
    }
  }

  /**
   * 生成唯一 ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出单例实例
export const db = new JSONDatabase()
export default db
