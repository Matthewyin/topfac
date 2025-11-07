<template>
  <v-card elevation="2">
    <v-card-title class="text-h6">参数配置</v-card-title>
    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="form.level"
            :items="levelItems"
            label="RAID 级别"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="form.diskCount"
            type="number"
            label="磁盘总数 N"
            min="0"
            step="1"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="form.hotSpares"
            type="number"
            label="热备盘数量 S"
            min="0"
            step="1"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <div class="d-flex align-end gap-2">
            <v-text-field
              v-model.number="form.diskSize"
              type="number"
              label="单盘容量"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              hide-details
              class="flex-grow-1"
            />
            <v-select
              v-model="form.unit"
              :items="unitItems"
              label="单位"
              variant="outlined"
              density="comfortable"
              hide-details
              style="max-width: 120px"
            />
          </div>
        </v-col>

        <!-- 高级选项：仅在 RAID50/60 显示 -->
        <v-col cols="12" v-if="isAdv">
          <v-divider class="my-2" />
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2">高级选项（分组）</div>
            <v-switch v-model="form.autoGroup" label="自动分组" hide-details density="compact" />
          </div>

          <v-row dense v-if="!form.autoGroup">
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.groupCount"
                type="number"
                label="组数 k"
                min="0"
                step="1"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.groupSize"
                type="number"
                label="每组磁盘数 g"
                min="0"
                step="1"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { RaidInput, RaidLevel, CapacityUnit } from '~/composables/useRaidCalculator'

const props = defineProps<{ modelValue: RaidInput }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: RaidInput): void
}>()

const levelItems = [
  { title: 'RAID 0', value: '0' },
  { title: 'RAID 1', value: '1' },
  { title: 'RAID 5', value: '5' },
  { title: 'RAID 6', value: '6' },
  { title: 'RAID 10', value: '10' },
  { title: 'RAID 50', value: '50' },
  { title: 'RAID 60', value: '60' },
] as { title: string, value: RaidLevel }[]

const unitItems = [
  { title: 'GiB', value: 'GiB' },
  { title: 'TiB', value: 'TiB' },
  { title: 'GB', value: 'GB' },
  { title: 'TB', value: 'TB' },
] as { title: string, value: CapacityUnit }[]

const form = reactive<RaidInput>({ ...props.modelValue })

watch(() => props.modelValue, (v) => {
  Object.assign(form, v)
})

watch(form, () => {
  emit('update:modelValue', { ...form })
})

const isAdv = computed(() => form.level === '50' || form.level === '60')
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>

