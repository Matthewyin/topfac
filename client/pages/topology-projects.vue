<template>
  <div class="topology-projects-page home-wrapper">
    <!-- 背景装饰 -->
    <div class="glow-orb orb-1"></div>
    <div class="glow-orb orb-2"></div>
    
    <div class="topology-projects responsive-container pt-8">
      <!-- 页面标题和操作栏 -->
      <div class="d-flex justify-space-between align-end mb-8 header-section">
        <div>
          <div class="d-flex align-center mb-2">
            <v-icon color="primary" class="mr-3" size="32">mdi-hexagon-multiple-outline</v-icon>
            <h1 class="text-h4 font-weight-bold neon-text">
              项目工作台
            </h1>
          </div>
          <p class="text-subtitle-1 text-secondary ml-1 opacity-80">
            管理与编排您的网络拓扑生成项目
          </p>
        </div>
        
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="showCreateDialog = true"
          class="glow-button font-weight-bold px-6"
          rounded="pill"
        >
          新建项目
        </v-btn>
      </div>

      <!-- 项目列表容器 -->
      <v-card class="card-glass pa-0" elevation="0">
        <!-- 工具栏 -->
        <div class="d-flex align-center px-6 py-4 border-b-glass">
          <div class="d-flex align-center">
            <v-icon color="secondary" class="mr-2">mdi-folder-multiple-outline</v-icon>
            <span class="text-h6 font-weight-medium">项目列表</span>
            
            <v-chip
              class="ml-4 glass-chip"
              size="small"
              variant="outlined"
            >
              共 {{ pagination.total }} 个
            </v-chip>
          </div>
          
          <v-spacer />

          <!-- 批量操作区 -->
          <div v-if="selectedProjects.length > 0" class="d-flex align-center mr-6 animate-fade-in">
            <span class="text-caption text-grey mr-3">已选 {{ selectedProjects.length }} 项</span>
            
            <v-btn
              color="error"
              variant="text"
              size="small"
              prepend-icon="mdi-delete-outline"
              class="mr-2"
              @click="showBatchDeleteDialog = true"
            >
              批量删除
            </v-btn>

            <v-btn
              v-if="hasDeletedProjects"
              color="success"
              variant="text"
              size="small"
              prepend-icon="mdi-restore"
              class="mr-2"
              @click="batchRestore"
            >
              批量恢复
            </v-btn>

            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              color="grey"
              @click="clearSelection"
              title="取消选择"
            ></v-btn>
          </div>

          <!-- 视图筛选 -->
          <div class="view-toggles glass-toggle rounded-pill pa-1">
            <v-btn-toggle
              v-model="viewMode"
              mandatory
              density="compact"
              variant="text"
              class="bg-transparent"
            >
              <v-btn value="all" size="small" class="rounded-pill px-4 text-caption">
                全部
              </v-btn>
              <v-btn value="active" size="small" class="rounded-pill px-4 text-caption">
                活跃
              </v-btn>
              <v-btn value="deleted" size="small" class="rounded-pill px-4 text-caption">
                回收站
              </v-btn>
            </v-btn-toggle>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="text-center pa-12">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            width="6"
          />
          <p class="text-body-1 text-neon-cyan mt-6 tracking-widest">LOADING DATA...</p>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="projects.length === 0" class="text-center pa-16 empty-state">
          <div class="empty-icon-wrapper mb-6">
             <v-icon size="80" color="rgba(255,255,255,0.1)">mdi-folder-open-outline</v-icon>
          </div>
          <h3 class="text-h6 text-grey-lighten-2 mb-2">暂无项目数据</h3>
          <p class="text-body-2 text-grey mb-6">
            您的工作台还是空的，立即开始创建一个新的拓扑项目吧
          </p>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-plus"
            @click="showCreateDialog = true"
            class="glass-button px-6"
            rounded="pill"
          >
            创建一个项目
          </v-btn>
        </div>
        
        <!-- 内容区域 -->
        <div v-else class="pa-6">
          <!-- 全选控制 -->
          <div class="d-flex align-center mb-4 px-2">
            <v-checkbox
              v-model="selectAll"
              :indeterminate="selectedProjects.length > 0 && selectedProjects.length < projects.length"
              label="全选所有项目"
              hide-details
              density="compact"
              color="primary"
              @change="toggleSelectAll"
              class="cy-checkbox"
            />
          </div>

          <!-- 项目网格 -->
          <div v-if="filteredProjects.length > 0">
            <v-row>
              <v-col
                v-for="project in filteredProjects"
                :key="project.id"
                cols="12"
                md="6"
                lg="4"
                xl="3"
              >
                <ProjectCard
                  :project="project"
                  :selected="selectedProjects.includes(project.id)"
                  @edit="editProject"
                  @delete="deleteProject"
                  @view="viewProject"
                  @duplicate="duplicateProject"
                  @toggle-select="toggleProjectSelection"
                />
              </v-col>
            </v-row>
            
            <!-- 分页 -->
            <div v-if="pagination.pages > 1" class="d-flex justify-center mt-8">
              <v-pagination
                v-model="pagination.page"
                :length="pagination.pages"
                :total-visible="7"
                @update:model-value="loadProjects"
                active-color="primary"
                variant="outlined"
                class="glass-pagination"
              />
            </div>
          </div>
        </div>
      </v-card>

      <!-- 创建/编辑项目对话框 -->
      <ProjectDialog
        v-model="showCreateDialog"
        :project="editingProject"
        @saved="onProjectSaved"
      />

      <!-- 删除确认对话框 -->
      <v-dialog v-model="showDeleteDialog" max-width="400">
        <v-card class="card-glass pa-4">
          <v-card-title class="text-h6 text-white">
            <v-icon color="error" class="mr-2">mdi-alert-circle-outline</v-icon>
            确认删除
          </v-card-title>
          <v-card-text class="text-grey-lighten-1">
            确定要将项目 <span class="text-white font-weight-bold">"{{ deletingProject?.project_name }}"</span> 移入回收站吗？
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              color="grey-lighten-1"
              @click="showDeleteDialog = false"
            >
              取消
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              :loading="deleting"
              @click="confirmDelete"
              class="px-4"
            >
              确认删除
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 批量删除确认对话框 -->
      <v-dialog v-model="showBatchDeleteDialog" max-width="500">
        <v-card class="card-glass pa-4">
          <v-card-title class="text-h6 text-white">
            批量删除项目
          </v-card-title>
          <v-card-text class="text-grey-lighten-1 pt-4">
            <p class="mb-6">
              已选中 <span class="text-primary font-weight-bold">{{ selectedProjects.length }}</span> 个项目，请选择删除方式：
            </p>

            <v-radio-group v-model="batchDeleteMode" hide-details class="mb-4">
              <v-radio
                value="soft"
                color="warning"
                class="mb-2"
              >
                <template v-slot:label>
                  <div class="text-white">移入回收站 <span class="text-caption text-grey">(可恢复)</span></div>
                </template>
              </v-radio>
              <v-radio
                value="hard"
                color="error"
              >
                 <template v-slot:label>
                  <div class="text-white">永久销毁 <span class="text-caption text-error">(不可恢复)</span></div>
                </template>
              </v-radio>
            </v-radio-group>

            <v-alert
              v-if="batchDeleteMode === 'hard'"
              type="error"
              variant="outlined"
              density="compact"
              class="mt-2 glass-alert"
              icon="mdi-alert"
            >
              <strong>严重警告：</strong> 此操作将永久擦除所有选中的项目数据，无法撤销！
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              color="grey"
              @click="showBatchDeleteDialog = false"
            >
              取消
            </v-btn>
            <v-btn
              :color="batchDeleteMode === 'hard' ? 'error' : 'warning'"
              variant="flat"
              :loading="batchDeleting"
              @click="confirmBatchDelete"
              class="px-6"
            >
              执行操作
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 页面元数据
definePageMeta({
  title: '网络拓扑项目管理',
  description: '管理和编辑网络拓扑项目'
})

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const deleting = ref(false)
const projects = ref([])

