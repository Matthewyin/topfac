// 文本解析路由
import { Hono } from 'hono'
import { TextParser } from '../services/TextParser.js'
import db from '../database/index.js'

const parse = new Hono()

// 简化的文本解析接口
parse.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { text_content, project_id } = body

    if (!text_content) {
      return c.json({
        success: false,
        error: '文本内容不能为空'
      }, 400)
    }

    console.log('开始解析文本:', {
      text_length: text_content.length,
      has_project_id: !!project_id
    })

    // 创建解析器实例
    const parser = new TextParser()

    // 验证文本格式
    const validationResult = parser.validateTextFormat(text_content)
    if (!validationResult.is_valid) {
      return c.json({
        success: false,
        error: `文本格式验证失败: ${validationResult.errors.join(', ')}`,
        validation_result: validationResult
      }, 400)
    }

    // 解析文本
    const parsedData = parser.parseTopologyText(text_content)

    console.log('文本解析完成:', {
      components_count: parsedData.components.length,
      connections_count: parsedData.connections.length,
      environments_count: parsedData.environments.length
    })

    // 如果提供了项目ID，保存解析数据
    if (project_id) {
      try {
        const parsedId = db.generateId()
        await db.create('parsed_data', {
          id: parsedId,
          project_id: project_id,
          version_id: 'temp', // 临时版本ID
          topology_name: parsedData.topology_name,
          regions: JSON.stringify(parsedData.environments),
          components: JSON.stringify(parsedData.components),
          connections: JSON.stringify(parsedData.connections)
        })

        console.log('解析数据已保存:', { parsed_id: parsedId, project_id })
      } catch (saveError) {
        console.warn('保存解析数据失败:', saveError)
        // 不影响主要功能，继续返回解析结果
      }
    }

    return c.json({
      success: true,
      data: parsedData,
      validation_result: validationResult
    })

  } catch (error) {
    console.error('文本解析失败:', error)
    return c.json({
      success: false,
      error: `解析失败: ${error.message}`
    }, 500)
  }
})

export default parse
