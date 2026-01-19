<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    persistent
    class="glass-dialog-backdrop"
  >
    <v-card class="project-dialog card-glass">
      <!-- 对话框标题 -->
      <v-card-title class="d-flex align-center py-4 px-6 border-b-glass">
        <v-icon class="mr-3 neon-icon" color="primary" size="28">
          {{ isEditing ? 'mdi-pencil-circle-outline' : 'mdi-plus-circle-outline' }}
        </v-icon>
        <span class="text-h5 font-weight-bold text-shadow-glow">
          {{ isEditing ? '编辑项目配置' : '创建新项目' }}
        </span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          color="grey-lighten-1"
          class="close-btn"
          @click="closeDialog"
        />
      </v-card-title>
      
      <!-- 表单内容 -->
      <v-card-text class="pa-6">
        <v-form ref="formRef" v-model="formValid" @submit.prevent="saveProject">
          <v-row>
            <!-- 项目名称 -->
            <v-col cols="12">
              <v-text-field
                v-model="form.project_name"
                label="项目名称"
                placeholder="给您的项目起个响亮的名字"
                variant="outlined"
                bg-color="rgba(0,0,0,0.2)"
                color="primary"
                base-color="rgba(255,255,255,0.3)"
                :rules="nameRules"
                :counter="100"
                required
                prepend-inner-icon="mdi-folder-outline"
                class="cyber-input"
              />
            </v-col>
            
            <!-- 项目描述 -->
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="项目描述"
                placeholder="简要描述项目的目标和范围..."
                variant="outlined"
                bg-color="rgba(0,0,0,0.2)"
                color="primary"
                base-color="rgba(255,255,255,0.3)"
                :rules="descriptionRules"
                :counter="500"
                rows="3"
                auto-grow
                prepend-inner-icon="mdi-text"
                class="cyber-input"
              />
            </v-col>
            
            <!-- 初始文本内容 -->
            <v-col cols="12">
              <v-textarea
                v-model="form.text_content"
                :label="isEditing ? '拓扑定义脚本' : '初始拓扑脚本 (模板)'"
                :placeholder="isEditing ? '请输入网络拓扑描述文本' : '已载入标准模板，您可以直接修改'"
                variant="outlined"
                bg-color="rgba(0,0,0,0.2)"
                color="primary"
                base-color="rgba(255,255,255,0.3)"
                :rules="textContentRules"
                rows="12"
                auto-grow
                prepend-inner-icon="mdi-code-braces"
                class="cyber-input code-font"
              >
                <template #append-inner>
                  <v-tooltip text="查看语法参考" location="top">
                    <template #activator="{ props }">
                      <v-btn
                        icon="mdi-help-circle-outline"
                        variant="text"
                        size="small"
                        color="primary"
                        v-bind="props"
                        @click="showFormatHelp = true"
                        class="glow-icon-btn"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </v-textarea>

              <!-- 新项目提示 -->
              <div v-if="!isEditing" class="d-flex align-center mt-2 px-2">
                <v-icon size="16" color="primary" class="mr-2">mdi-lightbulb-on-outline</v-icon>
                <span class="text-caption text-grey-lighten-1">
                  提示：已预置标准企业网络拓扑模板，您可以直接修改或清空重写
                </span>
              </div>
            </v-col>
            
    <!-- 格式提示 -->
            <v-col cols="12">
              <div class="info-glass pa-3 rounded-lg d-flex align-start">
                <v-icon color="primary" class="mr-3 mt-1">mdi-information-outline</v-icon>
                <div class="text-caption text-secondary" style="line-height: 1.6;">
                  <strong class="text-primary-high-emphasis">支持自然语言描述：</strong>
                  系统支持标准化的网络拓扑描述格式（区域、组件、连接关系）。
                  <br>
                  您可以在创建后进入编辑器继续完善脚本。
                </div>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <!-- 操作按钮 -->
      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn
          variant="text"
          color="secondary"
          @click="closeDialog"
          :disabled="saving"
          class="mr-2"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!formValid"
          @click="saveProject"
          class="glow-button px-6 font-weight-bold"
          rounded="pill"
        >
          {{ isEditing ? '保存变更' : '立即创建' }}
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- 格式帮助对话框 -->
    <v-dialog v-model="showFormatHelp" max-width="600">
      <v-card class="card-glass help-card">
        <v-card-title class="d-flex align-center border-b-glass py-3">
          <v-icon class="mr-2" color="primary">mdi-school-outline</v-icon>
          <span class="text-primary-high-emphasis">语法参考指南</span>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="grey"
            @click="showFormatHelp = false"
          />
        </v-card-title>
        
        <v-card-text class="pa-6">
          <div class="format-help">
            <h4 class="text-subtitle-1 font-weight-bold text-primary mb-3">标准语句示例</h4>
            
            <div class="code-block-glass mb-6">
              <code class="text-success">- 【AB区】【数据中心】的【DMZ区】【防火墙】连接【AB区】【数据中心】的【核心区】【核心交换机】</code>
            </div>
            
            <h4 class="text-subtitle-1 font-weight-bold text-primary mb-3">解析规则说明</h4>
            <v-list density="compact" class="bg-transparent">
              <v-list-item class="px-0">
                <template #prepend>
                  <v-icon color="secondary" size="small" class="mr-3">mdi-numeric-1-box</v-icon>
                </template>
                <v-list-item-title class="text-secondary text-wrap">
                  每行代表一个连接关系，建议使用 <span class="text-primary font-weight-bold">-</span> 开头
                </v-list-item-title>
              </v-list-item>
              
              <v-list-item class="px-0">
                <template #prepend>
                  <v-icon color="secondary" size="small" class="mr-3">mdi-numeric-2-box</v-icon>
                </template>
                <v-list-item-title class="text-secondary text-wrap">
                  层级结构：<span class="text-primary-high-emphasis">【环境】【数据中心】【区域】【设备】</span>
                </v-list-item-title>
              </v-list-item>
              
              <v-list-item class="px-0">
                <template #prepend>
                  <v-icon color="secondary" size="small" class="mr-3">mdi-numeric-3-box</v-icon>
                </template>
                <v-list-item-title class="text-secondary text-wrap">
                  设备名称支持自定义，如：Web服务器、MySQL主库、核心路由等
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            color="primary"
            variant="tonal"
            @click="showFormatHelp = false"
            class="px-6"
          >
            我明白了
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'

