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

// 下载版本文件（支持 drawio|mermaid|excalidraw）
versions.get('/:id/download', async (c) => {
  try {
    const versionId = c.req.param('id')
    const format = (c.req.query('format') || 'drawio').toLowerCase()
    const version = await db.findById('project_versions', versionId)

    if (!version) {
      return c.json({ success: false, error: '版本不存在' }, 404)
    }

    let content = ''
    let filename = ''
    let contentType = ''

    if (format === 'drawio') {
      content = version.xml_content
      filename = `topology-${versionId}.drawio`
      contentType = 'application/xml'
    } else if (format === 'mermaid') {
      content = version.mermaid_content
      filename = `topology-${versionId}.mmd`
      contentType = 'text/plain; charset=utf-8'
    } else if (format === 'excalidraw') {
      content = version.excalidraw_content
      filename = `topology-${versionId}.excalidraw.json`
      contentType = 'application/json; charset=utf-8'
    } else {
      return c.json({ success: false, error: '不支持的格式' }, 400)
    }

    if (!content) {
      return c.json({ success: false, error: '内容不存在' }, 404)
    }

    c.header('Content-Type', contentType)
    c.header('Content-Disposition', `attachment; filename="${filename}"`)
    return c.body(content)
  } catch (error) {
    console.error('Download version error:', error)
    return c.json({ success: false, error: '下载失败' }, 500)
  }
})

export default versions

