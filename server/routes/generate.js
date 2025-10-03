// XML生成路由
import { Hono } from 'hono'
import { DrawIOService } from '../services/DrawIOService.js'

const generate = new Hono()

// 生成拓扑XML
generate.post('/', async (c) => {
  try {
    const data = await c.req.json()
    if (!data || !data.parsed_data) {
      return c.json({
        success: false,
        error: '请求数据不能为空，需要 parsed_data 字段'
      }, 400)
    }

    console.log('开始生成拓扑XML:', {
      component_count: data.parsed_data.components?.length || 0,
      connection_count: data.parsed_data.connections?.length || 0
    })

    // 生成XML
    const drawioService = new DrawIOService()
    const xmlContent = drawioService.generateXML(data.parsed_data)

    console.log('拓扑XML生成成功:', {
      xml_length: xmlContent.length
    })

    return c.json({
      success: true,
      data: {
        xml_content: xmlContent,
        xml_length: xmlContent.length
      },
      message: 'XML生成成功'
    })

  } catch (error) {
    console.error('XML生成失败:', error)
    return c.json({
      success: false,
      error: `生成失败: ${error.message}`
    }, 500)
  }
})

export default generate
