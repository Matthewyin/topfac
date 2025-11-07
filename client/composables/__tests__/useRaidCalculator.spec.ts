import { describe, it, expect } from 'vitest'
import { calculateRaid, toDisplay } from '../useRaidCalculator'

const TiB = 1024 ** 4
const GiB = 1024 ** 3
const TB = 1000 ** 4

describe('useRaidCalculator - 基础与边界', () => {
  it('N′ = N - S 的边界：N′<=0 抛出错误', () => {
    const r = calculateRaid({ level: '0', diskCount: 2, hotSpares: 2, diskSize: 1, unit: 'TiB' })
    expect(r.errors.some(e => e.includes('有效参与盘数'))).toBeTruthy()
  })
})

describe('RAID0', () => {
  it('N=4,S=0,C=1TiB => usable=4TiB, overhead=0', () => {
    const r = calculateRaid({ level: '0', diskCount: 4, hotSpares: 0, diskSize: 1, unit: 'TiB' })
    expect(r.usable).toBe(4 * TiB)
    expect(r.overhead).toBe(0)
    expect(r.utilization).toBe(1)
  })

  it('N=4,S=1,C=1TiB => usable=3TiB, spares=1TiB, overhead=0', () => {
    const r = calculateRaid({ level: '0', diskCount: 4, hotSpares: 1, diskSize: 1, unit: 'TiB' })
    expect(r.spares).toBe(1 * TiB)
    expect(r.usable).toBe(3 * TiB)
    expect(r.overhead).toBe(0)
  })
})

describe('RAID1（严格 N′=2）', () => {
  it('N=2,S=0,C=1TiB => usable=1TiB，无错误', () => {
    const r = calculateRaid({ level: '1', diskCount: 2, hotSpares: 0, diskSize: 1, unit: 'TiB' })
    expect(r.errors.length).toBe(0)
    expect(r.usable).toBe(1 * TiB)
  })

  it('N=3,S=0 => 仅错误提示，不给容量结果', () => {
    const r = calculateRaid({ level: '1', diskCount: 3, hotSpares: 0, diskSize: 1, unit: 'TiB' })
    expect(r.errors.some(e => e.includes('RAID1 需严格'))).toBeTruthy()
    expect(r.usable).toBe(0)
  })
})

describe('RAID5', () => {
  it('N=6,S=0,C=1TiB => usable=(6-1)=5TiB', () => {
    const r = calculateRaid({ level: '5', diskCount: 6, hotSpares: 0, diskSize: 1, unit: 'TiB' })
    expect(r.usable).toBe(5 * TiB)
    expect(r.utilization).toBeCloseTo(5 / 6, 6)
  })
})

describe('RAID6', () => {
  it('N=6,S=0,C=1TiB => usable=(6-2)=4TiB', () => {
    const r = calculateRaid({ level: '6', diskCount: 6, hotSpares: 0, diskSize: 1, unit: 'TiB' })
    expect(r.usable).toBe(4 * TiB)
    expect(r.utilization).toBeCloseTo(4 / 6, 6)
  })
})

describe('RAID10', () => {
  it('N=6,S=0,C=1TiB => usable=(6/2)=3TiB', () => {
    const r = calculateRaid({ level: '10', diskCount: 6, hotSpares: 0, diskSize: 1, unit: 'TiB' })
    expect(r.errors.length).toBe(0)
    expect(r.usable).toBe(3 * TiB)
  })

  it('N=5 => 偶数校验错误，usable=0', () => {
    const r = calculateRaid({ level: '10', diskCount: 5, hotSpares: 0, diskSize: 1, unit: 'TiB' })
    expect(r.errors.some(e => e.includes('RAID10 要求参与磁盘数'))).toBeTruthy()
    expect(r.usable).toBe(0)
  })
})

describe('RAID50', () => {
  it('自动分组示例：N=12,S=0 => 预计 g=4,k=3，usable=(12-3)=9TiB', () => {
    const r = calculateRaid({ level: '50', diskCount: 12, hotSpares: 0, diskSize: 1, unit: 'TiB', autoGroup: true })
    expect(r.k).toBe(3)
    expect(r.g).toBe(4)
    expect(r.usable).toBe(9 * TiB)
  })

  it('手动给 g=5 且 N′=10 => k=2，usable=8TiB', () => {
    const r = calculateRaid({ level: '50', diskCount: 10, hotSpares: 0, diskSize: 1, unit: 'TiB', groupSize: 5 })
    expect(r.k).toBe(2)
    expect(r.g).toBe(5)
    expect(r.usable).toBe(8 * TiB)
  })

  it('g < 3 触发错误', () => {
    const r = calculateRaid({ level: '50', diskCount: 8, hotSpares: 0, diskSize: 1, unit: 'TiB', groupSize: 2 })
    expect(r.errors.some(e => e.includes('每组盘数 g 需 ≥ 3'))).toBeTruthy()
  })

  it('给定 k*g 与 N′ 不匹配触发错误', () => {
    const r = calculateRaid({ level: '50', diskCount: 11, hotSpares: 0, diskSize: 1, unit: 'TiB', groupCount: 2, groupSize: 5 })
    expect(r.errors.some(e => e.includes('不匹配'))).toBeTruthy()
  })
})

describe('RAID60', () => {
  it('自动分组示例：N=12,S=0 => 预计 g=6,k=2，usable=(12-4)=8TiB', () => {
    const r = calculateRaid({ level: '60', diskCount: 12, hotSpares: 0, diskSize: 1, unit: 'TiB', autoGroup: true })
    expect(r.k).toBe(2)
    expect(r.g).toBe(6)
    expect(r.usable).toBe(8 * TiB)
  })

  it('g < 4 触发错误', () => {
    const r = calculateRaid({ level: '60', diskCount: 12, hotSpares: 0, diskSize: 1, unit: 'TiB', groupSize: 3 })
    expect(r.errors.some(e => e.includes('每组盘数 g 需 ≥ 4'))).toBeTruthy()
  })
})

describe('单位换算', () => {
  it('十进制 1TB：RAID0 N=4 => usable=4×10^12 bytes', () => {
    const r = calculateRaid({ level: '0', diskCount: 4, hotSpares: 0, diskSize: 1, unit: 'TB' })
    expect(r.usable).toBe(4 * TB)
  })

  it('GiB 展示换算（toDisplay）', () => {
    const r = calculateRaid({ level: '5', diskCount: 3, hotSpares: 0, diskSize: 1024, unit: 'GiB' }) // 1TiB × 2 usable
    expect(toDisplay(r.usable, 'TiB')).toBe(2)
  })
})

