/**
 * Text-Topology-Service API 客户端
 */

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error_code?: string
  timestamp?: string
}

interface Project {
  id: string
  project_name: string
  description?: string
  status: string
  current_version: number
  version_count: number
  created_at: string
  updated_at: string
}

interface ProjectVersion {
  id: string
  project_id: string
  version: number
  text_content: string
  parsed_data?: any
  xml_content?: string
  mermaid_content?: string
  excalidraw_content?: string
  direction?: 'LR' | 'TB'
  status: string
  created_at: string
  updated_at: string
}

interface PaginationParams {
  page?: number
  limit?: number
  sort_by?: string
  order?: 'asc' | 'desc'
}

interface ProjectListResponse {
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface VersionListResponse {
  versions: ProjectVersion[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class TopologyApiClient {
  private $fetch: any

  constructor(baseURL: string, $fetch: any) {
    // 如果baseURL为空，直接使用$fetch（相对路径）
    // 否则创建一个带baseURL的fetch包装器
    if (!baseURL) {
      this.$fetch = $fetch
    } else {
      // 创建带baseURL的fetch包装器
      this.$fetch = (url: string, options: any = {}) => {
        const fullUrl = baseURL + url
        return $fetch(fullUrl, options)
      }
    }
  }

  // 项目管理 API
  projects = {
    // 获取项目列表
    getList: async (params: PaginationParams = {}): Promise<ApiResponse<ProjectListResponse>> => {
      return await this.$fetch('/api/projects', {
        method: 'GET',
        params
      })
    },

    // 获取项目详情
    getById: async (id: string): Promise<ApiResponse<Project>> => {
      return await this.$fetch(`/api/projects/${id}`, {
        method: 'GET'
      })
    },

    // 创建项目
    create: async (data: {
      project_name: string
      description?: string
      text_content?: string
    }): Promise<ApiResponse<Project>> => {
      return await this.$fetch('/api/projects', {
        method: 'POST',
        body: data
      })
    },

    // 更新项目
    update: async (id: string, data: {
      project_name?: string
      description?: string
      status?: string
    }): Promise<ApiResponse<Project>> => {
      return await this.$fetch(`/api/projects/${id}`, {
        method: 'PUT',
        body: data
      })
    },

    // 删除项目
    delete: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })
    },

    // 获取项目版本列表
    getVersions: async (id: string, params: PaginationParams = {}): Promise<ApiResponse<VersionListResponse>> => {
      return await this.$fetch(`/api/projects/${id}/versions`, {
        method: 'GET',
        params
      })
    },

    // 创建项目新版本
    createVersion: async (id: string, data: {
      text_content: string
    }): Promise<ApiResponse<ProjectVersion>> => {
      return await this.$fetch(`/api/projects/${id}/versions`, {
        method: 'POST',
        body: data
      })
    },

    // 处理完整工作流：解析文本 → 生成XML → 创建版本
    processWorkflow: async (id: string, data: {
      text_content: string
    }): Promise<ApiResponse<{
      version_id: string
      version: number
      parsed_data: any
      xml_generated: boolean
      xml_length: number
    }>> => {
      return await this.$fetch(`/api/projects/${id}/process`, {
        method: 'POST',
        body: data
      })
    }
  }

  // 版本管理 API
  versions = {
    // 获取版本详情
    getById: async (id: string): Promise<ApiResponse<ProjectVersion>> => {
      return await this.$fetch(`/api/versions/${id}`, {
        method: 'GET'
      })
    },

    // 更新版本
    update: async (id: string, data: {
      text_content?: string
      parsed_data?: any
      xml_content?: string
      status?: string
    }): Promise<ApiResponse<ProjectVersion>> => {
      return await this.$fetch(`/api/versions/${id}`, {
        method: 'PUT',
        body: data
      })
    },

    // 删除版本
    delete: async (id: string): Promise<ApiResponse> => {
      return await this.$fetch(`/api/versions/${id}`, {
        method: 'DELETE'
      })
    },

    // 获取版本步骤（占位方法，暂不实现）
    getSteps: async (id: string): Promise<ApiResponse<any>> => {
      // 返回空步骤列表
      return { success: true, data: { steps: [] } }
    },

    // 获取步骤详情（占位方法，暂不实现）
    getStepDetail: async (id: string, stepName: string): Promise<ApiResponse<any>> => {
      // 返回空详情
      return { success: true, data: { step_detail: {} } }
    }
  }

  // 文本解析 API
  parse = async (data: {
    text_content: string
  }): Promise<ApiResponse<{
    topology_name: string
    regions: any[]
    components: any[]
    connections: any[]
  }>> => {
    return await this.$fetch('/api/parse', {
      method: 'POST',
      body: data
    })
  }

  // XML生成 API
  generate = async (data: {
    parsed_data: any
  }): Promise<ApiResponse<{
    xml_content: string
    xml_length: number
  }>> => {
    return await this.$fetch('/api/generate', {
      method: 'POST',
      body: data
    })
  }

  // Mermaid 生成 API
  generateMermaid = async (data: {
    parsed_data: any,
    options?: { direction?: 'LR' | 'TB' }
  }): Promise<ApiResponse<{
    mermaid_content: string
    mermaid_length: number
    stats?: any
    direction: 'LR' | 'TB'
  }>> => {
    return await this.$fetch('/api/generate/mermaid', {
      method: 'POST',
      body: data
    })
  }


  // 系统状态 API
  status = async (): Promise<ApiResponse<{
    database: {
      connected: boolean
      uri: string
    }
    gemini_api: {
      success: boolean
      message: string
      model: string
      response?: string
    }
    deepseek_api: {
      success: boolean
      message: string
      model: string
      response?: string
    }
    server: {
      name: string
      version: string
      port: number
    }
  }>> => {
    return await this.$fetch('/api/status', {
      method: 'GET'
    })
  }

  // 健康检查 API
  health = async (): Promise<{
    status: string
    service: string
    port: number
    database: string
    timestamp: string
  }> => {
    return await this.$fetch('/health', {
      method: 'GET'
    })
  }

  // 下载 XML 文件
  download = async (versionId: string): Promise<void> => {
    return await this.downloadFormat(versionId, 'drawio')
  }

  // 下载指定格式文件
  downloadFormat = async (versionId: string, format: 'drawio' | 'mermaid' | 'excalidraw'): Promise<void> => {
    try {
      const response = await fetch(`/api/versions/${versionId}/download?format=${format}`)

      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`)
      }

      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ext = format === 'drawio' ? 'drawio' : (format === 'mermaid' ? 'mmd' : 'excalidraw.json')
      link.download = `topology-${versionId}.${ext}`
      document.body.appendChild(link)
      link.click()

      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载失败:', error)
      throw error
    }
  }
}

export { TopologyApiClient }
export type {
  Project,
  ProjectVersion,
  ProjectListResponse,
  VersionListResponse,
  PaginationParams,
  ApiResponse
}

