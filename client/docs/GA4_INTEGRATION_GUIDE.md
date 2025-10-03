# Google Analytics 4 集成指南

## 📊 概述

TopFac项目已集成Google Analytics 4 (GA4)，用于追踪用户行为和业务事件。

**配置方式：** 环境变量
**环境变量名：** `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`
**生产环境衡量ID：** `G-NV6BCFPN7W`
**域名：** `topfac.nssa.io`

> **注意：** GA4衡量ID通过环境变量配置，不会硬编码在代码中。详见[环境变量配置指南](../../docs/ENVIRONMENT_VARIABLES.md)

---

## 🚀 已完成的集成

### 1. 基础配置

- ✅ GA4插件：`client/plugins/google-analytics.client.ts`
- ✅ 事件追踪组合式函数：`client/composables/useGoogleAnalytics.ts`
- ✅ Nuxt配置更新：已添加GA4插件到配置文件

### 2. 可用的追踪方法

```typescript
const { 
  trackPageView,           // 页面浏览
  trackCreateProject,      // 创建项目
  trackAIConvert,          // AI转换
  trackGenerateTopology,   // 生成拓扑图
  trackDownloadTopology,   // 下载拓扑图
  trackError,              // 错误追踪
  trackButtonClick,        // 按钮点击
  trackFormSubmit,         // 表单提交
  trackSearch,             // 搜索
  trackEngagement          // 用户互动
} = useGoogleAnalytics()
```

---

## 📝 使用示例

### 示例1：在项目创建时追踪

**文件：** `client/components/ProjectDialog.vue`

```vue
<script setup lang="ts">
import { useGoogleAnalytics } from '~/composables/useGoogleAnalytics'

const { trackCreateProject } = useGoogleAnalytics()

const saveProject = async () => {
  try {
    const result = await api.createProject(form.value)
    
    // 追踪创建项目事件
    trackCreateProject(form.value.project_name, result.project_id)
    
    emit('projectSaved', result)
  } catch (error) {
    console.error('创建项目失败:', error)
  }
}
</script>
```

### 示例2：在AI转换时追踪

**文件：** `client/components/AIConversionPanel.vue`

```vue
<script setup lang="ts">
import { useGoogleAnalytics } from '~/composables/useGoogleAnalytics'

const { trackAIConvert } = useGoogleAnalytics()

const handleConvert = async () => {
  const startTime = Date.now()
  
  try {
    const result = await convertWithAI(textContent.value)
    const duration = Date.now() - startTime
    
    // 追踪AI转换成功
    trackAIConvert({
      inputLength: textContent.value.length,
      success: true,
      duration
    })
    
    emit('conversionComplete', result)
  } catch (error) {
    const duration = Date.now() - startTime
    
    // 追踪AI转换失败
    trackAIConvert({
      inputLength: textContent.value.length,
      success: false,
      duration,
      errorMessage: error.message
    })
  }
}
</script>
```

### 示例3：在生成拓扑图时追踪

**文件：** `client/pages/topology-editor/[id].vue`

```vue
<script setup lang="ts">
import { useGoogleAnalytics } from '~/composables/useGoogleAnalytics'

const { trackGenerateTopology } = useGoogleAnalytics()

const generateTopology = async () => {
  try {
    const result = await api.generateTopology(projectId)
    
    // 追踪生成拓扑图
    trackGenerateTopology({
      deviceCount: result.devices.length,
      connectionCount: result.connections.length,
      versionNumber: result.version,
      projectId: projectId
    })
    
    showSuccess('拓扑图生成成功')
  } catch (error) {
    console.error('生成失败:', error)
  }
}
</script>
```

### 示例4：在下载拓扑图时追踪

```vue
<script setup lang="ts">
import { useGoogleAnalytics } from '~/composables/useGoogleAnalytics'

const { trackDownloadTopology } = useGoogleAnalytics()

const downloadTopology = (format: 'drawio' | 'png' | 'svg') => {
  // 执行下载逻辑
  performDownload(format)
  
  // 追踪下载事件
  trackDownloadTopology({
    fileFormat: format,
    projectId: currentProject.value.id,
    projectName: currentProject.value.name
  })
}
</script>
```

### 示例5：在错误发生时追踪

**文件：** `client/composables/useErrorHandler.ts`