// 对话框状态
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingProject = ref(null)
const deletingProject = ref(null)

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0,
  pages: 0
})

// 批量操作相关
const selectedProjects = ref([])
const selectAll = ref(false)
const showBatchDeleteDialog = ref(false)
const batchDeleteMode = ref('soft')
const batchDeleting = ref(false)
const viewMode = ref('all')



// 计算属性
const filteredProjects = computed(() => {
  if (viewMode.value === 'all') return projects.value
  if (viewMode.value === 'active') return projects.value.filter(p => p.status !== 'deleted')
  if (viewMode.value === 'deleted') return projects.value.filter(p => p.status === 'deleted')
  return projects.value
})

const allProjectsCount = computed(() => projects.value.length)
const activeProjectsCount = computed(() => projects.value.filter(p => p.status !== 'deleted').length)
const deletedProjectsCount = computed(() => projects.value.filter(p => p.status === 'deleted').length)

const hasDeletedProjects = computed(() => {
  return selectedProjects.value.some(id => {
    const project = projects.value.find(p => p.id === id)
    return project && project.status === 'deleted'
  })
})

const deletedSelectedCount = computed(() => {
  return selectedProjects.value.filter(id => {
    const project = projects.value.find(p => p.id === id)
    return project && project.status === 'deleted'
  }).length
})

// 加载项目列表
const loadProjects = async () => {
  loading.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    const response = await $topologyApi.projects.getList({
      page: pagination.page,
      limit: pagination.limit,
      status: 'active'
    })

    projects.value = response.data.projects
    pagination.total = response.data.pagination.total
    pagination.pages = response.data.pagination.pages
  } catch (error) {
    console.error('加载项目失败:', error)
    // 显示错误提示
  } finally {
    loading.value = false
  }
}



// 编辑项目
const editProject = (project) => {
  editingProject.value = project
  showCreateDialog.value = true
}

