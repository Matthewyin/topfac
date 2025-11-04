// DrawIO XML 生成器类
// 负责将解析后的拓扑数据生成为DrawIO格式的XML

import LayoutService from './LayoutService.js'

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

    // 计算布局（统一使用 LayoutService）
    const layout = new LayoutService().calculate(parsedData, { direction: 'LR' });

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
   * 计算布局位置（使用相对坐标实现正确的层级嵌套）
   */
  calculateLayout(components, connections, environments) {
    const layout = {
      environments: {},
      datacenters: {},
      areas: {},
      components: {}
    };

    // 环境容器配置
    let envX = 50;  // 环境的绝对X坐标
    const envY = 50;  // 环境的绝对Y坐标
    const envSpacing = 50;  // 环境之间的间距
    const envPadding = 20;  // 环境内边距

    // 数据中心容器配置
    const dcPadding = 20;  // 数据中心内边距
    const dcSpacing = 30;  // 数据中心之间的间距

    // 区域容器配置
    const areaPadding = 20;  // 区域内边距
    const areaSpacing = 30;  // 区域之间的间距
    const areaWidth = 220;  // 区域宽度

    // 组件配置
    const compPadding = 40;  // 组件距离区域边缘的距离
    const compSpacing = 50;  // 组件之间的间距
    const compWidth = 140;  // 组件宽度
    const compHeight = 40;  // 组件高度

    for (const env of environments) {
      // 计算环境容器的尺寸
      let maxDcHeight = 0;
      let totalDcHeight = 0;

      // 先计算所有数据中心的高度，以确定环境容器的高度
      for (let dcIndex = 0; dcIndex < env.datacenters.length; dcIndex++) {
        const dc = env.datacenters[dcIndex];

        // 计算数据中心的高度
        let maxAreaHeight = 0;

        for (const area of dc.areas) {
          // 计算区域高度：标题栏 + 内边距 + 组件数量 * (组件高度 + 间距)
          const areaHeight = 40 + areaPadding * 2 +
            Math.max(1, area.components.length) * compHeight +
            Math.max(0, area.components.length - 1) * compSpacing;

          maxAreaHeight = Math.max(maxAreaHeight, areaHeight);
        }

        // 数据中心高度 = 标题栏 + 内边距 + 区域高度
        const dcHeight = 40 + dcPadding * 2 + maxAreaHeight;
        maxDcHeight = Math.max(maxDcHeight, dcHeight);
        totalDcHeight += dcHeight;
      }

      // 环境高度 = 标题栏 + 内边距 + 所有数据中心高度 + 数据中心间距
      const envHeight = 40 + envPadding * 2 + totalDcHeight +
        Math.max(0, env.datacenters.length - 1) * dcSpacing;

      // 计算环境宽度：需要容纳所有区域横向排列
      let maxAreasCount = 0;
      for (const dc of env.datacenters) {
        maxAreasCount = Math.max(maxAreasCount, dc.areas.length);
      }
      const envWidth = envPadding * 2 + dcPadding * 2 +
        maxAreasCount * areaWidth +
        Math.max(0, maxAreasCount - 1) * areaSpacing;

      // 环境容器使用绝对坐标
      layout.environments[env.name] = {
        x: envX,
        y: envY,
        width: envWidth,
        height: envHeight
      };

      // 数据中心的Y坐标（相对于环境容器）
      let dcY = envPadding;

      for (let dcIndex = 0; dcIndex < env.datacenters.length; dcIndex++) {
        const dc = env.datacenters[dcIndex];
        const dcKey = `${env.name}-${dc.name}`;

        // 计算数据中心的高度
        let maxAreaHeight = 0;
        for (const area of dc.areas) {
          const areaHeight = 40 + areaPadding * 2 +
            Math.max(1, area.components.length) * compHeight +
            Math.max(0, area.components.length - 1) * compSpacing;
          maxAreaHeight = Math.max(maxAreaHeight, areaHeight);
        }

        const dcHeight = 40 + dcPadding * 2 + maxAreaHeight;
        const dcWidth = envWidth - envPadding * 2;

        // 数据中心使用相对于环境的坐标
        layout.datacenters[dcKey] = {
          x: envPadding,  // 相对于环境容器
          y: dcY,  // 相对于环境容器
          width: dcWidth,
          height: dcHeight
        };

        // 区域的X坐标（相对于数据中心容器）
        let areaX = dcPadding;

        for (let areaIndex = 0; areaIndex < dc.areas.length; areaIndex++) {
          const area = dc.areas[areaIndex];
          const areaKey = `${env.name}-${dc.name}-${area.name}`;

          // 计算区域高度
          const areaHeight = 40 + areaPadding * 2 +
            Math.max(1, area.components.length) * compHeight +
            Math.max(0, area.components.length - 1) * compSpacing;

          // 区域使用相对于数据中心的坐标
          layout.areas[areaKey] = {
            x: areaX,  // 相对于数据中心容器
            y: dcPadding,  // 相对于数据中心容器
            width: areaWidth,
            height: areaHeight
          };

          // 组件的Y坐标（相对于区域容器）
          let compY = areaPadding;

          for (let i = 0; i < area.components.length; i++) {
            const component = area.components[i];

            // 组件使用相对于区域的坐标
            layout.components[component.id] = {
              x: areaPadding,  // 相对于区域容器
              y: compY,  // 相对于区域容器
              width: compWidth,
              height: compHeight
            };

            compY += compHeight + compSpacing;
          }

          areaX += areaWidth + areaSpacing;
        }

        dcY += dcHeight + dcSpacing;
      }

      envX += envWidth + envSpacing;
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