```typescript
import { useGoogleAnalytics } from '~/composables/useGoogleAnalytics'

export const useErrorHandler = () => {
  const { trackError } = useGoogleAnalytics()
  
  const handleError = (error: Error, context?: string) => {
    console.error('Error:', error)
    
    // 追踪错误
    trackError({
      errorType: error.name || 'UnknownError',
      errorMessage: error.message,
      pagePath: window.location.pathname,
      stackTrace: error.stack
    })
    
    // 显示错误提示
    showErrorNotification(error.message)
  }
  
  return { handleError }
}
```

---

## 🎯 TopFac业务事件列表

### 核心业务事件

| 事件名称 | 说明 | 参数 |
|---------|------|------|
| `create_project` | 创建项目 | project_name, project_id |
| `ai_convert` | AI转换 | input_length, success, duration_ms, error_message |
| `generate_topology` | 生成拓扑图 | device_count, connection_count, version_number, project_id |
| `download_topology` | 下载拓扑图 | file_format, project_id, project_name |
| `app_error` | 应用错误 | error_type, error_message, page_path, stack_trace |

### 通用事件

| 事件名称 | 说明 | 参数 |
|---------|------|------|
| `page_view` | 页面浏览 | page_path, page_title, page_location |
| `button_click` | 按钮点击 | button_name, button_location |
| `form_submit` | 表单提交 | form_name, form_data |
| `search` | 搜索 | search_term, search_results |
| `user_engagement` | 用户互动 | engagement_type, duration_ms |

---

## 🔍 在GA4中查看事件

### 1. 实时报告

1. 登录GA4：https://analytics.google.com
2. 选择媒体资源：**TopFac Production**
3. 左侧菜单：**报告 > 实时**
4. 查看实时事件流

### 2. 事件报告

1. 左侧菜单：**报告 > 互动 > 事件**
2. 查看所有事件列表
3. 点击事件名称查看详细参数

### 3. 调试视图（DebugView）

1. 左侧菜单：**配置 > DebugView**
2. 在开发环境中启用调试模式
3. 实时查看事件发送情况

---

## 🛠️ 开发环境调试

### 启用调试模式

在浏览器控制台执行：

```javascript
// 启用GA4调试模式
window.gtag('config', 'G-NV6BCFPN7W', {
  debug_mode: true
})
```

### 查看事件日志

所有事件发送都会在控制台输出：

```
[GA4] Event sent: create_project { project_name: "测试项目", project_id: "123" }
```

---

## 📊 数据保留策略

### GA4数据保留

- **事件数据保留期：** 14个月
- **用户数据重置：** 已启用
- **增强型衡量：** 已启用

### 服务器日志保留

#### OpenResty访问日志（180天）

**配置文件：** `openresty/conf/nginx.conf`

```nginx
http {
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    # 访问日志（保留180天）
    access_log /var/log/openresty/access.log main;
    
    # 日志轮转配置
    # 每天轮转，保留180天
}
```

**日志轮转配置：** `/etc/logrotate.d/openresty`

```
/var/log/openresty/*.log {
    daily
    rotate 180
    missingok
    notifempty
    compress
    delaycompress
    sharedscripts
    postrotate
        [ -f /var/run/openresty.pid ] && kill -USR1 `cat /var/run/openresty.pid`
    endscript
}
```

#### Node.js应用日志（10天）

**配置文件：** `server/logger.ts`（需要创建）

```typescript
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '10d', // 保留10天
      maxSize: '20m'
    })
  ]
})

export default logger
```

---

## ✅ 下一步行动

### 需要在代码中添加事件追踪的位置：

1. **项目管理**
   - [ ] `client/components/ProjectDialog.vue` - 创建/编辑项目
   - [ ] `client/pages/topology-projects.vue` - 删除项目、批量操作

2. **AI转换**
   - [ ] `client/components/AIConversionPanel.vue` - AI转换
   - [ ] `client/components/AIConfigPanel.vue` - AI配置

3. **拓扑图生成**
   - [ ] `client/pages/topology-editor/[id].vue` - 生成拓扑图
   - [ ] 下载功能 - 下载拓扑图

4. **错误处理**
   - [ ] `client/composables/useErrorHandler.ts` - 全局错误追踪
   - [ ] `client/components/GlobalErrorHandler.vue` - 错误显示

5. **页面浏览**
   - [ ] `client/app.vue` - 路由变化追踪

---

## 📞 支持

如有问题，请联系开发团队或查看GA4官方文档：
https://developers.google.com/analytics/devguides/collection/ga4

