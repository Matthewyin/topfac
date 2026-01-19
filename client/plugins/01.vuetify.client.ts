import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: 'dark',
      themes: {
        dark: {
          dark: true,
          colors: {
            background: '#0B0F19',    // Deep Void
            surface: '#1E293B',       // Dark Surface
            primary: '#00F0FF',       // Neon Cyan
            secondary: '#7000FF',     // Electric Purple
            accent: '#FF0055',        // Cyber Pink
            error: '#FF2E2E',
            info: '#00C8FF',
            success: '#00FF9D',
            warning: '#FFD600',
            'on-background': '#FFFFFF',
            'on-surface': '#FFFFFF',
          },
        },
        light: {
          dark: false,
          colors: {
            background: '#F3F4F6',    // Cool Gray
            surface: '#FFFFFF',       // Clean White
            primary: '#0066FF',       // Vivid Blue
            secondary: '#7000FF',     // Electric Purple
            accent: '#FF0055',        // Cyber Pink
            error: '#DC2626',
            info: '#0066FF',
            success: '#059669',
            warning: '#D97706',
            'on-background': '#1E293B',
            'on-surface': '#1E293B',
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
}) 