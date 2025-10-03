// 文本解析器类
// 负责将标准格式的拓扑文本解析为结构化数据

export class TextParser {
  constructor() {
    // 标准格式正则表达式（不区分大小写）
    // 标准格式: 【环境】【数据中心】的【区域】【设备】连接【环境】【数据中心】的【区域】【设备】
    this.topologyPattern = /【([^】]+)】【([^】]+)】的【([^】]+)】【([^】]+)】连接【([^】]+)】【([^】]+)】的【([^】]+)】【([^】]+)】/gi;

    // 设备类型映射
    this.deviceTypeMapping = {
      '防火墙': 'firewall',
      '负载均衡器': 'load_balancer',
      '服务器': 'server',
      '核心路由器': 'router',
      '汇聚交换机': 'switch',
      '接入交换机': 'switch',
      '核心交换机': 'switch',
      '路由器': 'router',
      '交换机': 'switch'
    };

    // 区域类型映射
    this.areaTypeMapping = {
      '核心网络区': 'core',
      '核心区': 'core',
      '汇聚网络区': 'aggregation',
      '汇聚区': 'aggregation',
      '接入网络区': 'access',
      '接入区': 'access',
      'DMZ区': 'dmz',
      '管理区': 'management'
    };
  }

  /**
   * 验证文本格式
   */
  validateTextFormat(textContent) {
    const errors = [];
    const warnings = [];

    if (!textContent || textContent.trim().length === 0) {
      errors.push('文本内容不能为空');
      return { is_valid: false, errors, warnings };
    }

    const lines = textContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      errors.push('没有找到有效的文本行');
      return { is_valid: false, errors, warnings };
    }

    // 检查是否有符合标准格式的行
    let validLines = 0;
    for (const line of lines) {
      if (this.topologyPattern.test(line)) {
        validLines++;
      }
    }

