// 版本管理路由
import { Hono } from 'hono'
import db from '../database/index.js'

const versions = new Hono()

// 获取版本详情
versions.get('/:id', async (c) => {
  try {
    const versionId = c.req.param('id')
    const version = await db.findById('project_versions', versionId)

    if (!version) {
      return c.json({
        success: false,
        error: '版本不存在'
      }, 404)
    }

    // 解析 JSON 字符串字段
    if (version.parsed_data && typeof version.parsed_data === 'string') {
      try {
        version.parsed_data = JSON.parse(version.parsed_data)
      } catch (e) {
        console.warn('解析 parsed_data 失败:', e)
      }
    }

    return c.json({
      success: true,
      data: version
    })
  } catch (error) {
    console.error('Get version error:', error)
    return c.json({
      success: false,
      error: '获取版本详情失败'
    }, 500)
  }
})

// 更新版本
versions.put('/:id', async (c) => {
  try {
    const versionId = c.req.param('id')
    const body = await c.req.json()

    const version = await db.update('project_versions', versionId, body)

    return c.json({
      success: true,
      data: version
    })
  } catch (error) {
    console.error('Update version error:', error)
    return c.json({
      success: false,
      error: '更新版本失败'
    }, 500)
  }
})

// 删除版本
versions.delete('/:id', async (c) => {
  try {
    const versionId = c.req.param('id')
    
    // 软删除：更新状态为 deleted
    const version = await db.update('project_versions', versionId, {
      status: 'deleted'
    })

    return c.json({
      success: true,
      data: version
    })
  } catch (error) {
    console.error('Delete version error:', error)
    return c.json({
      success: false,
      error: '删除版本失败'
    }, 500)
  }
})

// 下载版本 XML
versions.get('/:id/download', async (c) => {
  try {
    const versionId = c.req.param('id')
    const version = await db.findById('project_versions', versionId)

    if (!version) {
      return c.json({
        success: false,
        error: '版本不存在'
      }, 404)
    }

    if (!version.xml_content) {
      return c.json({
        success: false,
        error: 'XML内容不存在'
      }, 404)
    }

    // 设置响应头
    c.header('Content-Type', 'application/xml')
    c.header('Content-Disposition', `attachment; filename="topology-${versionId}.drawio"`)
    
    return c.body(version.xml_content)
  } catch (error) {
    console.error('Download version error:', error)
    return c.json({
      success: false,
      error: '下载失败'
    }, 500)
  }
})

export default versions

