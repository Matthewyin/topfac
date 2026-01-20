<template>
  <div class="mermaid-preview">
    <div class="toolbar">
      <div class="left d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-chart-timeline-variant</v-icon>
        <span class="text-body-1 font-weight-medium">Mermaid 预览</span>
        <v-chip v-if="mermaidText" size="small" variant="outlined" color="primary" class="ml-3">
          {{ formatFileSize(mermaidText.length) }}
        </v-chip>
        <v-chip v-if="stats.nodes != null" size="small" class="ml-2" color="blue-lighten-4" variant="outlined">
          节点 {{ stats.nodes }}
        </v-chip>
        <v-chip v-if="stats.edges != null" size="small" class="ml-2" color="green-lighten-4" variant="outlined">
          连接 {{ stats.edges }}
        </v-chip>
      </div>
      <div class="right d-flex align-center">
        <v-btn-toggle v-model="direction" density="compact" divided class="mr-2">
          <v-btn value="LR" size="small">LR</v-btn>
          <v-btn value="TB" size="small">TB</v-btn>
        </v-btn-toggle>
        <v-btn class="mr-2" size="small" variant="outlined" prepend-icon="mdi-refresh" :loading="loadingLocal" @click="refresh">
          刷新
        </v-btn>
        <v-btn class="mr-2" size="small" variant="outlined" prepend-icon="mdi-content-copy" :disabled="!mermaidText" @click="copyToClipboard">
          复制代码
        </v-btn>
        <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-download" :disabled="!canDownload" @click="download">
          下载 .mmd
        </v-btn>
      </div>
    </div>

    <div class="content">
      <div v-if="loadingLocal || loading" class="center">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-body-2 text-grey-darken-1 mt-4">渲染中...</p>
      </div>

      <div v-else-if="error" class="center">
        <v-icon size="56" color="error" class="mb-2">mdi-alert-circle</v-icon>
        <div class="text-body-2 text-error">{{ error }}</div>
      </div>

      <ClientOnly>
        <div v-if="svgHtml" class="svg-container" v-html="svgHtml"></div>
        <div v-else class="center text-grey">暂无可预览内容</div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

interface Props {
  parsedData?: any
  versionId?: string
  storedMermaid?: string
  storedDirection?: 'LR' | 'TB'
  loading?: boolean
}

const props = defineProps<Props>()

const direction = ref<'LR' | 'TB'>(props.storedDirection || 'LR')
const mermaidText = ref('')
const svgHtml = ref('')
const loadingLocal = ref(false)
const error = ref('')
const stats = ref<{ nodes?: number; edges?: number }>({})

const canDownload = computed(() => !!props.versionId || !!mermaidText.value)

const refresh = async () => {
  error.value = ''
  await generateAndRender()
}

const generateAndRender = async () => {
  if (!props.parsedData) {
    error.value = '缺少解析数据，无法生成 Mermaid 内容'
    return
  }
  loadingLocal.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    const resp = await $topologyApi.generateMermaid({
      parsed_data: props.parsedData,
      options: { direction: direction.value }
    })
    if (!resp.success || !resp.data?.mermaid_content) {
      throw new Error(resp.message || '生成 Mermaid 失败')
    }
    mermaidText.value = resp.data.mermaid_content
    stats.value = {
      nodes: resp.data.stats?.nodes,
      edges: resp.data.stats?.edges
    }
    await renderMermaid()
  } catch (e: any) {
    error.value = e?.message || String(e)
    svgHtml.value = ''
  } finally {
    loadingLocal.value = false
  }
}

const renderMermaid = async () => {
  try {
    const mod: any = await import('mermaid')
    const mermaid = mod.default || mod
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'dark' })
    const id = 'mermaid-' + Date.now()
    const { svg } = await mermaid.render(id, mermaidText.value)
    svgHtml.value = svg
  } catch (e: any) {
    error.value = 'Mermaid 渲染失败: ' + (e?.message || String(e))
    svgHtml.value = ''
  }
}

const download = async () => {
  try {
    if (props.versionId) {
      const { $topologyApi } = useNuxtApp()
      await $topologyApi.downloadFormat(props.versionId, 'mermaid')
    } else if (mermaidText.value) {
      const blob = new Blob([mermaidText.value], { type: 'text/plain;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `topology-${Date.now()}.mmd`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    }
  } catch (e) {
    console.error(e)
  }
}

const copyToClipboard = async () => {
  if (!mermaidText.value) return
  try {
    await navigator.clipboard.writeText(mermaidText.value)
  } catch (e) {
    console.error('复制失败', e)
  }
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${['B','KB','MB','GB'][i]}`
}

onMounted(async () => {
  // 若有存储内容且方向一致，先用存储内容渲染一版
  if (props.storedMermaid && (!props.storedDirection || props.storedDirection === direction.value)) {
    mermaidText.value = props.storedMermaid
    await renderMermaid()
  } else if (props.parsedData) {
    await generateAndRender()
  }
})

watch(() => props.parsedData, async (val) => {
  if (val) await generateAndRender()
})

watch(direction, async () => {
  await generateAndRender()
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables.scss' as *;

.mermaid-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--glass-border);
  background: transparent;
  flex-shrink: 0;
}
.content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: rgba(255, 255, 255, 0.02);
}
.center {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.svg-container {
  padding: 16px;
}
.svg-container :deep(svg) {
  width: 100% !important;
  height: auto !important;
  background: transparent !important;
}
</style>