    if (validLines === 0) {
      errors.push('没有找到符合标准格式的连接描述');
      warnings.push('标准格式：【环境】【数据中心】的【区域】【设备】连接【环境】【数据中心】的【区域】【设备】');
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      total_lines: lines.length,
      valid_lines: validLines
    };
  }

  /**
   * 提取文本中所有【】括号内的内容
   */
  extractBracketContents(text) {
    const brackets = [];
    const regex = /【([^】]+)】/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      brackets.push(match[1]);
    }
    return brackets;
  }

  /**
   * 解析拓扑文本
   */
  parseTopologyText(textContent) {
    const components = new Map();
    const connections = [];
    const regions = new Set();
    const environments = new Set();
    const datacenters = new Set();

    // 用于构建层级结构的映射
    const hierarchyMap = new Map(); // key: env-dc-area, value: {env, dc, area}

    const lines = textContent.split('\n');
    console.log('开始解析文本，总行数:', lines.length)

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.includes('连接')) {
        continue;
      }

      console.log('解析行:', trimmedLine);

      // 重置正则表达式的lastIndex
      this.topologyPattern.lastIndex = 0;
      const match = this.topologyPattern.exec(trimmedLine);

      if (match) {
        const [
          fullMatch,
          sourceEnv, sourceDc, sourceArea, sourceDevice,
          targetEnv, targetDc, targetArea, targetDevice
        ] = match;

        console.log('匹配成功:', {
          source: `${sourceEnv}-${sourceDc}-${sourceArea}-${sourceDevice}`,
          target: `${targetEnv}-${targetDc}-${targetArea}-${targetDevice}`
        });

        // 记录环境、数据中心、区域
        environments.add(sourceEnv);
        environments.add(targetEnv);
        datacenters.add(sourceDc);
        datacenters.add(targetDc);
        regions.add(sourceArea);
        regions.add(targetArea);

        // 构建层级结构
        const sourceHierarchyKey = `${sourceEnv}-${sourceDc}-${sourceArea}`;
        const targetHierarchyKey = `${targetEnv}-${targetDc}-${targetArea}`;
        
        hierarchyMap.set(sourceHierarchyKey, {
          environment: sourceEnv,
          datacenter: sourceDc,
          area: sourceArea
        });
        
        hierarchyMap.set(targetHierarchyKey, {
          environment: targetEnv,
          datacenter: targetDc,
          area: targetArea
        });

        // 生成组件ID
        const sourceComponentId = this.generateComponentId(sourceEnv, sourceDc, sourceArea, sourceDevice);
        const targetComponentId = this.generateComponentId(targetEnv, targetDc, targetArea, targetDevice);

        // 添加源组件
        if (!components.has(sourceComponentId)) {
          components.set(sourceComponentId, {
            id: sourceComponentId,
            name: sourceDevice,
            type: this.getDeviceType(sourceDevice),
            environment: sourceEnv,
            datacenter: sourceDc,
            area: sourceArea,
            area_type: this.getAreaType(sourceArea),
            full_path: `${sourceEnv}/${sourceDc}/${sourceArea}/${sourceDevice}`
          });
        }

        // 添加目标组件
        if (!components.has(targetComponentId)) {
          components.set(targetComponentId, {
            id: targetComponentId,
            name: targetDevice,
            type: this.getDeviceType(targetDevice),
            environment: targetEnv,
            datacenter: targetDc,
            area: targetArea,
            area_type: this.getAreaType(targetArea),
            full_path: `${targetEnv}/${targetDc}/${targetArea}/${targetDevice}`
          });
        }

        // 添加连接
        const connectionId = `conn_${connections.length + 1}`;
        connections.push({
          id: connectionId,
          source_id: sourceComponentId,
          target_id: targetComponentId,
          source_component: sourceDevice,
          target_component: targetDevice,
          connection_type: 'network',
          description: `${sourceDevice} 连接 ${targetDevice}`
        });

      } else {
        console.warn('行格式不匹配:', trimmedLine);
      }
    }

    // 构建环境结构
    const environmentsArray = Array.from(environments).map(env => ({
      name: env,
      datacenters: Array.from(datacenters).filter(dc => {
        // 检查这个数据中心是否属于这个环境
        for (const [key, hierarchy] of hierarchyMap) {
          if (hierarchy.environment === env && hierarchy.datacenter === dc) {
            return true;
          }
        }
        return false;
      }).map(dc => ({
        name: dc,
        areas: Array.from(regions).filter(area => {
          // 检查这个区域是否属于这个数据中心
          const hierarchyKey = `${env}-${dc}-${area}`;
          return hierarchyMap.has(hierarchyKey);
        }).map(area => ({
          name: area,
          type: this.getAreaType(area),
          components: Array.from(components.values()).filter(comp => 
            comp.environment === env && comp.datacenter === dc && comp.area === area
          )
        }))
      }))
    }));

    const result = {
      topology_name: '解析的网络拓扑',
      environments: environmentsArray,
      components: Array.from(components.values()),
      connections: connections,
      statistics: {
        total_environments: environments.size,
        total_datacenters: datacenters.size,
        total_areas: regions.size,
        total_components: components.size,
        total_connections: connections.length
      }
    };

    console.log('解析完成:', result.statistics);
    return result;
  }

  /**
   * 生成组件ID
   */
  generateComponentId(env, dc, area, device) {
    const cleanName = (str) => str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    return `${cleanName(env)}_${cleanName(dc)}_${cleanName(area)}_${cleanName(device)}`;
  }

  /**
   * 获取设备类型
   */
  getDeviceType(deviceName) {
    for (const [keyword, type] of Object.entries(this.deviceTypeMapping)) {
      if (deviceName.includes(keyword)) {
        return type;
      }
    }
    return 'unknown';
  }

  /**
   * 获取区域类型
   */
  getAreaType(areaName) {
    for (const [keyword, type] of Object.entries(this.areaTypeMapping)) {
      if (areaName.includes(keyword)) {
        return type;
      }
    }
    return 'unknown';
  }
}

export default TextParser
