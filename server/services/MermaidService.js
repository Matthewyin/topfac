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

    // 
    for (const env of envs) {
      lines.push(`subgraph ${this.escape(env.name)}`)
      for (const dc of env.datacenters) {
        lines.push(`  subgraph ${this.escape(dc.name)}`)
        for (const area of dc.areas) {
          lines.push(`    subgraph ${this.escape(area.name)}`)
          for (const comp of area.components) {
            const cls = this.typeToClass[comp.type] || 'unknown'
            const nodeId = comp.id
            lines.push(`      ${nodeId}[\"${this.escape(comp.name)}\"]:::${cls}`)
          }
          lines.push('    end')
        }
        lines.push('  end')
      }
      lines.push('end')
    }

    // 
    for (const conn of connections) {
      const src = conn.source_id
      const dst = conn.target_id
      const label = conn.description ? `|${this.escape(conn.description)}|` : ''
      lines.push(`${src} -->${label} ${dst}`)
    }

    const content = lines.join('\n')
    return content
  }

  escape(str) {
    if (!str) return ''
    return String(str).replace(/"/g, '\\"')
  }
}

export default MermaidService

