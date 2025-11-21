<template>
  <div class="arrow-wrapper">
    <div :style="{ width: `${widthPercent}%`, position: 'relative', height: '100%' }">
      <!-- SVG 箭头 -->
      <svg width="100%" height="100%" style="overflow: visible">
        <defs>
          <marker
            :id="`arrowhead-${index}`"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              :fill="color"
              :style="{
                opacity: isCurrent ? 0 : 1,
                animation: isCurrent ? 'fadeArrow 0.1s linear 0.6s forwards' : 'none'
              }"
            />
          </marker>
        </defs>
        <line
          :x1="isLeftToRight ? '0' : '100%'"
          y1="50%"
          :x2="isLeftToRight ? '100%' : '0'"
          y2="50%"
          :stroke="color"
          stroke-width="2"
          :marker-end="`url(#arrowhead-${index})`"
          pathLength="1"
          :stroke-dasharray="isCurrent ? '1' : 'none'"
          :stroke-dashoffset="isCurrent ? '1' : '0'"
          :style="{
            animation: isCurrent ? 'drawLine 0.6s ease-out forwards' : 'none'
          }"
        />
      </svg>

      <!-- 箭头标签 -->
      <v-chip
        :color="isCurrent ? 'warning' : 'grey-lighten-1'"
        size="small"
        class="arrow-label"
        :class="{ 'is-current': isCurrent }"
        :style="{
          opacity: isCurrent ? 0 : 1,
          animation: isCurrent ? 'fadeArrow 0.3s ease-out forwards' : 'none'
        }"
      >
        {{ label }}
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  widthPercent: number
  isLeftToRight: boolean
  label: string
  isCurrent: boolean
  index: number
}

const props = defineProps<Props>()

const color = computed(() => props.isCurrent ? '#FFC107' : '#9E9E9E')
</script>

<style scoped>
.arrow-wrapper {
  position: absolute;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.arrow-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-weight: 600;
  font-size: 0.75rem;
}

/* SVG 动画 */
@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fadeArrow {
  to {
    opacity: 1;
  }
}
</style>

