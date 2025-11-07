<template>
  <div class="responsive-page">
    <v-container fluid class="responsive-container">
      <!-- 系统标题区域 -->
      <v-row class="mb-8">
        <v-col cols="12" class="text-center">
          <h1 class="responsive-title mb-4">
            智能网络拓扑生成系统
          </h1>

        </v-col>
      </v-row>



      <!-- 并排功能卡：拓扑生成 + Excel 合并 -->
      <v-row justify="center" class="responsive-grid">
        <!-- 左卡：拓扑生成 -->
        <v-col cols="12" md="6" lg="5">
          <v-card
            class="dashboard-card responsive-card"
            elevation="4"
            hover
            @click="navigateToProjects"
          >
            <v-card-text class="pa-6">
              <div class="text-center">
                <v-avatar size="80" color="primary" class="mb-4">
                  <v-icon size="40" color="white">mdi-sitemap</v-icon>
                </v-avatar>

                <h2 class="text-h5 font-weight-bold mb-3">
                  智能拓扑生成
                </h2>

                <p class="text-body-1 text-medium-emphasis mb-4">
                  基于自然语言描述生成网络拓扑图，支持DrawIO格式输出
                </p>

                <div class="text-center">
                  <p class="text-body-2 text-medium-emphasis">
                    通过自然语言描述快速生成专业的网络拓扑图
                  </p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 右卡：Excel 合并 -->
        <v-col cols="12" md="6" lg="5">
          <v-card
            class="dashboard-card responsive-card"
            elevation="4"
            hover
            @click="goExcel"
          >
            <v-card-text class="pa-6">
              <div class="text-center">
                <v-avatar size="80" color="green" class="mb-4">
                  <v-icon size="40" color="white">mdi-file-excel-outline</v-icon>
                </v-avatar>

                <h2 class="text-h5 font-weight-bold mb-3">
                  Excel 合并
                </h2>

                <p class="text-body-1 text-medium-emphasis mb-4">
                  本地合并多个 sheet，支持预览与导出 CSV，数据不上传服务器
                </p>

                <div class="text-center">
                  <p class="text-body-2 text-medium-emphasis">
                    点击进入完整工具页进行配置与合并
                  </p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <!-- 第三卡：RAID 容量计算 -->
        <v-col cols="12" md="6" lg="5">
          <v-card
            class="dashboard-card responsive-card"
            elevation="4"
            hover
            @click="goRaid"
          >
            <v-card-text class="pa-6">
              <div class="text-center">
                <v-avatar size="80" color="deep-purple" class="mb-4">
                  <v-icon size="40" color="white">mdi-harddisk</v-icon>
                </v-avatar>

                <h2 class="text-h5 font-weight-bold mb-3">
                  RAID 容量计算
                </h2>

                <p class="text-body-1 text-medium-emphasis mb-4">
                  计算 RAID 0/1/5/6/10/50/60 可用容量、冗余与利用率（含热备与分组）
                </p>

                <div class="text-center">
                  <p class="text-body-2 text-medium-emphasis">
                    点击进入计算页面
                  </p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

      </v-row>


    </v-container>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
definePageMeta({
  title: '智能网络拓扑生成系统 - 首页',
  description: '智能网络拓扑生成系统主页，提供基于自然语言的网络拓扑图生成功能'
})

// 响应式数据
const router = useRouter()


// 跳转到 Excel 合并页面
const goExcel = () => router.push('/excel-merge')


/**
 * 导航到项目管理
 */
function navigateToProjects() {
  router.push('/topology-projects')
}

// 跳转到 RAID 容量计算页面
const goRaid = () => router.push('/raid-calculator')

// 页面加载时的初始化
onMounted(() => {
  console.log('智能网络拓扑生成系统主页已加载')
})


</script>

<style scoped>
.dashboard-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.text-medium-emphasis {
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 960px) {
  .dashboard-card {
    margin-bottom: 1rem;
  }
}

@media (max-width: 600px) {
  .text-h3 {
    font-size: 2rem !important;
  }

  .text-h6 {
    font-size: 1.1rem !important;
  }
}
</style>