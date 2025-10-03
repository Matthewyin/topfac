// DrawIO XML 生成器类
// 负责将解析后的拓扑数据生成为DrawIO格式的XML

export class DrawIOService {
  constructor() {
    // 节点样式配置
    this.nodeStyles = {
      router: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#2196F3',
        strokeWidth: '2',
        fontColor: '#1976D2',
        fontSize: '12',
        fontStyle: '1'
      },
      switch: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#4CAF50',
        strokeWidth: '2',
        fontColor: '#388E3C',
        fontSize: '12',
        fontStyle: '1'
      },
      firewall: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#F44336',
        strokeWidth: '2',
        fontColor: '#D32F2F',
        fontSize: '12',
        fontStyle: '1'
      },
      server: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#FF9800',
        strokeWidth: '2',
        fontColor: '#F57C00',
        fontSize: '12',
        fontStyle: '1'
      },
      unknown: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#9E9E9E',
        strokeWidth: '2',
        fontColor: '#616161',
        fontSize: '12',
        fontStyle: '0'
      }
    };

    // 连接线样式
    this.edgeStyle = {
      strokeColor: '#666666',
      strokeWidth: '2',
      fontColor: '#333333',
      fontSize: '10'
    };
  }

  /**
   * 生成 DrawIO XML
   */
  generateXML(parsedData) {
    console.log('开始生成XML，输入数据:', {
      components_count: parsedData.components?.length || 0,
      connections_count: parsedData.connections?.length || 0,
      environments_count: parsedData.environments?.length || 0,
      data_keys: Object.keys(parsedData)
    });

    const components = parsedData.components || [];
    const connections = parsedData.connections || [];
    const environments = parsedData.environments || [];

    if (components.length === 0) {
      console.log('警告：没有组件数据，生成空白XML');
      return this.generateEmptyXML();
    }

    // 计算布局
    const layout = this.calculateLayout(components, connections, environments);
    
    // 生成XML内容
    const cells = [];
    let cellId = 0;
    const componentIdMap = {}; // 存储 component.id 到 cellId 的映射

    // 添加根节点
    cells.push(`<mxCell id="0"/>`);
    cells.push(`<mxCell id="1" parent="0"/>`);
    cellId = 2;

    // 生成环境分组
    for (const env of environments) {
      const envId = `env_${cellId++}`;
      const envPos = layout.environments[env.name];
      
      if (envPos) {
        cells.push(this.generateGroupCell(
          envId, 
          env.name, 
          envPos.x, 
          envPos.y, 
          envPos.width, 
          envPos.height,
          '#E3F2FD'
        ));

        // 生成数据中心分组
        for (const dc of env.datacenters) {
          const dcId = `dc_${cellId++}`;
          const dcPos = layout.datacenters[`${env.name}-${dc.name}`];
          
          if (dcPos) {
            cells.push(this.generateGroupCell(
              dcId, 
              dc.name, 
              dcPos.x, 
              dcPos.y, 
              dcPos.width, 
              dcPos.height,
              '#F3E5F5',
              envId
            ));

            // 生成区域分组
            for (const area of dc.areas) {
              const areaId = `area_${cellId++}`;
              const areaPos = layout.areas[`${env.name}-${dc.name}-${area.name}`];
              
              if (areaPos) {
                cells.push(this.generateGroupCell(
                  areaId, 
                  area.name, 
                  areaPos.x, 
                  areaPos.y, 
                  areaPos.width, 
                  areaPos.height,
                  '#E8F5E8',
                  dcId
                ));

                // 生成设备节点
                for (const component of area.components) {
                  const compId = `comp_${cellId++}`;
                  const compPos = layout.components[component.id];

                  // 存储映射关系
                  componentIdMap[component.id] = compId;

                  if (compPos) {
                    cells.push(this.generateComponentCell(
                      compId,
                      component,
                      compPos.x,
                      compPos.y,
                      compPos.width,
                      compPos.height,
                      areaId
                    ));
                  }
                }
              }
            }
          }
        }
      }
    }

    // 生成连接线
    console.log('开始生成连接线，连接数量:', connections.length);
    console.log('组件ID映射:', componentIdMap);

    for (const connection of connections) {
      const edgeId = `edge_${cellId++}`;
      const sourceId = componentIdMap[connection.source_id];
      const targetId = componentIdMap[connection.target_id];

      console.log('处理连接:', {
        source_id: connection.source_id,
        target_id: connection.target_id,
        sourceId,
        targetId
      });

      if (sourceId && targetId) {
        cells.push(this.generateConnectionCell(
          edgeId,
          connection,
          sourceId,
          targetId
        ));
        console.log('✓ 连接线已添加');
      } else {
        console.warn('✗ 连接线缺少源或目标:', {
          connection,
          sourceId,
          targetId,
          availableIds: Object.keys(componentIdMap)
        });
      }
    }

    // 组装完整XML
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="TopFac Local" version="1.0.0">
  <diagram name="网络拓扑图" id="topology">
    <mxGraphModel dx="2000" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3000" pageHeight="2000" math="0" shadow="0">
      <root>
        ${cells.join('\n        ')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    console.log('XML生成完成:', {
      total_cells: cells.length,
      xml_length: xmlContent.length
    });

    return xmlContent;
  }

  /**
   * 计算布局位置
   */
  calculateLayout(components, connections, environments) {
    const layout = {
      environments: {},
      datacenters: {},
      areas: {},
      components: {}
    };

    let envX = 50;
    const envSpacing = 900;  // 增加环境间距
    const envWidth = 800;    // 增加环境宽度
    const envHeight = 600;   // 增加环境高度

    for (const env of environments) {
      layout.environments[env.name] = {
        x: envX,
        y: 50,
        width: envWidth,
        height: envHeight
      };

      let dcY = 80;
      const dcSpacing = 350;  // 增加数据中心间距
      const dcWidth = envWidth - 40;
      const dcHeight = 300;   // 增加数据中心高度

      for (const dc of env.datacenters) {
        const dcKey = `${env.name}-${dc.name}`;
        layout.datacenters[dcKey] = {
          x: envX + 20,
          y: dcY,
          width: dcWidth,
          height: dcHeight
        };

        let areaX = envX + 40;
        const areaSpacing = 250;  // 增加区域间距
        const areaWidth = 200;    // 增加区域宽度
        const areaHeight = 250;   // 增加区域高度

        for (const area of dc.areas) {
          const areaKey = `${env.name}-${dc.name}-${area.name}`;
          layout.areas[areaKey] = {
            x: areaX,
            y: dcY + 30,
            width: areaWidth,
            height: areaHeight
          };

          // 在区域内布局组件
          let compY = dcY + 60;
          const compSpacing = 40;  // 增加组件间距
          const compWidth = 120;   // 增加组件宽度
          const compHeight = 30;   // 增加组件高度

          for (let i = 0; i < area.components.length; i++) {
            const component = area.components[i];
            layout.components[component.id] = {
              x: areaX + 40,
              y: compY + (i * compSpacing),
              width: compWidth,
              height: compHeight
            };
          }

          areaX += areaSpacing;
        }

        dcY += dcSpacing;
      }

      envX += envSpacing;
    }

    return layout;
  }

  /**
   * 生成分组单元格
   */
  generateGroupCell(id, label, x, y, width, height, fillColor, parent = '1') {
    return `<mxCell id="${id}" value="${this.escapeXML(label)}" style="swimlane;whiteSpace=wrap;html=1;fillColor=${fillColor};strokeColor=#CCCCCC;fontStyle=1;" vertex="1" parent="${parent}">
          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>
        </mxCell>`;
  }

  /**
   * 生成组件单元格
   */
  generateComponentCell(id, component, x, y, width, height, parent) {
    const style = this.nodeStyles[component.type] || this.nodeStyles.unknown;
    const styleStr = `shape=${style.shape};fillColor=${style.fillColor};strokeColor=${style.strokeColor};strokeWidth=${style.strokeWidth};fontColor=${style.fontColor};fontSize=${style.fontSize};fontStyle=${style.fontStyle};whiteSpace=wrap;html=1;`;
    
    return `<mxCell id="${id}" value="${this.escapeXML(component.name)}" style="${styleStr}" vertex="1" parent="${parent}">
          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>
        </mxCell>`;
  }

  /**
   * 生成连接单元格
   */
  generateConnectionCell(id, connection, sourceId, targetId) {
    const styleStr = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=${this.edgeStyle.strokeColor};strokeWidth=${this.edgeStyle.strokeWidth};fontColor=${this.edgeStyle.fontColor};fontSize=${this.edgeStyle.fontSize};`;
    
    return `<mxCell id="${id}" value="${this.escapeXML(connection.description || '')}" style="${styleStr}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>`;
  }

  /**
   * 获取组件在数组中的索引
   */
  getComponentIndex(components, componentId) {
    for (let i = 0; i < components.length; i++) {
      if (components[i].id === componentId) {
        return i + 2; // 加2是因为前面有两个根节点
      }
    }
    return 0;
  }

  /**
   * 生成空白XML
   */
  generateEmptyXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="TopFac Local" version="1.0.0">
  <diagram name="空白拓扑图" id="topology">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="2" value="暂无拓扑数据" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=16;fontColor=#999999;" vertex="1" parent="1">
          <mxGeometry x="300" y="200" width="200" height="30" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
  }

  /**
   * XML转义
   */
  escapeXML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default DrawIOService
