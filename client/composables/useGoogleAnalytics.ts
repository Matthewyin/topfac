/**
 * Google Analytics 4 事件追踪组合式函数
 * 提供TopFac业务事件追踪功能
 */

export const useGoogleAnalytics = () => {
  /**
   * 发送自定义事件到GA4
   */
  const sendEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (process.client && window.gtag) {
      window.gtag('event', eventName, eventParams)
      console.log('[GA4] Event sent:', eventName, eventParams)
    }
  }

  /**
   * 追踪页面浏览
   */
  const trackPageView = (pagePath: string, pageTitle?: string) => {
    sendEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href
    })
  }

  /**
   * 追踪创建项目
   */
  const trackCreateProject = (projectName: string, projectId?: string) => {
    sendEvent('create_project', {
      project_name: projectName,
      project_id: projectId,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪AI转换
   */
  const trackAIConvert = (params: {
    inputLength: number
    success: boolean
    duration?: number
    errorMessage?: string
  }) => {
    sendEvent('ai_convert', {
      input_length: params.inputLength,
      success: params.success,
      duration_ms: params.duration,
      error_message: params.errorMessage,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪生成拓扑图
   */
  const trackGenerateTopology = (params: {
    deviceCount: number
    connectionCount: number
    versionNumber?: number
    projectId?: string
  }) => {
    sendEvent('generate_topology', {
      device_count: params.deviceCount,
      connection_count: params.connectionCount,
      version_number: params.versionNumber,
      project_id: params.projectId,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪下载拓扑图
   */
  const trackDownloadTopology = (params: {
    fileFormat: 'drawio' | 'png' | 'svg' | 'xml'
    projectId?: string
    projectName?: string
  }) => {
    sendEvent('download_topology', {
      file_format: params.fileFormat,
      project_id: params.projectId,
      project_name: params.projectName,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪错误事件
   */
  const trackError = (params: {
    errorType: string
    errorMessage: string
    pagePath?: string
    stackTrace?: string
  }) => {
    sendEvent('app_error', {
      error_type: params.errorType,
      error_message: params.errorMessage,
      page_path: params.pagePath || window.location.pathname,
      stack_trace: params.stackTrace,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪按钮点击
   */
  const trackButtonClick = (buttonName: string, buttonLocation?: string) => {
    sendEvent('button_click', {
      button_name: buttonName,
      button_location: buttonLocation,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪表单提交
   */
  const trackFormSubmit = (formName: string, formData?: Record<string, any>) => {
    sendEvent('form_submit', {
      form_name: formName,
      form_data: formData,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪搜索
   */
  const trackSearch = (searchTerm: string, searchResults?: number) => {
    sendEvent('search', {
      search_term: searchTerm,
      search_results: searchResults,
      timestamp: Date.now()
    })
  }

  /**
   * 追踪用户互动时长
   */
  const trackEngagement = (params: {
    engagementType: string
    duration: number
    details?: Record<string, any>
  }) => {
    sendEvent('user_engagement', {
      engagement_type: params.engagementType,
      duration_ms: params.duration,
      ...params.details,
      timestamp: Date.now()
    })
  }

  return {
    sendEvent,
    trackPageView,
    trackCreateProject,
    trackAIConvert,
    trackGenerateTopology,
    trackDownloadTopology,
    trackError,
    trackButtonClick,
    trackFormSubmit,
    trackSearch,
    trackEngagement
  }
}