// 查看项目
const viewProject = (project) => {
  router.push(`/topology-editor/${project.id}`)
}

// 删除项目
const deleteProject = (project) => {
  deletingProject.value = project
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!deletingProject.value) return
  
  deleting.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.projects.delete(deletingProject.value.id)
    
    // 重新加载项目列表
    await loadProjects()
    
    showDeleteDialog.value = false
    deletingProject.value = null
  } catch (error) {
    console.error('删除项目失败:', error)
  } finally {
    deleting.value = false
  }
}

// 复制项目
const duplicateProject = async (project) => {
  try {
    const { $topologyApi } = useNuxtApp()
    await $topologyApi.projects.create({
      project_name: `${project.project_name} - 副本`,
      description: project.description,
      text_content: ''
    })
    
    await loadProjects()
  } catch (error) {
    console.error('复制项目失败:', error)
  }
}

// 项目保存回调
const onProjectSaved = () => {
  showCreateDialog.value = false
  editingProject.value = null
  loadProjects()
}

// 批量操作方法
const toggleProjectSelection = (projectId) => {
  const index = selectedProjects.value.indexOf(projectId)
  if (index > -1) {
    selectedProjects.value.splice(index, 1)
  } else {
    selectedProjects.value.push(projectId)
  }
  updateSelectAllState()
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProjects.value = filteredProjects.value.map(p => p.id)
  } else {
    selectedProjects.value = []
  }
}

const updateSelectAllState = () => {
  const filteredIds = filteredProjects.value.map(p => p.id)
  const selectedInFiltered = selectedProjects.value.filter(id => filteredIds.includes(id))
  selectAll.value = selectedInFiltered.length === filteredIds.length && filteredIds.length > 0
}

const clearSelection = () => {
  selectedProjects.value = []
  selectAll.value = false
}

// 批量删除
const confirmBatchDelete = async () => {
  if (selectedProjects.value.length === 0) return

  batchDeleting.value = true
  try {
    const { $topologyApi } = useNuxtApp()
    const result = await $topologyApi.projects.batchDelete({
      project_ids: selectedProjects.value,
      hard_delete: batchDeleteMode.value === 'hard'
    })

    console.log('批量删除结果:', result)

    // 重新加载项目列表
    await loadProjects()

    // 清除选择
    clearSelection()
    showBatchDeleteDialog.value = false

    // 显示结果通知
    if (result.data) {
      const { success, failed } = result.data
      if (failed.length > 0) {
        console.warn('部分项目删除失败:', failed)
      }
    }

  } catch (error) {
    console.error('批量删除失败:', error)
  } finally {
    batchDeleting.value = false
  }
}

// 批量恢复
const batchRestore = async () => {
  const deletedProjects = selectedProjects.value.filter(id => {
    const project = projects.value.find(p => p.id === id)
    return project && project.status === 'deleted'
  })

  if (deletedProjects.length === 0) return

  try {
    const { $topologyApi } = useNuxtApp()

    // 逐个恢复项目
    for (const projectId of deletedProjects) {
      await $topologyApi.projects.restore(projectId)
    }

    // 重新加载项目列表
    await loadProjects()

    // 清除选择
    clearSelection()

  } catch (error) {
    console.error('批量恢复失败:', error)
  }
}

// 组件挂载
onMounted(() => {
  loadProjects()
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables.scss' as *;

.home-wrapper {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

/* 轨道光斑 - Light mode adaptation needed or they look ok? */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: -1;
  opacity: 0.3;
}
.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #7000FF 0%, transparent 70%);
  top: -200px;
  left: -100px;
}
.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #00F0FF 0%, transparent 70%);
  bottom: 100px;
  right: -100px;
}

.neon-text {
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
}
/* Reduce neon glow in light mode */
:deep([data-theme='light']) .neon-text {
    text-shadow: none;
    color: var(--text-primary);
}

/* REMOVED scoped .card-glass override to use global one */

.border-b-glass {
  border-bottom: 1px solid var(--glass-border);
}

.glow-button {
  background: linear-gradient(135deg, #00F0FF 0%, #0088FF 100%) !important;
  color: #000 !important;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 35px rgba(0, 240, 255, 0.6);
    transform: translateY(-2px);
  }
}

.glass-button {
  border-color: rgba(255, 255, 255, 0.2);
  &:hover {
    border-color: #00F0FF;
    background: rgba(0, 240, 255, 0.05);
  }
}

.glass-toggle {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-chip {
  border-color: rgba(0, 240, 255, 0.3) !important;
  color: #00F0FF !important;
  background: rgba(0, 240, 255, 0.05) !important;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 分页器样式覆盖 */
::v-deep(.v-pagination__item) {
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.6) !important;
}
::v-deep(.v-pagination__item--is-active) {
  background-color: #00F0FF !important;
  border-color: #00F0FF !important;
  color: #000 !important;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.glass-alert {
  background: rgba(255, 46, 46, 0.1) !important;
  border-color: rgba(255, 46, 46, 0.3) !important;
  color: #FF2E2E !important;
}
</style>
