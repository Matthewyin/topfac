// Mermaid  

export class MermaidService {
  constructor() {
    this.typeToClass = {
      router: 'router',
      switch: 'switch',
      firewall: 'firewall',
      server: 'server',
      unknown: 'unknown',
      load_balancer: 'loadbalancer'
    }
  }

  generate(parsedData, options = {}) {
    const direction = (options.direction || 'LR').toUpperCase()
    const envs = parsedData.environments || []
    const components = parsedData.components || []
    const connections = parsedData.connections || []

    const lines = []
    lines.push(`flowchart ${direction}`)

    // classDef
    lines.push('classDef router stroke:#2196F3,stroke-width:2,color:#1976D2;')
    lines.push('classDef switch stroke:#4CAF50,stroke-width:2,color:#388E3C;')
    lines.push('classDef firewall stroke:#F44336,stroke-width:2,color:#D32F2F;')
    lines.push('classDef server stroke:#FF9800,stroke-width:2,color:#F57C00;')
    lines.push('classDef loadbalancer stroke:#9C27B0,stroke-width:2,color:#6A1B9A;')
    lines.push('classDef unknown stroke:#9E9E9E,stroke-width:1,color:#616161;')

    // 环境容器
    for (const env of envs) {
      const envId = this.generateId(env.name)
      lines.push(`subgraph ${envId}["${this.escape(env.name)}"]`)

      // 定义 datacenters、areas、components
      for (const dc of env.datacenters) {
        const dcFullPath = `${env.name}/${dc.name}`
        const dcId = this.generateId(`${env.name}_${dc.name}`)
        lines.push(`  subgraph ${dcId}["${this.escape(dc.name)}"]`)

        // 定义 areas 和 components
        for (const area of dc.areas) {
          const areaId = this.generateId(`${env.name}_${dc.name}_${area.name}`)
          lines.push(`    subgraph ${areaId}["${this.escape(area.name)}"]`)
          for (const comp of area.components) {
            const cls = this.typeToClass[comp.type] || 'unknown'
            const nodeId = comp.id
            lines.push(`      ${nodeId}[\"${this.escape(comp.name)}\"]:::${cls}`)
          }
          lines.push('    end')
        }

        // 定义该 datacenter 内部的连接
        for (const conn of connections) {
          const srcComp = components.find(c => c.id === conn.source_id)
          const dstComp = components.find(c => c.id === conn.target_id)
          const srcPath = srcComp ? `${srcComp.environment}/${srcComp.datacenter}` : null
          const dstPath = dstComp ? `${dstComp.environment}/${dstComp.datacenter}` : null

          // 只定义同一 datacenter 内的连接
          if (srcPath === dcFullPath && dstPath === dcFullPath) {
            const label = conn.description ? `|${this.escape(conn.description)}|` : ''
            lines.push(`    ${conn.source_id} -->${label} ${conn.target_id}`)
          }
        }

        lines.push('  end')
      }

      lines.push('end')
    }

    // 定义跨 datacenter 或跨 environment 的连接
    for (const conn of connections) {
      const srcComp = components.find(c => c.id === conn.source_id)
      const dstComp = components.find(c => c.id === conn.target_id)
      const srcPath = srcComp ? `${srcComp.environment}/${srcComp.datacenter}` : null
      const dstPath = dstComp ? `${dstComp.environment}/${dstComp.datacenter}` : null

      // 跨 datacenter 或跨 environment 的连接
      if (srcPath !== dstPath) {
        const label = conn.description ? `|${this.escape(conn.description)}|` : ''
        lines.push(`${conn.source_id} -->${label} ${conn.target_id}`)
      }
    }

    const content = lines.join('\n')
    return content
  }

  // 生成唯一的 subgraph ID (移除特殊字符,避免 Mermaid 解析错误)
  generateId(name) {
    if (!name) return 'sg_unknown'
    // 移除所有非字母数字字符,替换为下划线
    return 'sg_' + String(name).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
  }

  escape(str) {
    if (!str) return ''
    return String(str).replace(/"/g, '\\"')
  }
}

export default MermaidService

