<template>
  <div class="excel-merge-page">
    <v-container fluid class="pa-6">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold text-grey-darken-2 mb-2">
          Excel Sheet Merger
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          多Sheet页Excel合并工具 - 纯前端处理，数据不上传服务器
        </p>
      </div>

      <!-- 隐私说明 -->
      <v-alert
        type="info"
        variant="tonal"
        class="mb-6"
        icon="mdi-lock-outline"
      >
        所有数据处理均在本地完成，不会上传到服务器
      </v-alert>

      <!-- 使用说明 -->
      <v-card class="mb-6" elevation="2">
        <v-card-title class="text-h6">使用步骤</v-card-title>
        <v-card-text>
          <ol class="pl-4">
            <li class="mb-2">上传包含多个sheet页的Excel文件（.xlsx或.xls格式）</li>
            <li class="mb-2">选择需要合并的列，配置分隔符和其他选项</li>
            <li class="mb-2">预览合并结果，确认无误后下载CSV文件</li>
          </ol>
        </v-card-text>
      </v-card>

      <!-- 主内容区域 - 嵌入sheetmerge的HTML -->
      <div class="sheetmerge-container">
        <!-- 文件上传区域 -->
        <v-card class="mb-6" elevation="2">
          <v-card-text>
            <div id="upload-area" class="upload-zone" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
              <input type="file" id="file-input" ref="fileInput" accept=".xlsx,.xls" hidden @change="handleFileSelect">
              <div class="upload-prompt text-center pa-8">
                <v-icon size="64" color="primary" class="mb-4">mdi-file-excel-outline</v-icon>
                <p class="text-h6 mb-2">点击或拖拽Excel文件到此处</p>
                <p class="text-body-2 text-grey">支持 .xlsx 和 .xls 格式</p>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 配置面板 -->
        <v-card v-if="showConfig" class="mb-6" elevation="2">
          <v-card-title>配置合并选项</v-card-title>
          <v-card-text>
            <div class="mb-4">
              <p class="text-body-2 mb-2">检测到 <strong>{{ sheetCount }}</strong> 个工作表</p>
            </div>

            <!-- 列选择 -->
            <div class="mb-4">
              <p class="text-subtitle-1 font-weight-medium mb-2">选择要合并的列：</p>
              <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                💡 提示：选中的列将合并所有sheet页的内容，未选中的列保留第一个sheet的值
              </v-alert>
              <div id="column-list" class="mb-3">
                <!-- 动态生成的复选框 -->
              </div>
              <div class="d-flex gap-2">
                <v-btn size="small" variant="outlined" @click="selectAllColumns">全选</v-btn>
                <v-btn size="small" variant="outlined" @click="deselectAllColumns">取消全选</v-btn>
              </div>
            </div>

            <!-- 分隔符配置 -->
            <div class="mb-4">
              <p class="text-subtitle-1 font-weight-medium mb-2">合并分隔符：</p>
              <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                💡 提示：多个sheet的同一单元格值将用此分隔符连接
              </v-alert>
              <v-select
                id="separator-select"
                v-model="separator"
                :items="separatorOptions"
                variant="outlined"
                density="compact"
                class="mb-2"
              />
              <v-text-field
                v-if="separator === 'custom'"
                id="custom-separator"
                v-model="customSeparator"
                placeholder="输入自定义分隔符"
                variant="outlined"
                density="compact"
              />
            </div>

            <!-- 其他选项 -->
            <div class="mb-4">
              <v-checkbox
                id="skip-empty"
                v-model="skipEmpty"
                label="跳过空单元格"
                density="compact"
              />
              <v-alert type="info" variant="tonal" density="compact">
                💡 提示：勾选后，合并时将忽略空单元格，避免多余的分隔符
              </v-alert>
            </div>

            <v-btn
              id="merge-btn"
              color="primary"
              size="large"
              block
              :disabled="!canMerge"
              @click="startMerge"
            >
              开始合并
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- 预览区域 -->
        <v-card v-if="showPreview" elevation="2">
          <v-card-title>合并结果预览 (前10行)</v-card-title>
          <v-card-text>
            <div class="mb-4">
              <span class="mr-4">总行数: <strong>{{ totalRows }}</strong></span>
              <span>总列数: <strong>{{ totalCols }}</strong></span>
            </div>
            <div class="table-container mb-4" style="overflow-x: auto;">
              <table id="preview-table" class="preview-table">
                <!-- 动态生成的表格 -->
              </table>
            </div>
            <div class="d-flex gap-2">
              <v-btn color="primary" size="large" @click="downloadCSV">
                <v-icon left>mdi-download</v-icon>
                下载CSV文件
              </v-btn>
              <v-btn variant="outlined" size="large" @click="reset">
                <v-icon left>mdi-refresh</v-icon>
                重新配置
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-container>

    <!-- 加载动画 -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
      <p class="text-white mt-4">{{ loadingText }}</p>
    </v-overlay>

    <!-- 消息提示 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'

