// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-01-19',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  ssr: false,

  // 开发服务器配置 - 端口30100
  devServer: {
    port: 30100,
    host: '0.0.0.0'
  },

  // 生产环境配置
  nitro: {
    minify: true,
    preset: process.env.NODE_ENV === 'production' ? 'node-server' : undefined,
    experimental: {
      wasm: false
    },
    esbuild: {
      options: {
        target: 'node18'
      }
    },
    rollupConfig: {
      external: [],
      output: {
        inlineDynamicImports: false
      }
    },
    moduleSideEffects: [],
    prerender: {
      routes: ['/']
    }
  },

  // CSS框架配置
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
    '@excalidraw/excalidraw/index.css',
    '~/assets/styles/variables.scss',
    '~/assets/styles/responsive.scss',
    '~/assets/styles/ai-learning.scss',
    '~/assets/styles/cyber-theme.scss'
  ],

  // 构建配置
  build: {
    transpile: ['vuetify'],
    analyze: process.env.ANALYZE === 'true'
  },

  // 性能优化
  experimental: {
    payloadExtraction: false
  },

  // Vite配置
  vite: {
    ssr: {
      noExternal: ['vuetify']
    },
    build: {
      chunkSizeWarningLimit: 1000
    }
  },

  // 模块配置
  modules: [
    '@nuxt/eslint'
  ],

  // 应用配置
  app: {
    head: {
      title: 'TopFac 智能网络拓扑生成系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'TopFac 智能网络拓扑生成系统，支持自然语言转DrawIO格式' },
        { name: 'keywords', content: '网络拓扑,DrawIO,AI转换,拓扑图生成' }
      ],
      link: [
        { rel: 'canonical', href: 'https://topfac.nssa.io' }
      ],
      script: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID ? [
        {
          src: `https://www.googletagmanager.com/gtag/js?id=${process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID}`,
          async: true
        },
        {
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID}');
          `
        }
      ] : []
    }
  },

  // 运行时配置
  runtimeConfig: {
    // 服务器端配置
    private: {
      apiSecret: '123'
    },
    // 客户端配置
    public: {
      // Google Analytics 4 衡量ID（从环境变量读取）
      googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID || '',
      // API基础URL
      topologyApiUrl: process.env.TOPOLOGY_API_URL || ''  // 使用相对路径，自动适配当前域名
    }
  },

  // 组件配置
  components: {
    global: true,
    dirs: ['~/components']
  },

  // 自动导入
  imports: {
    autoImport: true
  },

  // TypeScript配置
  typescript: {
    typeCheck: false
  },

  // 插件配置
  plugins: [
    { src: '~/plugins/01.vuetify.client.ts', mode: 'client' },
    { src: '~/plugins/topology-api.client.ts', mode: 'client' }
  ]
})