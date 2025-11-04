import { describe, it, expect } from 'vitest'
import MermaidService from '../server/services/MermaidService.js'

describe('MermaidService.generate', () => {
  const parsedData = {
    environments: [
      {
        name: '生产',
        datacenters: [
          {
            name: 'DC1',
            areas: [
              {
                name: '核心区',
                components: [
                  { id: 'c1', name: '核心路由器', type: 'router' },
                  { id: 'c2', name: '核心交换机', type: 'switch' }
                ]
              }
            ]
          }
        ]
      }
    ],
    components: [
      { id: 'c1', name: '核心路由器', type: 'router' },
      { id: 'c2', name: '核心交换机', type: 'switch' }
    ],
    connections: [
      { source_id: 'c1', target_id: 'c2', description: '上联' }
    ]
  }

  it('should generate LR flowchart with nodes and edge', () => {
    const svc = new MermaidService()
    const content = svc.generate(parsedData, { direction: 'LR' })
    expect(content).toContain('flowchart LR')
    expect(content).toContain('subgraph 生产')
    expect(content).toContain('核心路由器')
    expect(content).toContain('c1 -->|上联| c2')
  })

  it('should switch to TB when specified', () => {
    const svc = new MermaidService()
    const content = svc.generate(parsedData, { direction: 'TB' })
    expect(content.startsWith('flowchart TB')).toBe(true)
  })
})

