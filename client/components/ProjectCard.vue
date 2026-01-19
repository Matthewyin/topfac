<template>
  <v-card
    class="project-card card-glass"
    :class="{ 'selected': selected }"
    elevation="0"
    @click="$emit('view', project)"
    v-ripple
  >
    <!-- 项目状态指示器 (光剑风格) -->
    <div class="status-indicator" :class="statusClass" />

    <!-- 选择复选框 -->
    <div class="selection-checkbox" :class="{ 'show': selected }">
      <v-checkbox
        :model-value="selected"
        hide-details
        @click.stop
        @update:model-value="$emit('toggle-select', project.id)"
        density="compact"
        color="primary"
        class="cy-checkbox"
      />
    </div>

    <!-- 卡片头部 -->
    <div class="card-header pt-4 px-4 d-flex align-start justify-space-between">
      <div class="flex-grow-1 pr-4">
        <h3 class="text-h6 font-weight-bold mb-1 d-flex align-center">
          <span class="text-truncate" style="max-width: 200px;">{{ project.project_name }}</span>
          <v-chip
            v-if="project.status === 'deleted'"
            size="x-small"
            color="error"
            variant="flat"
            class="ml-2 px-2"
          >
            已删除
          </v-chip>
        </h3>
        <p class="text-caption text-grey ml-1">
          更新于 {{ formatDate(project.updated_at) }}
        </p>
      </div>
    </div>
  
    <!-- 项目描述 -->
    <v-card-text class="pt-2 px-4 pb-0">
      <p class="text-body-2 text-grey-lighten-1 mb-4 description-text">
        {{ project.description || '暂无项目描述...' }}
      </p>
      
      <!-- 项目统计信息 -->
      <div class="d-flex align-center flex-wrap gap-2 mb-4">
        <v-chip
          size="small"
          variant="outlined"
          color="primary"
          class="glass-chip"
        >
          <v-icon start size="14">mdi-layers-outline</v-icon>
          v{{ project.current_version || 1 }}
        </v-chip>

        <v-chip
          v-if="project.latest_version"
          size="small"
          variant="tonal"
          :color="versionStatusColor"
          class="version-status-chip"
        >
          <v-icon start size="14">{{ versionStatusIcon }}</v-icon>
          {{ versionStatusText }}
        </v-chip>
      </div>
    </v-card-text>
    
    <v-divider class="mx-4 border-opacity-10"></v-divider>
    
    <!-- 卡片操作 -->
    <v-card-actions class="px-4 py-3 action-bar">
      <div class="d-flex w-100 justify-space-between align-center">
        <div class="d-flex gap-2">
           <v-btn
            variant="text"
            size="small"
            color="primary"
            class="action-btn px-2"
            @click.stop="$emit('view', project)"
            prepend-icon="mdi-pencil-outline"
          >
            编辑
          </v-btn>
          
           <v-menu location="bottom end">
             <template v-slot:activator="{ props }">
               <v-btn
                 icon="mdi-dots-horizontal"
                 variant="text"
                 size="small"
                 color="grey"
                 v-bind="props"
                 @click.stop
               ></v-btn>
             </template>
             <v-list density="compact" class="card-glass py-0">
               <v-list-item
                 prepend-icon="mdi-content-copy"
                 title="复制项目"
                 @click="$emit('duplicate', project)"
                 class="item-hover"
               />
               <v-list-item
                 prepend-icon="mdi-delete-outline"
                 title="移入回收站"
                 class="text-error item-hover"
                 @click="$emit('delete', project)"
               />
             </v-list>
           </v-menu>
        </div>

        <v-chip
          :color="statusColor"
          variant="text"
          size="x-small"
          class="text-caption font-weight-bold"
        >
          <v-icon start size="8" icon="mdi-circle" class="mr-1"></v-icon>
          {{ statusText }}
        </v-chip>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义 props
interface Project {
  id: string
  project_name: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  current_version: number
  version_count: number
  latest_version?: {
    version: number
    created_at: string
    status: string
    has_xml: boolean
  }
}

interface Props {
  project: Project
  selected?: boolean
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  view: [project: Project]
  edit: [project: Project]
  delete: [project: Project]
  duplicate: [project: Project]
  'toggle-select': [projectId: string]
}>()

// 计算属性
const statusColor = computed(() => {
  switch (props.project.status) {
    case 'active':
      return 'success'
    case 'archived':
      return 'warning'
    case 'deleted':
      return 'error'
    default:
      return 'grey'
  }
})

const statusText = computed(() => {
  switch (props.project.status) {
    case 'active':
      return '活跃'
    case 'archived':
      return '已归档'
    case 'deleted':
      return '已删除'
    default:
      return '未知'
  }
})

const statusClass = computed(() => {
  return `status-${props.project.status}`
})

const versionStatusColor = computed(() => {
  if (!props.project.latest_version) return 'grey'
  
  switch (props.project.latest_version.status) {
    case 'draft':
      return 'grey'
    case 'parsed':
      return 'info'
    case 'generated':
      return 'success'
    case 'published':
      return 'primary'
    default:
      return 'grey'
  }
})

const versionStatusIcon = computed(() => {
  if (!props.project.latest_version) return 'mdi-help'
  
  switch (props.project.latest_version.status) {
    case 'draft':
      return 'mdi-file-document-outline'
    case 'parsed':
      return 'mdi-cog-outline'
    case 'generated':
      return 'mdi-check-circle-outline'
    case 'published':
      return 'mdi-rocket-launch-outline'
    default:
      return 'mdi-help'
  }
})

const versionStatusText = computed(() => {
  if (!props.project.latest_version) return '无版本'
  
  switch (props.project.latest_version.status) {
    case 'draft':
      return '草稿'
    case 'parsed':
      return '已解析'
    case 'generated':
      return '已生成'
    case 'published':
      return '已发布'
    default:
      return '未知'
  }
})

// 工具函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} 天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}
</script>

<style scoped lang="scss">
.project-card {
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 240, 255, 0.5) !important;
  box-shadow: 0 10px 30px -10px rgba(0, 240, 255, 0.3) !important;

  .selection-checkbox {
    opacity: 1;
  }
  
  .status-indicator {
    box-shadow: 0 0 10px currentColor;
  }
}

.project-card.selected {
  border: 1px solid #00F0FF !important;
  background: rgba(0, 240, 255, 0.05) !important;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2) !important;
  
  .status-indicator {
    width: 6px;
    box-shadow: 0 0 15px currentColor;
  }
}

.selection-checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &.show {
    opacity: 1;
  }
}

.status-indicator {
  position: absolute;
  top: 15%;
  left: 0;
  width: 3px;
  height: 70%;
  border-radius: 0 4px 4px 0;
  transition: all 0.3s ease;
}

.status-active { background-color: #00FF9D; color: #00FF9D; }
.status-archived { background-color: #FFD600; color: #FFD600; }
.status-deleted { background-color: #FF2E2E; color: #FF2E2E; }

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 40px; 
}

.glass-chip {
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}

.action-btn {
  text-transform: none;
  letter-spacing: 0;
  
  &:hover {
    background: rgba(0, 240, 255, 0.1);
    color: #00F0FF !important;
  }
}

.item-hover:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
  
  :deep(.v-icon) {
    color: #fff !important;
  }
}

.gap-2 {
  gap: 8px;
}
</style>
