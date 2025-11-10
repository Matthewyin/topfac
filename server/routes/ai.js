// AI 智能转换路由
import { Hono } from 'hono'

const ai = new Hono()

// AI 服务配置
const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    description: 'Google的多模态大语言模型，支持文本生成和理解',
    default_model: 'gemini-2.5-flash',
    available_models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
    api_key_format: 'AIzaSy开头，约39字符',
    features: ['natural_language_conversion', 'connection_test', 'format_validation']
  },
  deepseek: {
    name: 'DeepSeek',
    description: '深度求索的大语言模型，专注于代码和推理任务',
    default_model: 'deepseek-chat',
    available_models: ['deepseek-chat', 'deepseek-reasoner'],
    api_key_format: 'sk-开头，30-50字符',
    features: ['natural_language_conversion', 'connection_test', 'format_validation']
  }
}

// AI 提示词模板
const AI_PROMPT_TEMPLATE = `### **【角色设定】**

你是一位顶级的网络架构师和拓扑分析专家AI。你的思考严谨、逻辑清晰，严格遵循规则。你的核心任务是：精确解析用户用自然语言描述的网络设备连接需求，并根据严格的4级层次结构规则，生成标准化的连接清单。数量信息必须被识别与展开。

### **【核心任务】**

将任何自然语言描述的网络拓扑，转换为无行首编号、逐行的标准化4级层次结构连接清单。每一行代表一对“设备实例”之间的连接，数量信息不得丢失。

**标准格式（每个元素都必须用【】包围）：**
【环境】【数据中心】的【网络区域】【设备类型/应用系统】连接【环境】【数据中心】的【网络区域】【设备类型/应用系统】

**重要：每个层级元素都必须严格用【】包围，不允许有任何例外！**

### **【4级层次结构规则】**

**第1级 - 环境（Environment）：**
- 生产网、测试网、开发网、办公网、DMZ网、管理网等
- 示例：【生产网】、【测试网】、【办公网】

**第2级 - 数据中心（Data Center）：**
- 具体的物理位置或逻辑区域
- 示例：【亦庄数据中心】、【上海机房】、【云平台】、【总部】

**第3级 - 网络区域（Network Zone）：**
- 核心区、汇聚区、接入区、DMZ区、管理区等
- 示例：【核心区】、【汇聚区】、【接入区】

**第4级 - 设备类型/应用系统（Device/System）：**
- 路由器、交换机、防火墙、服务器、应用系统等
- 示例：【核心路由器】、【接入交换机】、【防火墙】

### **【数量与实例化规则】**
- 当出现数量或集合时（如“2台/两台/8台/若干台/ABCDEFGH/路由器1和2/ToR交换机A-H/各/分别/每台”），必须实例化为多台独立设备；实例名写入第4级【设备类型/应用系统】内。
- 命名规则：
  1) 有显式字母标识：保留字母作为后缀，如【ToR交换机A】…【ToR交换机H】
  2) 无显式标识但有数量：使用“类型+序号”，如【路由器1】、【路由器2】、【DNS1】、【DNS2】
  3) 若输入中已有“1/2/3”等编号，按原编号使用
- 示例：
  - “两台路由器”→【…】【…】【…】【路由器1】、【…】【…】【…】【路由器2】
  - “8台ToR交换机ABCDEFGH”→【…】【…】【接入区】【ToR交换机A】…【ToR交换机H】
- 数量信息不得丢失或合并为单台。

### **【连接展开规则】**
- 默认：当两组设备“连接”且未明确对应关系时，按全互联展开（N×M），每一对实例输出一行
- 明确“分别/各自/一一对应”：按一对一配对展开（按出现顺序配对），数量不等时配到较小者
- “各连接K台Y”或“每台…连接K台Y”：每个源实例与同一组K台Y全互联
- 若语义为“分别连接1台服务器”：每个源实例各自连接一台服务器（一对一）
- 严禁将多台设备合并为一台输出

### **【格式与一致性要求】**
1. 严格格式：每行必须是完整的“【…】连接【…】”
2. 无行首编号：不要在行首添加 1. 2. 3. 之类编号；设备实例编号/字母后缀是允许且必要的
3. 逐行输出：每一对设备实例连接占一行
4. 完整性：确保所有提到的连接都被包含并按规则展开
5. 一致性：相同的设备实例在不同连接中名称必须一致（如【接入交换机1】在所有行中保持一致）

### **【小示例】**
输入：两台接入交换机连接2台DNS
输出：
【生产网】【亦庄数据中心】的【接入区】【接入交换机1】连接【生产网】【亦庄数据中心】的【接入区】【DNS1】
【生产网】【亦庄数据中心】的【接入区】【接入交换机1】连接【生产网】【亦庄数据中心】的【接入区】【DNS2】
【生产网】【亦庄数据中心】的【接入区】【接入交换机2】连接【生产网】【亦庄数据中心】的【接入区】【DNS1】
【生产网】【亦庄数据中心】的【接入区】【接入交换机2】连接【生产网】【亦庄数据中心】的【接入区】【DNS2】

### **【用户输入】**
{{user_input}}

**你的输出:**`

