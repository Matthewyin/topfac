import { useTheme as useVuetifyTheme } from 'vuetify'

export const useTheme = () => {
  const theme = useVuetifyTheme()
  const isDark = useState('theme-dark', () => true)

  const toggleTheme = () => {
    isDark.value = !isDark.value
    theme.global.name.value = isDark.value ? 'dark' : 'light'
    updateBodyAttribute()
  }

  const updateBodyAttribute = () => {
    if (import.meta.client) {
      document.body.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    }
  }

  const initTheme = () => {
    if (import.meta.client) {
      // 默认深色模式
      theme.global.name.value = 'dark'
      isDark.value = true
      updateBodyAttribute()
    }
  }

  return {
    isDark,
    toggleTheme,
    initTheme
  }
}
