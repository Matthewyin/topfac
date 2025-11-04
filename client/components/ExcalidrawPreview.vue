<template>
  <div class="excalidraw-preview">
    <div class="toolbar">
      <div class="left d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-vector-rectangle</v-icon>
        <span class="text-body-1 font-weight-medium">Excalidraw 预览</span>
        <v-chip v-if="excalidrawText" size="small" variant="outlined" color="primary" class="ml-3">
          {{ formatFileSize(excalidrawText.length) }}
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
        <v-btn class="mr-2" size="small" variant="outlined" prepend-icon="mdi-content-copy" :disabled="!excalidrawText" @click="copyToClipboard">
          复制 JSON
        </v-btn>
        <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-download" :disabled="!canDownload" @click="download">
          下载 .excalidraw.json
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
        <div v-show="!error" ref="mountEl" class="viewer-container"></div>
        <div v-if="!error && !excalidrawText" class="center text-grey">暂无可预览内容</div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

interface Props {
  parsedData?: any
  versionId?: string
  storedExcalidraw?: string
  storedDirection?: 'LR' | 'TB'
  loading?: boolean
}

const props = defineProps<Props>()

const direction = ref<'LR' | 'TB'>(props.storedDirection || 'LR')
const excalidrawText = ref('')
const excalidrawObj = ref<any>(null)
const loadingLocal = ref(false)
const error = ref('')
const stats = ref<{ nodes?: number; edges?: number }>({})

const canDownload = computed(() => !!props.versionId || !!excalidrawText.value)

const mountEl = ref<HTMLElement | null>(null)
let reactRoot: any = null
let React: any = null
let createRoot: any = null
let ExcalidrawComp: any = null

const ensureLibs = async () => {
  if (!React) {
    const reactMod: any = await import('react')
    React = reactMod.default || reactMod
  }
  if (!createRoot) {
    const reactDomMod: any = await import('react-dom/client')
    createRoot = reactDomMod.createRoot
  }
  if (!ExcalidrawComp) {
    const mod: any = await import('@excalidraw/excalidraw')
    ExcalidrawComp = mod.Excalidraw || mod.default
  }
}

const renderViewer = async () => {
  await ensureLibs()
  if (!mountEl.value) return
  // 重新挂载以应用新的 initialData
  if (reactRoot) {
    try { reactRoot.unmount() } catch {}
    reactRoot = null
  }
  reactRoot = createRoot(mountEl.value)
  const element = React.createElement(ExcalidrawComp, {
    initialData: excalidrawObj.value,
    viewModeEnabled: true,
    zenModeEnabled: true,
    gridModeEnabled: true,
    UIOptions: {
      canvasActions: {
        changeViewBackgroundColor: true,
        export: true,
        loadScene: false,
        saveToActiveFile: false,
        toggleTheme: true,
        clearCanvas: false,
      }
    }
  })
  reactRoot.render(element)
}

const refresh = async () => {
  error.value = ''
  await generateAndRender()
}

const generateAndRender = async () => {
  if (!props.parsedData) {
    error.value = '缺少解析数据，无法生成 Excalidraw 内容'
    return
  }
  loadingLocal.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    const resp = await $topologyApi.generateExcalidraw({
      parsed_data: props.parsedData,
      options: { direction: direction.value }
    })
    if (!resp.success || !resp.data?.excalidraw_content) {
      throw new Error(resp.message || '生成 Excalidraw 失败')
    }
    excalidrawText.value = resp.data.excalidraw_content
    excalidrawObj.value = JSON.parse(excalidrawText.value)
    stats.value = {
      nodes: resp.data.stats?.nodes,
      edges: resp.data.stats?.edges
    }
    await renderViewer()
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loadingLocal.value = false
  }
}

const download = async () => {
  try {
    if (props.versionId) {
      const { $topologyApi } = useNuxtApp()
      await $topologyApi.downloadFormat(props.versionId, 'excalidraw')
    } else if (excalidrawText.value) {
      const blob = new Blob([excalidrawText.value], { type: 'application/json;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `topology-${Date.now()}.excalidraw.json`
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
  if (!excalidrawText.value) return
  try {
    await navigator.clipboard.writeText(excalidrawText.value)
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
  try {
    if (props.storedExcalidraw && (!props.storedDirection || props.storedDirection === direction.value)) {
      excalidrawText.value = props.storedExcalidraw
      excalidrawObj.value = JSON.parse(excalidrawText.value)
      await renderViewer()
    } else if (props.parsedData) {
      await generateAndRender()
    }
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
})

watch(() => props.parsedData, async (val) => {
  if (val) await generateAndRender()
})

watch(direction, async () => {
  await generateAndRender()
})

onBeforeUnmount(() => {
  if (reactRoot) {
    try { reactRoot.unmount() } catch {}
    reactRoot = null
  }
})
</script>

<style scoped>
.excalidraw-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.12);
  background: #fafafa;
  flex-shrink: 0;
}
.content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: white;
}
.center {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(0,0,0,0.54);
}
.viewer-container {
  height: 100%;
}
</style>

