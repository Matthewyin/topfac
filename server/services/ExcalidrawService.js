// Excalidraw 生成服务：根据 LayoutService 输出生成标准 Excalidraw JSON（简化版）
import LayoutService from './LayoutService.js'

function rid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function now() { return Date.now() }
function rnd() { return Math.floor(Math.random() * 2 ** 31) }

function rect({ id, x, y, width, height, strokeColor = '#1e1e1e', backgroundColor = 'transparent', boundElements = [] }) {
  return {
    id: id || rid('rect'), type: 'rectangle', x, y, width, height, angle: 0,
    strokeColor, backgroundColor, fillStyle: 'hachure', strokeWidth: 1, strokeStyle: 'solid', roughness: 1, opacity: 100,
    groupIds: [], roundness: { type: 3 }, seed: rnd(), version: 1, versionNonce: rnd(), isDeleted: false,
    boundElements, updated: now(), link: null, locked: false
  }
}

function textEl({ id, x, y, text, width = 160, height = 24, containerId = null }) {
  return {
    id: id || rid('text'), type: 'text', x, y, width, height, angle: 0,
    strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 1, opacity: 100,
    groupIds: [], seed: rnd(), version: 1, versionNonce: rnd(), isDeleted: false, boundElements: [], updated: now(), link: null, locked: false,
    text: String(text), fontSize: 16, fontFamily: 1, textAlign: 'center', verticalAlign: 'top', baseline: 18, containerId, originalText: String(text), lineHeight: 1.2
  }
}

function arrow({ id, x, y, width, height, startBinding, endBinding, strokeColor = '#1e1e1e' }) {
  return {
    id: id || rid('arrow'), type: 'arrow', x, y, width, height, angle: 0,
    strokeColor, backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 1, opacity: 100,
    groupIds: [], roundness: { type: 2 }, seed: rnd(), version: 1, versionNonce: rnd(), isDeleted: false,
    boundElements: [], updated: now(), link: null, locked: false,
    startBinding, endBinding, startArrowhead: null, endArrowhead: 'arrow',
    points: [[0, 0], [width, height]]
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
    const componentIdToRectId = {}  // 组件 ID → rectangle element ID 的映射
    const componentAbsPos = {}  // 组件 ID → 绝对坐标的映射
    const rectElements = {}  // rectangle element ID → element 对象的映射

    // 环境容器
    for (const env of envs) {
      const epos = layout.environments[env.name]
      if (!epos) continue

      const envRectId = rid('rect')
      const envTextId = rid('text')
      const envRectEl = rect({
        id: envRectId,
        x: epos.x,
        y: epos.y,
        width: epos.width,
        height: epos.height,
        strokeColor: '#90CAF9',
        boundElements: [{ id: envTextId, type: 'text' }]
      })
      rectElements[envRectId] = envRectEl
      elements.push(envRectEl)
      elements.push(textEl({
        id: envTextId,
        x: epos.x + epos.width / 2,
        y: epos.y + 8,
        text: env.name,
        containerId: envRectId
      }))

      for (const dc of env.datacenters) {
        const dckey = `${env.name}-${dc.name}`
        const dpos = layout.datacenters[dckey]
        if (!dpos) continue
        const dcAbs = { x: epos.x + dpos.x, y: epos.y + dpos.y, width: dpos.width, height: dpos.height }

        const dcRectId = rid('rect')
        const dcTextId = rid('text')
        const dcRectEl = rect({
          id: dcRectId,
          x: dcAbs.x,
          y: dcAbs.y,
          width: dcAbs.width,
          height: dcAbs.height,
          strokeColor: '#E1BEE7',
          boundElements: [{ id: dcTextId, type: 'text' }]
        })
        rectElements[dcRectId] = dcRectEl
        elements.push(dcRectEl)
        elements.push(textEl({
          id: dcTextId,
          x: dcAbs.x + dcAbs.width / 2,
          y: dcAbs.y + 8,
          text: dc.name,
          containerId: dcRectId
        }))

        for (const area of dc.areas) {
          const akey = `${env.name}-${dc.name}-${area.name}`
          const apos = layout.areas[akey]
          if (!apos) continue
          const areaAbs = { x: dcAbs.x + apos.x, y: dcAbs.y + apos.y, width: apos.width, height: apos.height }

          const areaRectId = rid('rect')
          const areaTextId = rid('text')
          const areaRectEl = rect({
            id: areaRectId,
            x: areaAbs.x,
            y: areaAbs.y,
            width: areaAbs.width,
            height: areaAbs.height,
            strokeColor: '#A5D6A7',
            boundElements: [{ id: areaTextId, type: 'text' }]
          })
          rectElements[areaRectId] = areaRectEl
          elements.push(areaRectEl)
          elements.push(textEl({
            id: areaTextId,
            x: areaAbs.x + areaAbs.width / 2,
            y: areaAbs.y + 8,
            text: area.name,
            containerId: areaRectId
          }))

          // 组件
          for (const comp of area.components) {
            const cpos = layout.components[comp.id]
            if (!cpos) continue
            const compAbs = { x: areaAbs.x + cpos.x, y: areaAbs.y + cpos.y, width: cpos.width, height: cpos.height }

            const compRectId = rid('rect')
            const compTextId = rid('text')

            componentIdToRectId[comp.id] = compRectId  // 记录映射
            componentAbsPos[comp.id] = compAbs  // 记录绝对坐标

            const compRectEl = rect({
              id: compRectId,
              x: compAbs.x,
              y: compAbs.y,
              width: compAbs.width,
              height: compAbs.height,
              strokeColor: this.typeStroke[comp.type] || this.typeStroke.unknown,
              boundElements: [{ id: compTextId, type: 'text' }]
            })
            rectElements[compRectId] = compRectEl
            elements.push(compRectEl)
            elements.push(textEl({
              id: compTextId,
              x: compAbs.x + compAbs.width / 2,
              y: compAbs.y + 8,
              text: comp.name,
              containerId: compRectId
            }))
          }
        }
      }
    }

    // 生成连接线
    const connections = parsedData.connections || []
    for (const conn of connections) {
      const srcRectId = componentIdToRectId[conn.source_id]
      const dstRectId = componentIdToRectId[conn.target_id]

      if (!srcRectId || !dstRectId) continue  // 跳过无效连接

      const srcPos = componentAbsPos[conn.source_id]
      const dstPos = componentAbsPos[conn.target_id]

      if (!srcPos || !dstPos) continue

      // 计算箭头起点和终点（使用容器中心，让 binding 自动吸附到边缘）
      const startX = srcPos.x + srcPos.width / 2
      const startY = srcPos.y + srcPos.height / 2
      const endX = dstPos.x + dstPos.width / 2
      const endY = dstPos.y + dstPos.height / 2

      const arrowEl = arrow({
        x: startX,
        y: startY,
        width: endX - startX,
        height: endY - startY,
        startBinding: {
          elementId: srcRectId,
          focus: 0,
          gap: 1
        },
        endBinding: {
          elementId: dstRectId,
          focus: 0,
          gap: 1
        }
      })

      elements.push(arrowEl)

      // 更新源容器和目标容器的 boundElements，添加箭头引用（实现双向绑定）
      if (rectElements[srcRectId]) {
        rectElements[srcRectId].boundElements.push({ id: arrowEl.id, type: 'arrow' })
      }
      if (rectElements[dstRectId]) {
        rectElements[dstRectId].boundElements.push({ id: arrowEl.id, type: 'arrow' })
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

