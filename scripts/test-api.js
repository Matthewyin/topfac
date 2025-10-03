#!/usr/bin/env node
/**
 * TopFac API 集成测试脚本
 * 测试所有API端点的功能
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000'

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0
}

/**
 * 执行API测试
 */
async function testAPI(name, method, path, body = null, expectedStatus = 200) {
  stats.total++
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${API_BASE}${path}`, options)
    const data = await response.json()
    
    if (response.status === expectedStatus) {
      stats.passed++
      log(`✓ ${name}`, 'green')
      return { success: true, data }
    } else {
      stats.failed++
      log(`✗ ${name} - 状态码: ${response.status}`, 'red')
      return { success: false, data }
    }
  } catch (error) {
    stats.failed++
    log(`✗ ${name} - 错误: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

/**
 * 主测试流程
 */
async function runTests() {
  log('\n🧪 开始API集成测试\n', 'blue')
  log(`API地址: ${API_BASE}\n`, 'yellow')
  
  // 1. 健康检查
  log('=== 健康检查 ===', 'blue')
  await testAPI('健康检查', 'GET', '/health')
  await testAPI('系统状态', 'GET', '/api/status')
  
  // 2. 项目管理测试
  log('\n=== 项目管理 ===', 'blue')
  
  // 创建项目
  const createResult = await testAPI(
    '创建项目',
    'POST',
    '/api/projects',
    {
      project_name: '测试项目',
      description: '这是一个测试项目'
    }
  )
  
  let projectId = null
  if (createResult.success && createResult.data.data) {
    projectId = createResult.data.data.id
    log(`  项目ID: ${projectId}`, 'yellow')
  }
  
  // 获取项目列表
  await testAPI('获取项目列表', 'GET', '/api/projects')
  
  if (projectId) {
    // 获取项目详情
    await testAPI('获取项目详情', 'GET', `/api/projects/${projectId}`)
    
    // 更新项目
    await testAPI(
      '更新项目',
      'PUT',
      `/api/projects/${projectId}`,
      {
        project_name: '测试项目（已更新）',
        description: '更新后的描述'
      }
    )
    
    // 获取项目版本列表
    await testAPI('获取项目版本', 'GET', `/api/projects/${projectId}/versions`)
  }
  
  // 3. 文本解析测试
  log('\n=== 文本解析 ===', 'blue')
  
  const parseResult = await testAPI(
    '解析网络拓扑文本',
    'POST',
    '/api/parse',
    {
      text_content: '【生产环境】【数据中心A】的【核心网络区】【核心路由器】连接【生产环境】【数据中心A】的【汇聚网络区】【汇聚交换机】'
    }
  )
  
  let parsedData = null
  if (parseResult.success && parseResult.data.data) {
    parsedData = parseResult.data.data
    log(`  解析到 ${parsedData.components?.length || 0} 个组件`, 'yellow')
    log(`  解析到 ${parsedData.connections?.length || 0} 个连接`, 'yellow')
  }
  
  // 4. XML生成测试
  if (parsedData) {
    log('\n=== XML生成 ===', 'blue')
    
    const generateResult = await testAPI(
      '生成DrawIO XML',
      'POST',
      '/api/generate',
      {
        parsed_data: parsedData
      }
    )
    
    if (generateResult.success && generateResult.data.data) {
      log(`  XML长度: ${generateResult.data.data.xml_length} 字符`, 'yellow')
    }
  }
  
  // 5. 项目版本测试
  if (projectId) {
    log('\n=== 项目版本 ===', 'blue')
    
    await testAPI(
      '创建项目版本',
      'POST',
      `/api/projects/${projectId}/versions`,
      {
        text_content: '【生产环境】【数据中心A】的【核心网络区】【核心路由器】'
      }
    )
  }
  
  // 6. 清理测试数据
  if (projectId) {
    log('\n=== 清理测试数据 ===', 'blue')
    await testAPI('删除测试项目', 'DELETE', `/api/projects/${projectId}`)
  }
  
  // 输出测试结果
  log('\n' + '='.repeat(50), 'blue')
  log('测试完成', 'blue')
  log('='.repeat(50), 'blue')
  log(`总计: ${stats.total} 个测试`, 'yellow')
  log(`通过: ${stats.passed} 个`, 'green')
  log(`失败: ${stats.failed} 个`, 'red')
  log(`成功率: ${((stats.passed / stats.total) * 100).toFixed(2)}%\n`, 'yellow')
  
  // 返回退出码
  process.exit(stats.failed > 0 ? 1 : 0)
}

// 运行测试
runTests().catch(error => {
  log(`\n测试执行失败: ${error.message}`, 'red')
  process.exit(1)
})

