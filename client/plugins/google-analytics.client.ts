/**
 * Google Analytics 4 插件
 * 集成GA4到Nuxt.js应用
 */

export default defineNuxtPlugin(() => {
  // 从运行时配置获取GA4衡量ID
  const config = useRuntimeConfig()
  const GA_MEASUREMENT_ID = config.public.googleAnalyticsId

  // 如果没有配置GA4 ID，则不启用
  if (!GA_MEASUREMENT_ID) {
    console.warn('[GA4] Google Analytics ID not configured')
    return
  }

  // 只在客户端启用
  if (process.client) {
    // 加载gtag.js脚本
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)

    // 初始化dataLayer
    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }

    // 配置GA4
    gtag('js', new Date())
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true, // 自动发送页面浏览
      cookie_flags: 'SameSite=None;Secure', // Cookie配置
    })

    console.log(`[GA4] Initialized with ID: ${GA_MEASUREMENT_ID}`)

    // 提供全局gtag函数
    return {
      provide: {
        gtag
      }
    }
  }
})

// TypeScript类型声明
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

