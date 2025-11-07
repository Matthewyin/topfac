export type RaidLevel = '0' | '1' | '5' | '6' | '10' | '50' | '60'

export type CapacityUnit = 'GiB' | 'TiB' | 'GB' | 'TB'

export interface RaidInput {
  level: RaidLevel
  diskCount: number // N
  diskSize: number  // C (per-disk capacity, numeric)
  unit: CapacityUnit // input/display unit; default TiB at UI 层
  hotSpares: number  // S
  // Advanced for RAID50/60
  groupCount?: number // k
  groupSize?: number  // g
  autoGroup?: boolean // 优先自动分组
}

export interface RaidOutput {
  raw: number        // bytes
  spares: number     // bytes
  usable: number     // bytes
  overhead: number   // bytes
  utilization: number // 0..1
  minRequired: number
  faultTolerance: string
  structureNote?: string
  k?: number
  g?: number
  warnings: string[]
  errors: string[]
}

const BYTES_IN: Record<CapacityUnit, number> = {
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
  GB:  1000 ** 3,
  TB:  1000 ** 4,
}

function toBytes(value: number, unit: CapacityUnit): number {
  if (!isFinite(value) || value < 0) return 0
  return value * BYTES_IN[unit]
}

function clampInt(n: unknown): number {
  const v = Math.floor(Number(n))
  return isFinite(v) ? v : 0
}

function formatFaultNote(level: RaidLevel, nPrime: number, k?: number): string {
  switch (level) {
    case '0': return '不可容错（任一磁盘故障即失效）'
    case '1': return '可容忍 1 块磁盘故障（2盘镜像）'
    case '5': return '每阵列可容忍 1 块磁盘故障（单奇偶校验）'
    case '6': return '每阵列可容忍 2 块磁盘故障（双奇偶校验）'
    case '10': {
      const max = Math.floor(nPrime / 2)
      return `至少 1，最多 ${max}（每个镜像对最多损失 1 块）`
    }
    case '50': return `每组可容忍 1 块；最多 ${k ?? 0}（需分布在不同组）`
    case '60': return `每组可容忍 2 块；最多 ${(k ?? 0) * 2}（需分布在不同组）`
  }
}

function autoPickGrouping(nPrime: number, level: RaidLevel): { k?: number, g?: number } {
  // 推荐 g 区间
  const ranges: Record<RaidLevel, number[]> = {
    '0': [], '1': [], '5': [], '6': [], '10': [],
    '50': [4,5,6,7,8],
    '60': [6,7,8,9,10],
  }
  const gCandidates = ranges[level]
  if (!gCandidates || gCandidates.length === 0) return {}
  for (const g of gCandidates) {
    if (nPrime % g === 0) {
      const k = nPrime / g
      return { k, g }
    }
  }
  return {}
}

export function calculateRaid(input: RaidInput): RaidOutput {
  const errors: string[] = []
  const warnings: string[] = []

  const level = input.level
  const N = clampInt(input.diskCount)
  const S = clampInt(input.hotSpares)
  const unit = input.unit
  const C_bytes = toBytes(input.diskSize, unit)

  // Derived basics
  const raw = N * C_bytes
  const spares = S * C_bytes
  const nPrime = N - S

  if (nPrime <= 0) {
    errors.push('有效参与盘数 N′ = N − S ≤ 0，请检查磁盘数与热备数量。')
  }

  // Min requirements
  const minRequiredByLevel: Record<RaidLevel, number> = {
    '0': 2,
    '1': 2,
    '5': 3,
    '6': 4,
    '10': 4,
    '50': 6, // 实际约束为 k≥2 且 g≥3，因此最少 2×3=6
    '60': 8, // k≥2 且 g≥4 -> 2×4=8
  }
  const minRequired = minRequiredByLevel[level]
  if (nPrime > 0 && nPrime < minRequired) {
    errors.push(`所选 RAID 级别最少需要 ${minRequired} 块参与磁盘（不含热备）。`)
  }

  let usable = 0
  let k: number | undefined
  let g: number | undefined

  // Early return for fatal errors after we try to compute structure for 50/60
  const finalize = (): RaidOutput => {
    const overhead = Math.max(0, raw - spares - usable)
    const utilization = raw > 0 ? Math.max(0, Math.min(1, usable / raw)) : 0
    const structureNote = (level === '50' || level === '60') && k && g ? `${k} 组 × ${g} 盘/组` : undefined
    const faultTolerance = formatFaultNote(level, Math.max(0, nPrime), k)
    return { raw, spares, usable, overhead, utilization, minRequired, faultTolerance, structureNote, k, g, warnings, errors }
  }

  if (errors.length === 0) {
    switch (level) {
      case '0': {
        usable = nPrime * C_bytes
        break
      }
      case '1': {
        if (nPrime !== 2) {
          errors.push('RAID1 需严格 2 盘镜像；当前 N′≠2。请改用 RAID10。')
        } else {
          usable = 1 * C_bytes
        }
        break
      }
      case '5': {
        usable = (nPrime - 1) * C_bytes
        break
      }
      case '6': {
        usable = (nPrime - 2) * C_bytes
        break
      }
      case '10': {
        if (nPrime % 2 !== 0) {
          errors.push('RAID10 要求参与磁盘数 N′ 为偶数。')
        } else {
          usable = (nPrime / 2) * C_bytes
        }
        break
      }
      case '50':
      case '60': {
        const isR50 = level === '50'
        const minG = isR50 ? 3 : 4
        const parityPerGroup = isR50 ? 1 : 2

        let kIn = input.groupCount
        let gIn = input.groupSize

        if (input.autoGroup || (!kIn && !gIn)) {
          const picked = autoPickGrouping(nPrime, level)
          if (picked.k && picked.g) {
            kIn = picked.k
            gIn = picked.g
          }
        }

        if (kIn && !gIn) {
          if (nPrime % kIn !== 0) errors.push('N′ 无法被给定组数整除，请调整组数或热备数。')
          else gIn = nPrime / kIn
        } else if (gIn && !kIn) {
          if (nPrime % gIn !== 0) errors.push('N′ 无法被给定每组盘数整除，请调整每组盘数或热备数。')
          else kIn = nPrime / gIn
        } else if (kIn && gIn) {
          if (kIn * gIn !== nPrime) errors.push('给定的组数与每组盘数不匹配 N′。')
        } else {
          // 仍未得到 k/g
          errors.push('未能确定合理的分组，请手动指定组数或每组盘数，或调整热备数。')
        }

        if (kIn && gIn) {
          if (kIn < 2) errors.push('组数 k 需 ≥ 2。')
          if (gIn < minG) errors.push(`每组盘数 g 需 ≥ ${minG}。`)
          if (errors.length === 0) {
            k = clampInt(kIn)
            g = clampInt(gIn)
            // usable = k × (g - parity) × C
            usable = k * (g - parityPerGroup) * C_bytes
          }
        }
        break
      }
    }
  }

  return finalize()
}

export function toDisplay(valueBytes: number, unit: CapacityUnit): number {
  const base = BYTES_IN[unit]
  if (base <= 0) return 0
  return valueBytes / base
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

