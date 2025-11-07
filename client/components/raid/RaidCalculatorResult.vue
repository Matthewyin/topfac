<template>
  <div>
    <v-alert v-for="(e,i) in result.errors" :key="'e-'+i" type="error" variant="tonal" class="mb-3">
      {{ e }}
    </v-alert>
    <v-alert v-for="(w,i) in result.warnings" :key="'w-'+i" type="warning" variant="tonal" class="mb-3">
      {{ w }}
    </v-alert>

    <v-card v-if="result.errors.length === 0" elevation="2">
      <v-card-title class="text-h6">计算结果</v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="6" lg="4">
            <v-sheet class="pa-4 rounded-lg" color="blue-lighten-5">
              <div class="text-caption text-blue-darken-2">可用容量 ({{ unit }})</div>
              <div class="text-h5 font-weight-bold text-blue-darken-3">{{ fmt(result.usable) }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="6" md="3" lg="2">
            <v-sheet class="pa-4 rounded-lg" color="green-lighten-5">
              <div class="text-caption text-green-darken-2">利用率</div>
              <div class="text-h6 font-weight-bold text-green-darken-3">{{ (result.utilization*100).toFixed(2) }}%</div>
            </v-sheet>
          </v-col>
          <v-col cols="6" md="3" lg="2">
            <v-sheet class="pa-4 rounded-lg" color="grey-lighten-4">
              <div class="text-caption">原始容量 ({{ unit }})</div>
              <div class="text-h6 font-weight-medium">{{ fmt(result.raw) }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="6" md="3" lg="2">
            <v-sheet class="pa-4 rounded-lg" color="amber-lighten-5">
              <div class="text-caption">热备占用 ({{ unit }})</div>
              <div class="text-h6 font-weight-medium">{{ fmt(result.spares) }}</div>
            </v-sheet>
          </v-col>
          <v-col cols="6" md="3" lg="2">
            <v-sheet class="pa-4 rounded-lg" color="deep-orange-lighten-5">
              <div class="text-caption">冗余/校验 ({{ unit }})</div>
              <div class="text-h6 font-weight-medium">{{ fmt(result.overhead) }}</div>
            </v-sheet>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="mb-2"><strong>容错说明：</strong>{{ result.faultTolerance }}</div>
        <div v-if="result.structureNote" class="text-body-2 text-medium-emphasis mb-2">
          结构：{{ result.structureNote }}
        </div>
        <div class="text-caption text-medium-emphasis">最少磁盘数：{{ result.minRequired }}</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { toDisplay, round2 } from '~/composables/useRaidCalculator'
import type { RaidOutput, CapacityUnit } from '~/composables/useRaidCalculator'

const props = defineProps<{ result: RaidOutput, unit: CapacityUnit }>()

function fmt(bytes: number) {
  return round2(toDisplay(bytes, props.unit))
}
</script>

<style scoped>
.text-medium-emphasis { opacity: .75; }
</style>