// 页面元数据
definePageMeta({
  title: 'Excel合并工具',
  description: '多Sheet页Excel合并工具'
})

// 响应式数据
const fileInput = ref<HTMLInputElement | null>(null)
const showConfig = ref(false)
const showPreview = ref(false)
const sheetCount = ref(0)
const separator = ref('\\n')
const customSeparator = ref('')
const skipEmpty = ref(true)
const canMerge = ref(false)
const totalRows = ref(0)
const totalCols = ref(0)
const loading = ref(false)
const loadingText = ref('处理中...')
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// 分隔符选项
const separatorOptions = [
  { title: '换行符 (\\n)', value: '\\n' },
  { title: '逗号 (,)', value: ',' },
  { title: '分号 (;)', value: ';' },
  { title: '竖线 (|)', value: '|' },
  { title: '自定义', value: 'custom' }
]

// SheetJS和AppController实例
let appController: any = null

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleFile(target.files[0])
  }
}

// 处理拖拽
const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    handleFile(files[0])
  }
}

// 处理文件
const handleFile = async (file: File) => {
  if (!appController) {
    showMessage('系统初始化中，请稍后再试', 'error')
    return
  }

  try {
    loading.value = true
    loadingText.value = '正在读取文件...'

    // 直接调用AppController的handleFileUpload方法
    await appController.handleFileUpload(file)

    // 文件上传成功后，显示配置面板
    showConfig.value = true

    // 更新sheet数量
    if (appController.state.parsedData) {
      sheetCount.value = appController.state.parsedData.sheets.length
    }

    loading.value = false
    showMessage('文件上传成功！', 'success')
  } catch (error: any) {
    loading.value = false
    showMessage(error.message || '文件处理失败', 'error')
    console.error('文件处理错误:', error)
  }
}

// 全选列
const selectAllColumns = () => {
  if (appController) appController.selectAllColumns()
}

// 取消全选
const deselectAllColumns = () => {
  if (appController) appController.deselectAllColumns()
}

// 开始合并
const startMerge = () => {
  if (appController) appController.handleMerge()
}

// 下载CSV
const downloadCSV = () => {
  if (appController) appController.handleDownload()
}

// 重新配置（从预览返回配置）
const reset = () => {
  if (appController) {
    appController.state.mergedData = null
  }
  showPreview.value = false
  showConfig.value = true
}

