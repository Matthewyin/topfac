/**
 * AI 架构时序模拟器 - 类型定义
 */

/**
 * 实体（泳道）定义
 */
export interface Entity {
  id: string
  name: string
  icon: string
  color: string  // Vuetify 颜色类名
  bg: string     // Vuetify 背景颜色类名
}

/**
 * 时序步骤定义
 */
export interface Step {
  from: string   // 源实体 ID
  to: string     // 目标实体 ID
  label: string  // 步骤标签
  data: Record<string, any>  // JSON 数据包
}

/**
 * 配置选项
 */
export interface Config {
  agent: boolean  // 是否启用 Agent
  fc: boolean     // 是否启用 Function Calling
  mcp: boolean    // 是否启用 MCP
}

/**
 * 实体常量定义
 */
export const ENTITIES: Record<string, Entity> = {
  USER: {
    id: 'USER',
    name: 'User',
    icon: '👤',
    color: 'grey-darken-1',
    bg: 'grey-lighten-4'
  },
  HOST: {
    id: 'HOST',
    name: 'Host/Env',
    icon: '💻',
    color: 'primary',
    bg: 'blue-lighten-5'
  },
  AGENT: {
    id: 'AGENT',
    name: 'Agent Logic',
    icon: '🤖',
    color: 'purple',
    bg: 'purple-lighten-5'
  },
  LLM: {
    id: 'LLM',
    name: 'LLM API',
    icon: '🧠',
    color: 'success',
    bg: 'green-lighten-5'
  },
  MCP: {
    id: 'MCP',
    name: 'MCP Server',
    icon: '🧰',
    color: 'orange',
    bg: 'orange-lighten-5'
  },
  TOOLS: {
    id: 'TOOLS',
    name: 'Actual Tool',
    icon: '🔨',
    color: 'error',
    bg: 'red-lighten-5'
  }
}

/**
 * 泳道主顺序（按通信亲密度排列）
 */
export const MASTER_ORDER = ['USER', 'HOST', 'AGENT', 'LLM', 'MCP', 'TOOLS']

