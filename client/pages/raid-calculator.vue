<template>
  <div class="raid-calculator-page">
    <v-container fluid class="pa-6">
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold text-grey-darken-2 mb-2">RAID 容量计算</h1>
        <p class="text-body-1 text-grey-darken-1">支持 RAID 0/1/5/6/10/50/60，含热备与分组参数；默认使用二进制单位（GiB/TiB）。</p>
        <v-alert type="info" variant="tonal" class="mt-4" density="comfortable">
          纯前端计算，不保存历史数据。
        </v-alert>
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <RaidCalculatorForm :model-value="input" @update:model-value="v => Object.assign(input, v)" />
        </v-col>
        <v-col cols="12" md="6">
          <RaidCalculatorResult :result="result" :unit="input.unit" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import RaidCalculatorForm from '~/components/raid/RaidCalculatorForm.vue'
import RaidCalculatorResult from '~/components/raid/RaidCalculatorResult.vue'
import type { RaidInput } from '~/composables/useRaidCalculator'
import { calculateRaid } from '~/composables/useRaidCalculator'

// 页面元数据
definePageMeta({
  title: 'RAID 容量计算',
  description: 'RAID 容量计算工具 - 纯前端，支持 RAID 0/1/5/6/10/50/60'
})

const input = reactive<RaidInput>({
  level: '0',
  diskCount: 4,
  diskSize: 1,
  unit: 'TiB',
  hotSpares: 0,
  autoGroup: true,
})

const result = computed(() => calculateRaid({ ...input }))
</script>

<style scoped>
.raid-calculator-page { min-height: 100vh; background: #f8f9fa; }
</style>