// AI 服务函数
async function callGeminiAPI(apiKey, prompt, modelName = 'gemini-2.5-flash') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 20480
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API调用失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API返回空结果')
  }

  return data.candidates[0].content.parts[0].text.trim()
}

async function callDeepSeekAPI(apiKey, prompt, modelName = 'deepseek-chat') {
  const url = 'https://api.deepseek.com/v1/chat/completions'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API调用失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek API返回空结果')
  }

  return data.choices[0].message.content.trim()
}

async function testAIConnection(provider, apiKey, modelName) {
  const testPrompt = '测试连接：请回复"连接成功"'

  try {
    let result
    if (provider === 'gemini') {
      result = await callGeminiAPI(apiKey, testPrompt, modelName)
    } else if (provider === 'deepseek') {
      result = await callDeepSeekAPI(apiKey, testPrompt, modelName)
    } else {
      throw new Error(`不支持的提供商: ${provider}`)
    }

    return {
      success: true,
      provider: provider,
      model: modelName || AI_PROVIDERS[provider].default_model,
      response_text: result,
      message: '连接测试成功'
    }
  } catch (error) {
    return {
      success: false,
      provider: provider,
      error: error.message,
      message: '连接测试失败'
    }
  }
}

async function convertTextWithAI(provider, apiKey, naturalInput, modelName) {
  const prompt = AI_PROMPT_TEMPLATE.replace('{{user_input}}', naturalInput)

  try {
    let result
    if (provider === 'gemini') {
      result = await callGeminiAPI(apiKey, prompt, modelName)
    } else if (provider === 'deepseek') {
      result = await callDeepSeekAPI(apiKey, prompt, modelName)
    } else {
      throw new Error(`不支持的提供商: ${provider}`)
    }

    return {
      success: true,
      data: {
        converted_text: result,
        input_text: naturalInput,
        model: modelName || AI_PROVIDERS[provider].default_model
      },
      message: '转换成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '转换失败'
    }
  }
}

// 数据验证函数
function validateAIConvertRequest(data) {
  const errors = []

  if (!data.provider) {
    errors.push('AI服务提供商不能为空')
  } else if (!['gemini', 'deepseek'].includes(data.provider)) {
    errors.push('不支持的AI服务提供商')
  }

  if (!data.api_key) {
    errors.push('API Key不能为空')
  } else if (data.api_key.length < 10 || data.api_key.length > 200) {
    errors.push('API Key长度必须在10-200字符之间')
  }

  if (!data.natural_input) {
    errors.push('自然语言输入不能为空')
  } else if (data.natural_input.length < 10) {
    errors.push('自然语言输入至少需要10个字符')
  } else if (data.natural_input.length > 50000) {
    errors.push('自然语言输入不能超过50000个字符')
  }

  // API Key 格式验证
  if (data.provider && data.api_key) {
    if (data.provider === 'gemini') {
      if (!data.api_key.startsWith('AIzaSy') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('Gemini API Key格式不正确')
      }
    } else if (data.provider === 'deepseek') {
      if (!data.api_key.startsWith('sk-') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('DeepSeek API Key格式不正确')
      }
    }
  }

  return errors
}

function validateAITestRequest(data) {
  const errors = []

  if (!data.provider) {
    errors.push('AI服务提供商不能为空')
  } else if (!['gemini', 'deepseek'].includes(data.provider)) {
    errors.push('不支持的AI服务提供商')
  }

  if (!data.api_key) {
    errors.push('API Key不能为空')
  } else if (data.api_key.length < 10 || data.api_key.length > 200) {
    errors.push('API Key长度必须在10-200字符之间')
  }

  // API Key 格式验证
  if (data.provider && data.api_key) {
    if (data.provider === 'gemini') {
      if (!data.api_key.startsWith('AIzaSy') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('Gemini API Key格式不正确')
      }
    } else if (data.provider === 'deepseek') {
      if (!data.api_key.startsWith('sk-') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('DeepSeek API Key格式不正确')
      }
    }
  }

  return errors
}

