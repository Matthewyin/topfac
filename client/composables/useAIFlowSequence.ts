/**
 * AI 架构时序模拟器 - 业务逻辑 Composable
 */

import type { Config, Step } from '~/types/ai-learning'
import { MASTER_ORDER } from '~/types/ai-learning'

/**
 * 生成时序步骤序列
 */
export function generateSequence(config: Config): Step[] {
  const seq: Step[] = []
  
  // 第一步：用户提问
  seq.push({
    from: 'USER',
    to: 'HOST',
    label: '提问: "查询销量"',
    data: { input: '查询 2023 年 Q3 销量' }
  })

  if (!config.agent && !config.fc && !config.mcp) {
    // 场景 1: Basic Chat
    seq.push({
      from: 'HOST',
      to: 'LLM',
      label: '发送 Prompt',
      data: { messages: [{ role: 'user', content: '查询销量' }] }
    })
    seq.push({
      from: 'LLM',
      to: 'HOST',
      label: '回复文本',
      data: { content: '抱歉，我无法访问数据库。' }
    })
    seq.push({
      from: 'HOST',
      to: 'USER',
      label: '显示结果',
      data: { output: '抱歉，我无法访问数据库。' }
    })
  } else if (!config.agent && config.fc && !config.mcp) {
    // 场景 2: Scripted Function Calling
    seq.push({
      from: 'HOST',
      to: 'LLM',
      label: '发送 Prompt + Tools',
      data: { messages: [{ role: 'user', content: '查询...' }], tools: [{ name: 'query_db' }] }
    })
    seq.push({
      from: 'LLM',
      to: 'HOST',
      label: '请求调用函数',
      data: { tool_calls: [{ name: 'query_db', args: "{'year':2023}" }] }
    })
    seq.push({
      from: 'HOST',
      to: 'TOOLS',
      label: '执行本地函数',
      data: { exec: 'query_db(2023)' }
    })
    seq.push({
      from: 'TOOLS',
      to: 'HOST',
      label: '函数返回数据',
      data: { return: 1000000 }
    })
    seq.push({
      from: 'HOST',
      to: 'LLM',
      label: '提交函数结果',
      data: { role: 'tool', content: '100万' }
    })
    seq.push({
      from: 'LLM',
      to: 'HOST',
      label: '最终回复',
      data: { content: '销量是 100 万。' }
    })
    seq.push({
      from: 'HOST',
      to: 'USER',
      label: '显示结果',
      data: { output: '销量是 100 万。' }
    })
  } else if (config.agent && config.fc && !config.mcp) {
    // 场景 3: Agent Loop
    seq.push({
      from: 'HOST',
      to: 'AGENT',
      label: '激活智能体',
      data: { task: 'Analyze Sales' }
    })
    seq.push({
      from: 'AGENT',
      to: 'LLM',
      label: '思考 (ReAct)',
      data: { system: 'You are an agent...', messages: [{ role: 'user', content: 'Analyze...' }] }
    })
    seq.push({
      from: 'LLM',
      to: 'AGENT',
      label: '决策: 调用工具',
      data: { tool_calls: [{ name: 'search_file' }] }
    })
    seq.push({
      from: 'AGENT',
      to: 'HOST',
      label: '请求环境执行',
      data: { cmd: 'run search_file' }
    })
    seq.push({
      from: 'HOST',
      to: 'TOOLS',
      label: '系统调用 grep',
      data: { exec: "grep 'sales' data.csv" }
    })
    seq.push({
      from: 'TOOLS',
      to: 'HOST',
      label: 'IO 输出',
      data: { stdout: 'sales_q3 = 1M' }
    })
    seq.push({
      from: 'HOST',
      to: 'AGENT',
      label: '返回执行结果',
      data: { result: 'Found: sales_q3 = 1M' }
    })
    seq.push({
      from: 'AGENT',
      to: 'LLM',
      label: '观察 (Observation)',
      data: { role: 'tool', content: 'sales_q3 = 1M' }
    })
    seq.push({
      from: 'LLM',
      to: 'AGENT',
      label: '生成结论',
      data: { content: 'Analysis complete: 1M' }
    })
    seq.push({
      from: 'AGENT',
      to: 'HOST',
      label: '返回任务结果',
      data: { final_answer: '1M' }
    })
    seq.push({
      from: 'HOST',
      to: 'USER',
      label: '显示结果',
      data: { output: '1M' }
    })
  } else if (config.agent && config.fc && config.mcp) {
    // 场景 4: Full MCP
    seq.push({
      from: 'HOST',
      to: 'AGENT',
      label: '启动任务',
      data: { task: 'Read Excel via MCP' }
    })
    seq.push({
      from: 'AGENT',
      to: 'LLM',
      label: '思考',
      data: { messages: [{ role: 'user', content: 'Read Excel...' }] }
    })
    seq.push({
      from: 'LLM',
      to: 'AGENT',
      label: '决策: Call mcp_tool',
      data: { tool_calls: [{ name: 'mcp_excel_read' }] }
    })
    seq.push({
      from: 'AGENT',
      to: 'MCP',
      label: 'MCP 协议请求',
      data: { jsonrpc: '2.0', method: 'tools/call', params: { name: 'read_sheet' } }
    })
    seq.push({
      from: 'MCP',
      to: 'TOOLS',
      label: '驱动底层工具',
      data: { internal_call: 'pandas.read_excel()' }
    })
    seq.push({
      from: 'TOOLS',
      to: 'MCP',
      label: '工具返回',
      data: { raw_data: 'rows...' }
    })
    seq.push({
      from: 'MCP',
      to: 'AGENT',
      label: 'MCP 协议响应',
      data: { jsonrpc: '2.0', result: { content: [{ type: 'text', text: 'Values...' }] } }
    })
    seq.push({
      from: 'AGENT',
      to: 'LLM',
      label: '提交 MCP 结果',
      data: { role: 'tool', content: 'Values...' }
    })
    seq.push({
      from: 'LLM',
      to: 'AGENT',
      label: '生成回答',
      data: { content: 'Excel shows...' }
    })
    seq.push({
      from: 'AGENT',
      to: 'HOST',
      label: '完成',
      data: { final: 'Done' }
    })
    seq.push({
      from: 'HOST',
      to: 'USER',
      label: '显示结果',
      data: { output: 'Done' }
    })
  }

  return seq
}

/**
 * 验证配置
 */
export function validateConfig(config: Config): string | null {
  if (config.mcp && !config.fc) {
    return '组合无效: MCP 必须依赖 Function Calling。'
  }
  if (config.mcp && !config.agent) {
    return '组合无效 (演示限制): 此演示中 MCP 需挂载于 Agent。'
  }
  if (config.agent && !config.fc) {
    return '组合不存在: Agent 需要 Function Calling 才能行动。'
  }
  return null
}

/**
 * 获取激活的泳道列表
 */
export function getActiveLifelines(config: Config): string[] {
  const activeSet = new Set(['USER', 'HOST', 'LLM'])

  if (config.agent) activeSet.add('AGENT')
  if (config.mcp) activeSet.add('MCP')
  if (config.fc) activeSet.add('TOOLS')

  // 按照 MASTER_ORDER 的顺序过滤
  return MASTER_ORDER.filter(id => activeSet.has(id))
}

/**
 * 计算泳道位置百分比
 */
export function getLifelinePosition(id: string, activeLifelines: string[]): number {
  const index = activeLifelines.indexOf(id)
  if (index === -1) return -1
  return (index + 0.5) * (100 / activeLifelines.length)
}

