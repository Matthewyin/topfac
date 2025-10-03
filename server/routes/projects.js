// 项目管理路由
import { Hono } from 'hono'
import db from '../database/index.js'

const projects = new Hono()

// 获取项目列表
projects.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const status = c.req.query('status')
    const search = c.req.query('search')

    let filter = {}
    if (status) filter.status = status

    const allProjects = await db.findAll('projects', filter)
    
    // 简单搜索
    let filteredProjects = allProjects
    if (search) {
      filteredProjects = allProjects.filter(project => 
        project.project_name.toLowerCase().includes(search.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
      )
    }

    // 分页
    const total = filteredProjects.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const projects = filteredProjects.slice(startIndex, endIndex)

    return c.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return c.json({
      success: false,
      error: '获取项目列表失败'
    }, 500)
  }
})

// 获取项目详情
projects.get('/:id', async (c) => {
  try {
    const projectId = c.req.param('id')
    const project = await db.findById('projects', projectId)

    if (!project) {
      return c.json({
        success: false,
        error: '项目不存在'
      }, 404)
    }

    return c.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Get project error:', error)
    return c.json({
      success: false,
      error: '获取项目详情失败'
    }, 500)
  }
})

// 创建项目
projects.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { project_name, description } = body

    if (!project_name) {
      return c.json({
        success: false,
        error: '项目名称不能为空'
      }, 400)
    }

    const project = await db.create('projects', {
      project_name,
      description: description || '',
      status: 'active',
      current_version: 0,
      version_count: 0
    })

    return c.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Create project error:', error)
    return c.json({
      success: false,
      error: '创建项目失败'
    }, 500)
  }
})

// 更新项目
projects.put('/:id', async (c) => {
  try {
    const projectId = c.req.param('id')
    const body = await c.req.json()

    const project = await db.update('projects', projectId, body)

    return c.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Update project error:', error)
    return c.json({
      success: false,
      error: '更新项目失败'
    }, 500)
  }
})

// 删除项目
projects.delete('/:id', async (c) => {
  try {
    const projectId = c.req.param('id')
    
    // 软删除：更新状态为 deleted
    const project = await db.update('projects', projectId, {
      status: 'deleted'
    })

    return c.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Delete project error:', error)
    return c.json({
      success: false,
      error: '删除项目失败'
    }, 500)
  }
})

// 获取项目版本列表
projects.get('/:id/versions', async (c) => {
  try {
    const projectId = c.req.param('id')

    const versions = await db.findAll('project_versions', { project_id: projectId })

    // 解析 JSON 字符串字段
    versions.forEach(version => {
      if (version.parsed_data && typeof version.parsed_data === 'string') {
        try {
          version.parsed_data = JSON.parse(version.parsed_data)
        } catch (e) {
          console.warn('解析 parsed_data 失败:', e)
        }
      }
    })

    // 按版本号排序
    versions.sort((a, b) => b.version - a.version)

    return c.json({
      success: true,
      data: {
        versions,
        pagination: {
          page: 1,
          limit: versions.length,
          total: versions.length,
          pages: 1
        }
      }
    })
  } catch (error) {
    console.error('Get versions error:', error)
    return c.json({
      success: false,
      error: '获取版本列表失败'
    }, 500)
  }
})

// 创建新版本
projects.post('/:id/versions', async (c) => {
  try {
    const projectId = c.req.param('id')
    const { text_content, parsed_data, xml_content } = await c.req.json()

    // 获取当前最大版本号
    const versions = await db.findAll('project_versions', { project_id: projectId })
    const maxVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0
    const newVersion = maxVersion + 1

    // 创建新版本
    const version = await db.create('project_versions', {
      project_id: projectId,
      version: newVersion,
      text_content: text_content || '',
      parsed_data: parsed_data || '',
      xml_content: xml_content || '',
      status: 'active'
    })

    // 更新项目的版本计数和当前版本
    await db.update('projects', projectId, {
      current_version: newVersion,
      version_count: newVersion
    })

    return c.json({
      success: true,
      data: {
        version_id: version.id,
        version: newVersion
      }
    })
  } catch (error) {
    console.error('Create version error:', error)
    return c.json({
      success: false,
      error: '创建版本失败'
    }, 500)
  }
})

// 处理完整工作流：解析文本 → 生成XML → 创建版本
projects.post('/:id/process', async (c) => {
  try {
    const projectId = c.req.param('id')
    const { text_content } = await c.req.json()

    if (!text_content) {
      return c.json({
        success: false,
        error: '文本内容不能为空'
      }, 400)
    }

    // 导入解析和生成服务
    const { default: TextParser } = await import('../services/TextParser.js')
    const { default: DrawIOService } = await import('../services/DrawIOService.js')

    // 步骤1: 解析文本
    const parser = new TextParser()
    const parsedData = parser.parseTopologyText(text_content)

    if (!parsedData || !parsedData.components || parsedData.components.length === 0) {
      return c.json({
        success: false,
        error: '文本解析失败，未能识别有效的网络组件'
      }, 400)
    }

    // 步骤2: 生成DrawIO XML
    const drawioService = new DrawIOService()
    const xmlContent = drawioService.generateXML(parsedData)

    // 步骤3: 创建新版本
    const versions = await db.findAll('project_versions', { project_id: projectId })
    const maxVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0
    const newVersion = maxVersion + 1

    const version = await db.create('project_versions', {
      project_id: projectId,
      version: newVersion,
      text_content: text_content,
      parsed_data: JSON.stringify(parsedData),
      xml_content: xmlContent,
      status: 'active'
    })

    // 更新项目
    await db.update('projects', projectId, {
      current_version: newVersion,
      version_count: newVersion
    })

    return c.json({
      success: true,
      data: {
        version_id: version.id,
        version: newVersion,
        parsed_data: parsedData,
        xml_generated: true,
        xml_length: xmlContent.length
      }
    })
  } catch (error) {
    console.error('Process workflow error:', error)
    return c.json({
      success: false,
      error: '处理工作流失败: ' + error.message
    }, 500)
  }
})

export default projects
