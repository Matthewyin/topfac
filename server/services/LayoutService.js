// 布局服务：为 DrawIO/Mermaid/Excalidraw 提供统一的层级与坐标

export class LayoutService {
  constructor() {}

  /**
   * 计算布局（默认 LR）。返回相对/绝对坐标混合的层级定位，
   * env 使用绝对坐标；dc/area/comp 使用相对父容器坐标。
   */
  calculate(parsedData, options = {}) {
    const direction = (options.direction || 'LR').toUpperCase()
    const environments = parsedData.environments || []

    const layout = {
      environments: {},
      datacenters: {},
      areas: {},
      components: {}
    }

    // 环境容器配置
    let envX = 50
    let envY = 50
    const envSpacing = 50
    const envPadding = 20

    // 数据中心容器配置
    const dcPadding = 20
    const dcSpacing = 30

    // 区域容器配置
    const areaPadding = 20
    const areaSpacing = 30
    const areaWidth = 220

    // 组件配置
    const compPadding = 40
    const compSpacing = 50
    const compWidth = 140
    const compHeight = 40

    for (const env of environments) {
      // 预计算当前环境中每个 DC 的高度（用于纵向堆叠）
      let totalDcHeight = 0
      let maxDcHeight = 0

      for (const dc of env.datacenters) {
        let maxAreaHeight = 0
        for (const area of dc.areas) {
          const areaHeight = 40 + areaPadding * 2 +
            Math.max(1, area.components.length) * compHeight +
            Math.max(0, area.components.length - 1) * compSpacing
          maxAreaHeight = Math.max(maxAreaHeight, areaHeight)
        }
        const dcHeight = 40 + dcPadding * 2 + maxAreaHeight
        totalDcHeight += dcHeight
        maxDcHeight = Math.max(maxDcHeight, dcHeight)
      }

      // 环境尺寸估算
      let maxAreasCount = 0
      for (const dc of env.datacenters) {
        maxAreasCount = Math.max(maxAreasCount, dc.areas.length)
      }
      const envWidth = envPadding * 2 + dcPadding * 2 + maxAreasCount * areaWidth + Math.max(0, maxAreasCount - 1) * areaSpacing
      const envHeight = 40 + envPadding * 2 + totalDcHeight + Math.max(0, env.datacenters.length - 1) * dcSpacing

      // 环境容器使用绝对坐标
      layout.environments[env.name] = { x: envX, y: envY, width: envWidth, height: envHeight }

      // 数据中心相对于环境的坐标
      let dcY = envPadding
      for (const dc of env.datacenters) {
        const dcKey = `${env.name}-${dc.name}`

        // 计算该 DC 的高度
        let maxAreaHeight = 0
        for (const area of dc.areas) {
          const areaHeight = 40 + areaPadding * 2 +
            Math.max(1, area.components.length) * compHeight +
            Math.max(0, area.components.length - 1) * compSpacing
          maxAreaHeight = Math.max(maxAreaHeight, areaHeight)
        }
        const dcHeight = 40 + dcPadding * 2 + maxAreaHeight
        const dcWidth = envWidth - envPadding * 2

        layout.datacenters[dcKey] = { x: envPadding, y: dcY, width: dcWidth, height: dcHeight }

        // 区域相对于 DC 的坐标（水平排）
        let areaX = dcPadding
        for (const area of dc.areas) {
          const areaKey = `${env.name}-${dc.name}-${area.name}`

          const areaHeight = 40 + areaPadding * 2 +
            Math.max(1, area.components.length) * compHeight +
            Math.max(0, area.components.length - 1) * compSpacing

          layout.areas[areaKey] = { x: areaX, y: dcPadding, width: areaWidth, height: areaHeight }

          // 组件相对于 Area 的坐标（竖直排）
          let compY = areaPadding
          for (const component of area.components) {
            layout.components[component.id] = {
              x: areaPadding,
              y: compY,
              width: compWidth,
              height: compHeight
            }
            compY += compHeight + compSpacing
          }

          areaX += areaWidth + areaSpacing
        }

        dcY += dcHeight + dcSpacing
      }

      // 环境排列：LR 水平推进；TB 垂直推进
      if (direction === 'TB') {
        envY += envHeight + envSpacing
      } else {
        envX += envWidth + envSpacing
      }
    }

    return layout
  }
}

export default LayoutService

