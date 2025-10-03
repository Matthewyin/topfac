#!/usr/bin/env node
// 数据备份脚本

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../data')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')

async function createBackup() {
  try {
    console.log('🔄 开始创建数据备份...')
    
    // 确保备份目录存在
    await fs.ensureDir(BACKUP_DIR)
    
    // 创建时间戳目录
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const backupPath = path.join(BACKUP_DIR, timestamp)
    await fs.ensureDir(backupPath)
    
    // 备份所有 JSON 文件
    const files = await fs.readdir(DATA_DIR)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    for (const file of jsonFiles) {
      const sourcePath = path.join(DATA_DIR, file)
      const targetPath = path.join(backupPath, file)
      await fs.copy(sourcePath, targetPath)
      console.log(`📄 已备份: ${file}`)
    }
    
    console.log(`✅ 备份完成: ${backupPath}`)
    console.log(`📊 备份文件数: ${jsonFiles.length}`)
    
    // 清理旧备份 (保留最近7天)
    await cleanOldBackups()
    
  } catch (error) {
    console.error('❌ 备份失败:', error)
    process.exit(1)
  }
}

async function cleanOldBackups() {
  try {
    const backups = await fs.readdir(BACKUP_DIR)
    const sortedBackups = backups
      .filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name))
      .sort()
      .reverse()
    
    // 保留最近7个备份
    const toDelete = sortedBackups.slice(7)
    
    for (const backup of toDelete) {
      const backupPath = path.join(BACKUP_DIR, backup)
      await fs.remove(backupPath)
      console.log(`🗑️  已删除旧备份: ${backup}`)
    }
    
    if (toDelete.length > 0) {
      console.log(`🧹 清理完成，删除了 ${toDelete.length} 个旧备份`)
    }
    
  } catch (error) {
    console.warn('⚠️  清理旧备份时出错:', error.message)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup()
}

export { createBackup, cleanOldBackups }
