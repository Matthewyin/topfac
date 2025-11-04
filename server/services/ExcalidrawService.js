// Excalidraw 生成服务：根据 LayoutService 输出生成标准 Excalidraw JSON（简化版）
import LayoutService from './LayoutService.js'

function rid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function now() { return Date.now() }
function rnd() { return Math.floor(Math.random() * 2 ** 31) }

function rect({ x, y, width, height, strokeColor = '#1e1e1e', backgroundColor = 'transparent' }) {
  return {
    id: rid('rect'), type: 'rectangle', x, y, width, height, angle: 0,
    strokeColor, backgroundColor, fillStyle: 'hachure', strokeWidth: 1, strokeStyle: 'solid', roughness: 1, opacity: 100,
    groupIds: [], roundness: { type: 3 }, seed: rnd(), version: 1, versionNonce: rnd(), isDeleted: false,
    boundElements: [], updated: now(), link: null, locked: false
  }
}

function textEl({ x, y, text, width = 160, height = 24 }) {
  return {
    id: rid('text'), type: 'text', x, y, width, height, angle: 0,
    strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 1, opacity: 100,
    groupIds: [], seed: rnd(), version: 1, versionNonce: rnd(), isDeleted: false, boundElements: [], updated: now(), link: null, locked: false,
    text: String(text), fontSize: 16, fontFamily: 1, textAlign: 'left', verticalAlign: 'top', baseline: 18, containerId: null, originalText: String(text), lineHeight: 1.2
  }
}

export class ExcalidrawService {
  constructor() {
    this.typeStroke = {
      router: '#2196F3', switch: '#4CAF50', firewall: '#F44336', server: '#FF9800', load_balancer: '#9C27B0', unknown: '#9E9E9E'
    }
  }

  generate(parsedData, options = {}) {
    const direction = (options.direction || 'LR').toUpperCase()
    const layout = new LayoutService().calculate(parsedData, { direction })

    const elements = []
    const envs = parsedData.environments || []

    // 环境容器
    for (const env of envs) {
      const epos = layout.environments[env.name]
      if (!epos) continue
      elements.push(rect({ x: epos.x, y: epos.y, width: epos.width, height: epos.height, strokeColor: '#90CAF9' }))
      elements.push(textEl({ x: epos.x + 8, y: epos.y + 8, text: env.name }))

      for (const dc of env.datacenters) {
        const dckey = `${env.name}-${dc.name}`
        const dpos = layout.datacenters[dckey]
        if (!dpos) continue
        const dcAbs = { x: epos.x + dpos.x, y: epos.y + dpos.y, width: dpos.width, height: dpos.height }
        elements.push(rect({ x: dcAbs.x, y: dcAbs.y, width: dcAbs.width, height: dcAbs.height, strokeColor: '#E1BEE7' }))
        elements.push(textEl({ x: dcAbs.x + 8, y: dcAbs.y + 8, text: dc.name }))

        for (const area of dc.areas) {
          const akey = `${env.name}-${dc.name}-${area.name}`
          const apos = layout.areas[akey]
          if (!apos) continue
          const areaAbs = { x: dcAbs.x + apos.x, y: dcAbs.y + apos.y, width: apos.width, height: apos.height }
          elements.push(rect({ x: areaAbs.x, y: areaAbs.y, width: areaAbs.width, height: areaAbs.height, strokeColor: '#A5D6A7' }))
          elements.push(textEl({ x: areaAbs.x + 8, y: areaAbs.y + 8, text: area.name }))

          // 组件
          for (const comp of area.components) {
            const cpos = layout.components[comp.id]
            if (!cpos) continue
            const compAbs = { x: areaAbs.x + cpos.x, y: areaAbs.y + cpos.y, width: cpos.width, height: cpos.height }
            elements.push(rect({ x: compAbs.x, y: compAbs.y, width: compAbs.width, height: compAbs.height, strokeColor: this.typeStroke[comp.type] || this.typeStroke.unknown }))
            elements.push(textEl({ x: compAbs.x + 8, y: compAbs.y + 8, text: comp.name }))
          }
        }
      }
    }

    const content = {
      type: 'excalidraw',
      version: 2,
      source: 'topfac-local',
      elements,
      appState: {
        gridSize: 10,
        viewBackgroundColor: '#ffffff',
        currentItemStrokeColor: '#1e1e1e',
        currentItemBackgroundColor: 'transparent',
        currentItemEndArrowhead: 'arrow',
        scrollX: 0,
        scrollY: 0,
        zoom: { value: 1 },
        viewModeEnabled: false,
        theme: 'light'
      },
      files: {}
    }

    return content
  }
}

export default ExcalidrawService

