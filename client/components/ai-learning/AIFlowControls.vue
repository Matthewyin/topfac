<template>
  <v-card class="controls-bar" elevation="1" rounded="0" color="white">
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between flex-wrap ga-4">
        <!-- 标题 -->
        <div class="d-flex align-center">
          <v-icon color="primary" size="large" class="mr-2">
            mdi-chart-timeline-variant
          </v-icon>
          <span class="text-h6 font-weight-medium text-grey-darken-2">
            AI 架构时序模拟器
          </span>
        </div>

        <!-- 控制区 -->
        <div class="d-flex align-center ga-4 flex-wrap">
          <!-- 复选框组 -->
          <v-card variant="outlined" class="pa-3">
            <div class="d-flex align-center ga-3 flex-wrap">
              <!-- 固定启用的组件 -->
              <v-checkbox
                label="Host"
                :model-value="true"
                disabled
                color="primary"
                density="compact"
                hide-details
              />
              <v-checkbox
                label="LLM"
                :model-value="true"
                disabled
                color="success"
                density="compact"
                hide-details
              />

              <v-divider vertical class="mx-2" />

              <!-- 可选组件 -->
              <v-checkbox
                label="Agent"
                :model-value="config.agent"
                @update:model-value="$emit('update:config', { ...config, agent: $event })"
                color="purple"
                density="compact"
                hide-details
              />
              <v-checkbox
                label="Func Call"
                :model-value="config.fc"
                @update:model-value="$emit('update:config', { ...config, fc: $event })"
                color="warning"
                density="compact"
                hide-details
              />
              <v-checkbox
                label="MCP"
                :model-value="config.mcp"
                @update:model-value="$emit('update:config', { ...config, mcp: $event })"
                color="orange"
                density="compact"
                hide-details
              />
            </div>
          </v-card>

          <!-- 运行按钮 -->
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-play"
            :disabled="isPlaying"
            :loading="isPlaying"
            @click="$emit('start')"
          >
            {{ isPlaying ? '运行中...' : '运行' }}
          </v-btn>
        </div>
      </div>

      <!-- 错误提示 -->
      <v-alert
        v-if="errorMsg"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-3 mb-0"
        closable
        @click:close="$emit('clear-error')"
      >
        {{ errorMsg }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Config } from '~/types/ai-learning'

interface Props {
  config: Config
  isPlaying: boolean
  errorMsg: string | null
}

defineProps<Props>()

defineEmits<{
  'update:config': [config: Config]
  'start': []
  'clear-error': []
}>()
</script>

<style scoped>
.controls-bar {
  border-bottom: 1px solid #E0E0E0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}
</style>