// 显示消息
const showMessage = (text: string, color: string = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

// 组件挂载后加载SheetJS和应用脚本（幂等、单例化加载）
onMounted(async () => {
  try {
    console.log('开始加载Excel合并工具依赖...')

    const w: any = window as any

    // 全局：保证只加载一次（跨路由/重复挂载也复用）
    if (!w.__sheetmergeLoader) {
      w.__sheetmergeLoader = (async () => {
        // 简单的等待函数
        const waitFor = async (fn: () => any, name: string, maxWaitMs = 5000) => {
          const start = Date.now()
          while (Date.now() - start < maxWaitMs) {
            if (fn()) return true
            await new Promise(r => setTimeout(r, 50))
          }
          throw new Error(`等待${name}超时（${maxWaitMs}ms）`)
        }

        // 脚本加载：同一src只加载一次
        w.__sheetmergeScripts = w.__sheetmergeScripts || {}
        const ensureScriptOnce = (src: string) => {
          if (w.__sheetmergeScripts[src]) return w.__sheetmergeScripts[src]
          w.__sheetmergeScripts[src] = new Promise((resolve, reject) => {
            const s = document.createElement('script')
            s.type = 'text/javascript'
            s.src = src
            s.onload = () => resolve(true)
            s.onerror = (e) => reject(e)
            document.head.appendChild(s)
          })
          return w.__sheetmergeScripts[src]
        }

        // 1) SheetJS（若已存在则跳过）
        if (!w.XLSX) {
          console.log('加载SheetJS...')
          await ensureScriptOnce('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js')
          if (!w.XLSX) throw new Error('XLSX库未正确加载')
          console.log('✓ SheetJS加载成功')
          console.log('✓ XLSX库验证通过')
        } else {
          console.log('↩︎ 已存在XLSX，跳过加载')
        }

        // 2) 业务脚本（若 window 上已存在则跳过注入）
        const scripts = [
          { src: '/sheetmerge/js/ErrorTypes.js?v=20251102', check: () => w.FileTypeError, name: 'FileTypeError' },
          { src: '/sheetmerge/js/ExcelParser.js?v=20251102', check: () => w.ExcelParser, name: 'ExcelParser' },
          { src: '/sheetmerge/js/DataMerger.js?v=20251102', check: () => w.DataMerger, name: 'DataMerger' },
          { src: '/sheetmerge/js/CSVGenerator.js?v=20251102', check: () => w.CSVGenerator, name: 'CSVGenerator' },
          { src: '/sheetmerge/js/AppController.js?v=20251102', check: () => w.AppController, name: 'AppController' }
        ]

        for (const { src, check, name } of scripts) {
          if (check()) {
            console.log(`↩︎ ${name} 已存在，跳过加载`)
            continue
          }
          console.log(`加载 ${src}...`)
          await ensureScriptOnce(src)
          await waitFor(check, name)
          console.log(`✓ ${name} 类已正确导出`)
        }

        // 最终验证
        const missing = [
          ['FileTypeError', w.FileTypeError],
          ['ExcelParser', w.ExcelParser],
          ['DataMerger', w.DataMerger],
          ['CSVGenerator', w.CSVGenerator],
          ['AppController', w.AppController]
        ].filter(([n, c]) => !c).map(([n]) => n)
        if (missing.length) {
          throw new Error(`以下类未正确加载: ${missing.join(', ')}`)
        }
        console.log('✓ 所有依赖类验证通过')
      })()
    }

    // 等待全局加载完成
    await w.__sheetmergeLoader

    // 初始化AppController（不调用init，避免DOM事件冲突）；若已创建可复用
    if (!appController) {
      appController = new w.AppController()
      appController.excelParser = new w.ExcelParser()
      appController.dataMerger = new w.DataMerger()
      appController.csvGenerator = new w.CSVGenerator()

      // 将 AppController 的 UI 方法桥接到 Vue 组件，避免依赖原生 DOM ID
      appController.showLoading = (text: string = '处理中...') => {
        loadingText.value = text
        loading.value = true
      }
      appController.hideLoading = () => {
        loading.value = false
      }
      appController.showMessage = (type: string, text: string) => {
        const colorMap: Record<string, string> = { info: 'info', success: 'success', error: 'error', warning: 'warning' }
        showMessage(text, colorMap[type] || 'info')
      }
      appController.hideMessage = () => {
        snackbar.value.show = false
      }
      // 打开配置面板：仅生成列复选框并切换到配置视图
      appController.showConfigPanel = async () => {
        showConfig.value = true
        showPreview.value = false
        sheetCount.value = appController.state?.parsedData?.sheets?.length || 0
        await nextTick()
        appController.generateColumnCheckboxes()
      }
      // 显示预览：更新统计并渲染表格，切换到预览视图
      appController.showPreview = async () => {
        const mergedData = appController.state?.mergedData
        if (!mergedData) return
        totalRows.value = mergedData.rowCount
        totalCols.value = mergedData.colCount
        showPreview.value = true
        showConfig.value = false
        await nextTick()
        appController.generatePreviewTable()
      }
      // 下载：去除对 #download-btn 的依赖
      appController.handleDownload = () => {
        try {
          const { mergedData, currentFile } = appController.state
          if (!mergedData) throw new w.DownloadError('没有可下载的数据')
          appController.showLoading('正在生成文件...')
          setTimeout(() => {
            try {
              const csvContent = appController.csvGenerator.generateCSV(mergedData)
              let fileName = 'merged.csv'
              if (currentFile && currentFile.name) {
                const originalName = currentFile.name.replace(/\.(xlsx|xls)$/i, '')
                fileName = `${originalName}_merged.csv`
              }
              appController.csvGenerator.downloadCSV(csvContent, fileName)
              appController.hideLoading()
              appController.showMessage('success', `文件下载成功：${fileName}`)
            } catch (err: any) {
              appController.hideLoading()
              appController.showMessage('error', err?.message || '生成失败')
            }
          }, 100)
        } catch (err: any) {
          appController.hideLoading()
          appController.showMessage('error', err?.message || '下载失败')
        }
      }

      // 同步合并按钮状态到 Vue：取代 DOM 直接禁用
      appController.updateMergeButtonState = () => {
        const len = appController?.state?.config?.selectedColumns?.length || 0
        canMerge.value = len > 0
      }
      // 合并过程：防止重复点击
      const __origHandleMerge = appController.handleMerge.bind(appController)
      appController.handleMerge = async () => {
        try {
          canMerge.value = false
          await __origHandleMerge()
        } finally {
          const len = appController?.state?.config?.selectedColumns?.length || 0
          canMerge.value = len > 0
        }
      }

      console.log('✓ AppController实例已创建')
    } else {
      console.log('↩︎ 复用已有 AppController 实例')
    }

    console.log('✓ Excel合并工具初始化完成')
    showMessage('系统初始化成功', 'success')
  } catch (error: any) {
    console.error('初始化失败:', error)
    showMessage(`系统初始化失败: ${error.message}`, 'error')
  }
})
</script>

<style scoped>
.excel-merge-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.upload-zone {
  border: 2px dashed #1976D2;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-zone:hover {
  border-color: #1565C0;
  background-color: rgba(25, 118, 210, 0.05);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.preview-table th {
  background-color: #1976D2;
  color: white;
  font-weight: 500;
}

.preview-table tr:nth-child(even) {
  background-color: #f5f5f5;
}
</style>

