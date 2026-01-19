<template>
  <div class="home-wrapper">
    <!-- 装饰性光斑背景 -->
    <div class="glow-orb orb-1"></div>
    <div class="glow-orb orb-2"></div>

    <v-container fluid class="fill-height align-start pt-16">
      <v-row justify="center" align="center" class="mt-8">
        <!-- Main Hero Section -->
        <v-col cols="12" md="10" lg="8" class="text-center mb-12">
          <div class="hero-chip mb-6">
            <v-chip
              variant="outlined"
              color="primary"
              size="small"
              class="glass-chip" 
            >
              <v-icon start size="14" class="mr-1">mdi-sparkles</v-icon>
              TopFac AI 引擎 v2.0
            </v-chip>
          </div>
          
          <h1 class="text-h2 font-weight-black mb-6 neon-title">
            <span class="text-white">智能网络</span>
            <span class="text-gradient-cyber ml-4">拓扑生成系统</span>
          </h1>
          
          <p class="text-h6 text-grey-lighten-1 font-weight-light mb-8" style="max-width: 600px; margin: 0 auto; line-height: 1.6;">
            使用我们先进的 AGI 引擎，将您的自然语言描述即时转化为专业的网络拓扑图。
          </p>

          <div class="d-flex justify-center gap-4">
             <v-btn
              color="primary"
              size="x-large"
              rounded="pill"
              class="px-8 font-weight-bold glow-button"
              prepend-icon="mdi-rocket-launch"
              @click="navigateToProjects"
            >
              开始创建
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Bento Grid Features -->
      <v-row justify="center" class="mt-8 px-4">
        <v-col cols="12" md="10" lg="9">
          <v-row>
            <!-- 主要功能卡片 -->
            <v-col cols="12" md="7">
              <v-card
                class="card-glass h-100 pa-6 d-flex flex-column justify-space-between interactive-card"
                elevation="0"
                @click="navigateToProjects"
                v-ripple
              >
                <div>
                  <div class="d-flex align-center justify-space-between mb-4">
                    <v-avatar color="rgba(0, 240, 255, 0.1)" size="56" rounded="lg">
                      <v-icon color="primary" size="32">mdi-sitemap</v-icon>
                    </v-avatar>
                    <v-icon color="grey-darken-2">mdi-arrow-top-right</v-icon>
                  </div>
                  
                  <h3 class="text-h4 font-weight-bold text-white mb-2">智能生成</h3>
                  <p class="text-grey-lighten-1 text-body-1">
                    用平实的语言描述您的网络架构，看着它转化为清晰、可编辑的图表。
                  </p>
                </div>
                
                <div class="mt-8">
                  <v-progress-linear
                    model-value="75"
                    color="primary"
                    height="4"
                    rounded
                    class="mb-2"
                  ></v-progress-linear>
                  <div class="text-caption text-primary text-right">处理能力 100%</div>
                </div>
              </v-card>
            </v-col>

            <!-- 侧边小卡片 1 -->
            <v-col cols="12" md="5">
              <v-card
                class="card-glass h-100 pa-6 interactive-card-secondary"
                elevation="0"
              >
                <div class="d-flex align-start mb-6">
                   <v-avatar color="rgba(112, 0, 255, 0.1)" size="48" rounded="lg" class="mr-4">
                      <v-icon color="secondary" size="24">mdi-file-export-outline</v-icon>
                    </v-avatar>
                    <div>
                      <h4 class="text-h6 font-weight-bold text-white">多格式导出</h4>
                      <p class="text-caption text-grey">支持 DrawIO, PNG, SVG</p>
                    </div>
                </div>
                
                <v-divider class="border-opacity-25 mb-4"></v-divider>
                
                <div class="d-flex align-center justify-space-around">
                   <v-chip size="small" variant="text" class="text-white"><v-icon start color="#F08705" size="small">mdi-file-xml-box</v-icon>XML</v-chip>
                   <v-chip size="small" variant="text" class="text-white"><v-icon start color="#29B6F6" size="small">mdi-image</v-icon>PNG</v-chip>
                   <v-chip size="small" variant="text" class="text-white"><v-icon start color="#FF4081" size="small">mdi-vector-curve</v-icon>SVG</v-chip>
                </div>
              </v-card>
            </v-col>
            
            <!-- 底部长条卡片 -->
            <v-col cols="12">
               <v-card class="card-glass pa-4 d-flex align-center justify-space-between mt-2 coming-soon-card disabled-look">
                  <div class="d-flex align-center">
                    <v-icon color="grey" class="mr-4">mdi-brain</v-icon>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold text-grey-lighten-1">AI 逻辑分析</div>
                      <div class="text-caption text-grey-darken-1">高级安全策略验证（即将推出）</div>
                    </div>
                  </div>
                  <v-chip size="small" color="grey-darken-3" variant="flat">v2.2</v-chip>
               </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
definePageMeta({
  title: 'TopFac - Intelligent Topology Generator',
  layout: 'default'
})

const router = useRouter()

function navigateToProjects() {
  router.push('/topology-projects')
}

onMounted(() => {
  console.log('Cyber Interface Loaded')
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables.scss' as *;

.home-wrapper {
  position: relative;
  overflow: hidden;
  min-height: 80vh;
}

/* 光斑特效 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  z-index: -1;
  opacity: 0.4;
  animation: floatOrb 10s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #7000FF 0%, transparent 70%);
  top: -100px;
  left: -100px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #00F0FF 0%, transparent 70%);
  bottom: 0;
  right: -50px;
  animation-delay: -5s;
}

@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 50px); }
}

/* 霓虹标题 */
.neon-title {
  letter-spacing: -0.02em;
  text-shadow: 0 0 40px rgba(0, 240, 255, 0.2);
}

.text-gradient-cyber {
  background: linear-gradient(135deg, #00F0FF 0%, #7000FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 玻璃卡片 */
.glass-chip {
  border-color: rgba(0, 240, 255, 0.3) !important;
  background: rgba(0, 240, 255, 0.05) !important;
  color: #00F0FF !important;
}

.glow-button {
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 40px rgba(0, 240, 255, 0.6);
    transform: translateY(-2px);
  }
}

.glass-button-large {
  border-color: rgba(255, 255, 255, 0.2) !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: #fff !important;
  }
}

.interactive-card {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: #00F0FF !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 240, 255, 0.2) !important;
  }
}

.interactive-card-secondary {
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  transition: border-color 0.3s ease;
  
  &:hover {
    border-color: rgba(112, 0, 255, 0.5) !important;
  }
}

.coming-soon-card {
  background: rgba(0, 0, 0, 0.3) !important;
  border-style: dashed !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.gap-4 {
  gap: 16px;
}
</style>