// 定义 props
interface Project {
  id?: string
  project_name: string
  description?: string
  text_content?: string
  status?: string
}

interface Props {
  modelValue: boolean
  project?: Project | null
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// 响应式数据
const formRef = ref()
const formValid = ref(false)
const saving = ref(false)
const showFormatHelp = ref(false)

// 表单数据
const form = reactive({
  project_name: '',
  description: '',
  text_content: ''
})

// 计算属性
const isEditing = computed(() => !!props.project?.id)

// 验证规则
const nameRules = [
  (v: string) => !!v || '项目名称不能为空',
  (v: string) => (v && v.length <= 100) || '项目名称不能超过100个字符',
  (v: string) => /^[a-zA-Z0-9\u4e00-\u9fff\s\-_]+$/.test(v) || '项目名称只能包含字母、数字、中文、空格、横线和下划线'
]

const descriptionRules = [
  (v: string) => !v || v.length <= 500 || '项目描述不能超过500个字符'
]

const textContentRules = [
  (v: string) => !v || v.length <= 100000 || '文本内容不能超过100000个字符'
]

// 默认模板文字
const getDefaultTemplate = () => {
  return `- 【生产环境】【北京数据中心】的【DMZ区】【Nginx负载均衡】连接【生产环境】【北京数据中心】的【WEB区】【Web应用服务器集群】
- 【生产环境】【北京数据中心】的【WEB区】【Web应用服务器集群】连接【生产环境】【北京数据中心】的【APP区】【业务逻辑服务器】
- 【生产环境】【北京数据中心】的【APP区】【业务逻辑服务器】连接【生产环境】【北京数据中心】的【DB区】【MySQL主从集群】`
}

// 重置表单
const resetForm = () => {
  form.project_name = ''
  form.description = ''
  // 为新项目提供默认模板文字
  form.text_content = isEditing.value ? '' : getDefaultTemplate()

  nextTick(() => {
    formRef.value?.resetValidation()
  })
}

// 监听项目变化，更新表单
watch(() => props.project, (newProject) => {
  if (newProject) {
    // 编辑现有项目
    form.project_name = newProject.project_name || ''
    form.description = newProject.description || ''
    form.text_content = newProject.text_content || ''
  } else {
    // 创建新项目
    resetForm()
  }
}, { immediate: true })

// 关闭对话框
const closeDialog = () => {
  emit('update:modelValue', false)
  resetForm()
}

// 保存项目
const saveProject = async () => {
  if (!formValid.value) return
  
  saving.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    
    const projectData = {
      project_name: form.project_name.trim(),
      description: form.description.trim(),
      text_content: form.text_content.trim()
    }
    
    if (isEditing.value && props.project?.id) {
      // 更新项目
      await $topologyApi.projects.update(props.project.id, projectData)
    } else {
      // 创建项目
      await $topologyApi.projects.create(projectData)
    }
    
    emit('saved')
    closeDialog()
  } catch (error: any) {
    console.error('保存项目失败:', error)

    // 处理不同类型的错误
    let errorMessage = '保存项目失败，请稍后重试'

    if (error?.data?.error) {
      // 后端返回的具体错误信息
      errorMessage = error.data.error
    } else if (error?.message) {
      // 网络或其他错误
      errorMessage = error.message
    }

    // 显示错误提示
    alert(errorMessage)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
/* REMOVED scoped .card-glass override */

.border-b-glass {
   border-bottom: 1px solid var(--glass-border);
}

.neon-icon {
  filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.5));
}

