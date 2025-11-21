<template>
  <div class="ai-flow-page">
    <!-- 控制面板 -->
    <AIFlowControls
      :config="config"
      :is-playing="isPlaying"
      :error-msg="errorMsg"
      @update:config="config = $event"
      @start="handleStart"
      @clear-error="errorMsg = null"
    />

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 左侧：时序图 -->
      <AIFlowDiagram
        :sequence="sequence"
        :current-step-index="currentStepIndex"
        :active-lifelines="activeLifelines"
        :is-playing="isPlaying"
      />

      <!-- 右侧：日志面板 -->
      <AIFlowLogs
        :sequence="sequence"
        :current-step-index="currentStepIndex"
        @clear="handleClear"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Config, Step } from '~/types/ai-learning'
import {
  generateSequence,
  validateConfig,
  getActiveLifelines
} from '~/composables/useAIFlowSequence'
import AIFlowControls from '~/components/ai-learning/AIFlowControls.vue'
import AIFlowDiagram from '~/components/ai-learning/AIFlowDiagram.vue'
import AIFlowLogs from '~/components/ai-learning/AIFlowLogs.vue'

// 页面元数据
definePageMeta({
  title: 'AI 架构时序模拟器',
  description: 'AI 架构时序模拟器 - 可视化展示不同 AI 架构模式下的交互流程'
})

// 状态管理
const config = ref<Config>({
  agent: false,
  fc: false,
  mcp: false
})

const sequence = ref<Step[]>([])
const currentStepIndex = ref(-1)
const isPlaying = ref(false)
const errorMsg = ref<string | null>(null)
const activeLifelines = ref<string[]>(['USER', 'HOST', 'LLM'])

// 开始运行
function handleStart() {
  // 验证配置
  const error = validateConfig(config.value)
  if (error) {
    errorMsg.value = error
    isPlaying.value = false
    sequence.value = []
    return
  }

  // 清除错误
  errorMsg.value = null

  // 生成序列
  const seq = generateSequence(config.value)
  sequence.value = seq
  currentStepIndex.value = -1
  isPlaying.value = true

  // 计算激活泳道
  activeLifelines.value = getActiveLifelines(config.value)
}

// 清除日志
function handleClear() {
  sequence.value = []
  currentStepIndex.value = -1
  isPlaying.value = false
}

// 自动播放逻辑
watch([isPlaying, currentStepIndex], ([playing, index]) => {
  if (playing && sequence.value.length > 0) {
    if (index < sequence.value.length - 1) {
      setTimeout(() => {
        currentStepIndex.value++
      }, 1200)
    } else {
      setTimeout(() => {
        isPlaying.value = false
      }, 1000)
    }
  }
})
</script>

<style scoped>
@import '~/assets/styles/ai-learning.scss';
</style>

