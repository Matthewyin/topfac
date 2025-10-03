#!/usr/bin/env node
// 数据恢复脚本

import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../data')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')

async function listBackups() {
  try {
    const backups = await fs.readdir(BACKUP_DIR)
    const validBackups = backups
      .filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name))
      .sort()
      .reverse()
    
    console.log('📋 可用的备份:')
    validBackups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup}`)
    })
    
    return validBackups
  } catch (error) {
    console.error('❌ 无法读取备份目录:', error)
    return []
  }
}

async function restoreFromBackup(backupName) {
  try {
    console.log(`🔄 开始从备份恢复数据: ${backupName}`)
    
    const backupPath = path.join(BACKUP_DIR, backupName)
    
    // 检查备份是否存在
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`备份不存在: ${backupName}`)
    }
    
    // 备份当前数据 (以防恢复失败)
    const currentBackupName = `current-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const currentBackupPath = path.join(BACKUP_DIR, currentBackupName)
    await fs.ensureDir(currentBackupPath)
    
    const currentFiles = await fs.readdir(DATA_DIR)
    const currentJsonFiles = currentFiles.filter(file => file.endsWith('.json'))
    
    for (const file of currentJsonFiles) {
      const sourcePath = path.join(DATA_DIR, file)
      const targetPath = path.join(currentBackupPath, file)
      await fs.copy(sourcePath, targetPath)
    }
    
    console.log(`💾 当前数据已备份到: ${currentBackupName}`)
    
    // 恢复数据
    const backupFiles = await fs.readdir(backupPath)
    const jsonFiles = backupFiles.filter(file => file.endsWith('.json'))
    
    for (const file of jsonFiles) {
      const sourcePath = path.join(backupPath, file)
      const targetPath = path.join(DATA_DIR, file)
      await fs.copy(sourcePath, targetPath)
      console.log(`📄 已恢复: ${file}`)
    }
    
    console.log(`✅ 恢复完成: ${backupName}`)
    console.log(`📊 恢复文件数: ${jsonFiles.length}`)
    
  } catch (error) {
    console.error('❌ 恢复失败:', error)
    process.exit(1)
  }
}

// 命令行参数处理
async function main() {
  const backupName = process.argv[2]
  
  if (!backupName) {
    console.log('📋 使用方法: npm run restore <备份名称>')
    console.log('📋 或者: node scripts/restore.js <备份名称>')
    console.log('')
    await listBackups()
    return
  }
  
  if (backupName === 'list') {
    await listBackups()
    return
  }
  
  await restoreFromBackup(backupName)
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { listBackups, restoreFromBackup }
