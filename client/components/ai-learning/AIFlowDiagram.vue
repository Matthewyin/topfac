<template>
  <div ref="scrollRef" class="diagram-container">
    <div
      class="diagram-content"
      :style="{
        height: containerHeight,
        minHeight: '100%',
        position: 'relative',
        paddingBottom: '80px',
        transition: 'height 0.5s ease-out'
      }"
    >
      <!-- 泳道背景 -->
      <div
        v-for="id in activeLifelines"
        :key="id"
        class="lifeline-container"
        :style="{
          left: `${getLifelinePosition(id, activeLifelines)}%`,
          transform: 'translateX(-50%)'
        }"
      >
        <!-- 泳道头部 -->
        <div class="lifeline-header">
          <v-card
            :color="ENTITIES[id].bg"
            class="lifeline-badge pa-3"
            elevation="2"
          >
            <div class="text-center">
              <div class="text-h5 mb-1">{{ ENTITIES[id].icon }}</div>
              <div
                class="text-caption font-weight-bold"
                :class="`text-${ENTITIES[id].color}`"
              >
                {{ ENTITIES[id].name }}
              </div>
            </div>
          </v-card>
        </div>

        <!-- 泳道虚线 -->
        <div class="lifeline-line"></div>
      </div>

      <!-- 步骤渲染 -->
      <div
        v-for="(step, idx) in visibleSteps"
        :key="idx"
        class="step-container"
        :style="{
          top: `${100 + idx * 80}px`,
          height: '80px'
        }"
      >
        <!-- 自环情况 -->
        <div
          v-if="step.from === step.to"
          class="self-loop"
          :style="{
            left: `${getLifelinePosition(step.from, activeLifelines)}%`,
            transform: 'translateX(-50%)'
          }"
        >
          <v-chip
            :color="idx === currentStepIndex ? 'warning' : 'grey-lighten-2'"
            size="small"
            prepend-icon="mdi-reload"
          >
            {{ step.label }}
          </v-chip>
        </div>

        <!-- 正常箭头 -->
        <div
          v-else
          class="arrow-container"
          :style="{
            left: `${arrowLeft(step)}%`,
            width: `${arrowWidth(step)}%`
          }"
        >
          <AIFlowArrow
            :width-percent="100"
            :is-left-to-right="isLeftToRight(step)"
            :label="step.label"
            :is-current="idx === currentStepIndex"
            :index="idx"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Step } from '~/types/ai-learning'
import { ENTITIES } from '~/types/ai-learning'
import { getLifelinePosition } from '~/composables/useAIFlowSequence'
import AIFlowArrow from './AIFlowArrow.vue'

interface Props {
  sequence: Step[]
  currentStepIndex: number
  activeLifelines: string[]
  isPlaying: boolean
}

const props = defineProps<Props>()

const scrollRef = ref<HTMLElement | null>(null)

// 可见步骤（只显示到当前步骤）
const visibleSteps = computed(() => {
  return props.sequence.slice(0, props.currentStepIndex + 1)
})

// 容器动态高度
const containerHeight = computed(() => {
  return `${(props.currentStepIndex + 5) * 100}px`
})

// 箭头位置计算
function arrowLeft(step: Step): number {
  const startPos = getLifelinePosition(step.from, props.activeLifelines)
  const endPos = getLifelinePosition(step.to, props.activeLifelines)
  return Math.min(startPos, endPos)
}

function arrowWidth(step: Step): number {
  const startPos = getLifelinePosition(step.from, props.activeLifelines)
  const endPos = getLifelinePosition(step.to, props.activeLifelines)
  return Math.abs(endPos - startPos)
}

function isLeftToRight(step: Step): boolean {
  const startPos = getLifelinePosition(step.from, props.activeLifelines)
  const endPos = getLifelinePosition(step.to, props.activeLifelines)
  return endPos > startPos
}

// 自动滚动到底部
watch(() => props.currentStepIndex, async () => {
  if (scrollRef.value && props.isPlaying) {
    await nextTick()
    scrollRef.value.scrollTo({
      top: scrollRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
})
</script>

<style scoped>
@import '~/assets/styles/ai-learning.scss';

.step-container {
  position: absolute;
  width: 100%;
}

.arrow-container {
  position: absolute;
}

.self-loop {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>

