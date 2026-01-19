<template>
  <v-app class="cyber-app">
    <!-- 应用栏 (隐形/玻璃态) -->
    <v-app-bar
      app
      flat
      height="72"
      class="app-bar-glass"
    >
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        class="d-md-none text-neon-cyan"
      />

      <v-toolbar-title class="ml-4">
        <span class="text-h6 font-weight-bold letter-spacing-1 text-gradient-cyber">
          TOPFAC
        </span>
        <span class="text-caption text-grey-lighten-1 ml-2 font-weight-light opacity-60 hidden-sm-and-down">
          INTELLIGENT TOPOLOGY SYSTEM
        </span>
      </v-toolbar-title>

      <v-spacer />

      <!-- 右侧操作区 -->
      <div class="d-flex align-center pr-4">
        <!-- 主题切换按钮 -->
        <v-btn
          icon
          class="mr-2"
          @click="toggleTheme"
          title="切换主题"
        >
          <v-icon :color="isDark ? 'yellow-darken-1' : 'grey-darken-3'">
            {{ isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}
          </v-icon>
        </v-btn>

        <v-btn
          icon
          class="mr-2 text-primary"
          title="Notifications"
        >
          <v-badge color="accent" dot>
            <v-icon>mdi-bell-outline</v-icon>
          </v-badge>
        </v-btn>

        <v-btn
          class="github-btn glass-button px-4"
          variant="outlined"
          @click="goToGithub"
          rounded="pill"
        >
          <v-icon start icon="mdi-github" />
          GitHub
        </v-btn>
      </div>
    </v-app-bar>

    <!-- 悬浮式玻璃侧边栏 -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!mobile"
      width="280"
      class="drawer-glass my-4 ml-4"
      elevation="0"
      floating
    >
      <div class="pa-4 drawer-header">
        <div class="d-flex align-center justify-center py-2 logo-container">
           <v-icon size="32" color="primary" class="logo-icon rotating">mdi-hexagon-multiple-outline</v-icon>
        </div>
      </div>

      <v-list density="compact" nav class="px-3 mt-2">
        <!-- 主导航项 -->
        <v-list-item
          prepend-icon="mdi-view-dashboard-outline"
          title="仪表盘"
          value="home"
          to="/"
          exact
          active-class="nav-item-active"
          class="mb-2 nav-item"
        />

        <div class="nav-subheader mt-4 mb-2 pl-3 text-caption font-weight-bold text-uppercase text-grey-darken-1">
          工作区
        </div>
        
        <v-list-item
          prepend-icon="mdi-sitemap-outline"
          title="项目管理"
          value="topology-projects"
          to="/topology-projects"
          active-class="nav-item-active"
          class="mb-1 nav-item"
        />
        
        <v-list-item
          prepend-icon="mdi-robot-outline"
          title="AI 生成器"
          value="ai-generator"
          disabled
          class="mb-1 nav-item opacity-50"
        >
          <template v-slot:append>
             <v-chip size="x-small" color="secondary" variant="flat" class="px-1 text-caption">即将推出</v-chip>
          </template>
        </v-list-item>

        <v-list-item
          prepend-icon="mdi-chart-timeline-variant"
          title="AI 架构模拟"
          value="ai-flow"
          to="/ai-learning/aiflow"
          active-class="nav-item-active"
          class="mb-1 nav-item"
        />
      </v-list>
      
      <template v-slot:append>
        <div class="pa-4 text-center">
            <div class="text-caption text-grey">v2.1.0 赛博版</div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- 主内容区域 (带有页面过渡) -->
    <v-main class="main-content">
      <v-container fluid class="pa-4 page-container h-100">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- 全局通知组件 -->
    <GlobalNotification />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

// 使用主题组合式函数
const { isDark, toggleTheme, initTheme } = useTheme()

// 全局通知组件
const GlobalNotification = defineAsyncComponent(() => import('~/components/GlobalNotification.vue'))

// 跳转到 GitHub 仓库
function goToGithub() {
  window.open('https://github.com/Matthewyin/topfac', '_blank')
}

// 响应式状态
const drawer = ref(true)

// 检测移动设备
const mobile = computed(() => {
  if (import.meta.client) {
    return window.innerWidth < 1264
  }
  return false
})

// 组件挂载后设置抽屉状态
onMounted(() => {
  initTheme() // 初始化主题
  drawer.value = !mobile.value

  const handleResize = () => {
    if (window.innerWidth >= 1264) {
      drawer.value = true
    } else {
      drawer.value = false
    }
  }

  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables.scss' as *;

.cyber-app {
  background: transparent !important; /* 让 body 的背景透传 */
}

/* 侧边栏特殊样式覆盖 */
.drawer-glass {
  background: var(--sidebar-bg) !important;
  backdrop-filter: blur(20px) !important; /* Keep blur */
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 16px !important;
  height: calc(100vh - 32px) !important; /* 悬浮效果 */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
}

.nav-item {
  border-radius: 8px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.03);
    transform: translateX(4px);
  }
}

.nav-item-active {
  background: linear-gradient(90deg, rgba(0, 240, 255, 0.1), transparent) !important;
  border-left: 3px solid #00F0FF !important;
  
  :deep(.v-list-item-title) {
    color: #00F0FF !important;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
    font-weight: 600;
  }
  
  :deep(.v-icon) {
    color: #00F0FF !important;
    filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.6));
  }
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.glass-button {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid var(--glass-border) !important;
  color: var(--text-primary) !important;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: #00F0FF !important;
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
    color: #00F0FF !important;
  }
}

.rotating {
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 页面切换动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>