.text-shadow-glow {
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}
/* No glow in light mode */
:deep([data-theme='light']) .text-shadow-glow {
    text-shadow: none;
    color: var(--text-primary);
}

.cyber-input {
  :deep(.v-field__outline__start),
  :deep(.v-field__outline__end),
  :deep(.v-field__outline__notch) {
    border-color: var(--glass-border) !important;
  }
  
  :deep(.v-field--focused) {
    .v-field__outline__start,
    .v-field__outline__end,
    .v-field__outline__notch {
      border-color: #00F0FF !important;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.2) inset;
    }
  }
  
  :deep(input), :deep(textarea) {
    color: var(--text-primary) !important;
  }
  
  :deep(.v-label) {
    color: var(--text-secondary) !important;
  }
}

.code-font :deep(textarea) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.glow-button {
  background: linear-gradient(135deg, #00F0FF 0%, #0088FF 100%) !important;
  color: #000 !important;
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.5);
    transform: translateY(-1px);
  }
}

.glow-icon-btn:hover {
  color: #00F0FF !important;
  filter: drop-shadow(0 0 5px rgba(0, 240, 255, 0.5));
}

.close-btn:hover {
  color: #FF2E2E !important;
  background: rgba(255, 46, 46, 0.1);
}

.info-glass {
  background: rgba(0, 240, 255, 0.03);
  border: 1px solid rgba(0, 240, 255, 0.1);
}

.code-block-glass {
  background: var(--code-bg);
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed var(--glass-border);
}

.help-card {
  border: 1px solid rgba(0, 240, 255, 0.2) !important;
}

/* 滚动条美化 */
:deep(textarea::-webkit-scrollbar) {
  width: 6px;
}
:deep(textarea::-webkit-scrollbar-thumb) {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
:deep(textarea::-webkit-scrollbar-track) {
  background: transparent;
}
</style>