// AI智能文本转换
ai.post('/convert-text', async (c) => {
  try {
    const data = await c.req.json()
    if (!data) {
      return c.json({
        success: false,
        error: '请求数据不能为空'
      }, 400)
    }

    // 验证输入数据
    const validationErrors = validateAIConvertRequest(data)
    if (validationErrors.length > 0) {
      console.warn('AI转换请求验证失败:', validationErrors)
      return c.json({
        success: false,
        error: '输入数据验证失败',
        details: validationErrors
      }, 400)
    }

    const { provider, api_key, natural_input, model_name } = data

    // 生成会话ID用于关联输入和输出日志
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('开始AI文本转换:', {
      provider,
      input_length: natural_input.length,
      has_model_name: !!model_name,
      session_id: sessionId
    })

    // 执行AI转换
    const startTime = Date.now()
    const result = await convertTextWithAI(provider, api_key, natural_input, model_name)
    const processingTime = Date.now() - startTime

    if (result.success) {
      console.log('AI文本转换成功:', {
        provider,
        model: result.data?.model || model_name,
        processing_time: processingTime,
        output_length: result.data?.converted_text?.length || 0,
        session_id: sessionId
      })

      return c.json({
        success: true,
        data: {
          converted_text: result.data.converted_text,
          provider: provider,
          model: result.data.model || model_name,
          processing_time: processingTime,
          input_length: natural_input.length,
          output_length: result.data.converted_text?.length || 0,
          session_id: sessionId
        }
      })
    } else {
      console.warn('AI文本转换失败:', {
        provider,
        error: result.message || result.error,
        session_id: sessionId
      })

      return c.json({
        success: false,
        error: result.message || result.error || 'AI转换失败',
        provider: provider,
        session_id: sessionId
      }, 400)
    }

  } catch (error) {
    console.error('AI文本转换异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 测试AI服务连接
ai.post('/test-connection', async (c) => {
  try {
    const data = await c.req.json()
    if (!data) {
      return c.json({
        success: false,
        error: '请求数据不能为空'
      }, 400)
    }

    // 验证输入数据
    const validationErrors = validateAITestRequest(data)
    if (validationErrors.length > 0) {
      console.warn('AI连接测试请求验证失败:', validationErrors)
      return c.json({
        success: false,
        error: '输入数据验证失败',
        details: validationErrors
      }, 400)
    }

    const { provider, api_key, model_name } = data

    console.log('开始AI连接测试:', {
      provider,
      has_model_name: !!model_name
    })

    // 执行连接测试
    const result = await testAIConnection(provider, api_key, model_name)

    if (result.success) {
      console.log('AI连接测试成功:', {
        provider,
        model: result.model
      })
      return c.json(result)
    } else {
      console.warn('AI连接测试失败:', {
        provider,
        error: result.error
      })
      return c.json(result, 400)
    }

  } catch (error) {
    console.error('AI连接测试异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 获取支持的AI服务提供商列表
ai.get('/providers', async (c) => {
  try {
    // 转换为数组格式
    const providersArray = Object.entries(AI_PROVIDERS).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      default_model: config.default_model,
      available_models: config.available_models,
      api_key_format: config.api_key_format,
      features: config.features
    }))

    return c.json({
      success: true,
      data: providersArray,
      count: providersArray.length
    })

  } catch (error) {
    console.error('获取AI提供商列表异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 获取指定AI服务提供商的可用模型列表
ai.get('/providers/:provider/models', async (c) => {
  try {
    const provider = c.req.param('provider')

    const providerInfo = AI_PROVIDERS[provider]
    if (!providerInfo) {
      return c.json({
        success: false,
        error: `不支持的AI服务提供商: ${provider}`
      }, 400)
    }

    return c.json({
      success: true,
      data: {
        provider: provider,
        models: providerInfo.available_models,
        default_model: providerInfo.default_model,
        provider_info: {
          name: providerInfo.name,
          description: providerInfo.description,
          api_key_format: providerInfo.api_key_format,
          features: providerInfo.features
        }
      }
    })

  } catch (error) {
    console.error('获取AI模型列表异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

export default ai
