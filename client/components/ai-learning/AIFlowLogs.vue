<template>
  <v-card class="logs-panel fill-height" elevation="2" rounded="0">
    <!-- 头部 -->
    <v-card-title class="d-flex justify-space-between align-center bg-grey-lighten-4 pa-3">
      <span class="text-subtitle-1 font-weight-medium text-grey-darken-2">
        数据包日志
      </span>
      <v-btn
        size="small"
        variant="outlined"
        color="grey-darken-1"
        @click="$emit('clear')"
      >
        清除
      </v-btn>
    </v-card-title>

    <!-- 日志列表 -->
    <v-card-text
      class="pa-3 overflow-y-auto"
      style="max-height: calc(100vh - 140px)"
    >
      <!-- 空状态 -->
      <div
        v-if="visibleSteps.length === 0"
        class="text-center text-grey-darken-1 mt-12"
      >
        <v-icon size="48" color="grey-lighten-1" class="mb-2">
          mdi-information-outline
        </v-icon>
        <div class="text-body-2">请配置并点击运行...</div>
      </div>

      <!-- 日志卡片 -->
      <v-card
        v-for="(step, idx) in visibleSteps"
        :key="idx"
        :color="idx === currentStepIndex ? 'warning-lighten-5' : 'white'"
        :border="idx === currentStepIndex ? 'warning md' : undefined"
        class="mb-3"
        elevation="1"
      >
        <!-- 步骤头部 -->
        <v-card-subtitle class="d-flex align-center ga-2 pa-3 pb-2">
          <v-chip size="x-small" color="grey-darken-1">
            {{ idx + 1 }}
          </v-chip>
          <v-chip
            size="x-small"
            :color="ENTITIES[step.from].color"
            variant="flat"
          >
            {{ step.from }}
          </v-chip>
          <v-icon size="small" color="grey-lighten-1">mdi-arrow-right</v-icon>
          <v-chip
            size="x-small"
            :color="ENTITIES[step.to].color"
            variant="flat"
          >
            {{ step.to }}
          </v-chip>
        </v-card-subtitle>

        <!-- JSON 数据 -->
        <v-card-text class="pa-3 pt-0">
          <pre class="json-display">{{ JSON.stringify(step.data, null, 2) }}</pre>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Step } from '~/types/ai-learning'
import { ENTITIES } from '~/types/ai-learning'

interface Props {
  sequence: Step[]
  currentStepIndex: number
}

const props = defineProps<Props>()

defineEmits<{
  'clear': []
}>()

// 可见步骤（只显示到当前步骤）
const visibleSteps = computed(() => {
  if (props.currentStepIndex === -1) return []
  return props.sequence.slice(0, props.currentStepIndex + 1)
})
</script>

<style scoped>
@import '~/assets/styles/ai-learning.scss';

.logs-panel {
  width: 400px;
  background: white;
  border-left: 1px solid #E0E0E0;
  display: flex;
  flex-direction: column;
  z-index: 30;
  flex-shrink: 0;
}

/* 移动端隐藏 */
@media (max-width: 959px) {
  .logs-panel {
    display: none;
  }
}
</style>

