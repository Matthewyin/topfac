/**
 * DataMerger - 负责执行数据合并逻辑
 */
class DataMerger {
  /**
   * 合并多个sheet的数据
   * @param {Array<Sheet>} sheets - 所有sheet数据
   * @param {MergeConfig} config - 合并配置
   * @returns {Promise<MergedData>}
   */
  async merge(sheets, config) {
    try {
      if (!sheets || sheets.length === 0) {
        throw new NoSheetError('没有可合并的sheet数据');
      }
      
      if (!config || !config.selectedColumns || config.selectedColumns.length === 0) {
        throw new NoColumnSelectedError();
      }
    
      // 使用第一个sheet作为基准
      const firstSheet = sheets[0];
      const headers = firstSheet.headers || [];
      const rowCount = firstSheet.rowCount;
      const colCount = firstSheet.colCount;
      
      // 初始化结果数据结构
      const mergedRows = [];
      
      // 批处理大小：每批处理100行
      const batchSize = 100;
      const needsBatching = rowCount > 1000; // 超过1000行时使用批处理
      
      // 遍历所有行（从第二行开始，跳过表头）
      for (let rowIndex = 1; rowIndex < rowCount; rowIndex++) {
        const mergedRow = [];
        
        // 遍历所有列
        for (let colIndex = 0; colIndex < colCount; colIndex++) {
          // 检查当前列是否需要合并
          if (config.selectedColumns.includes(colIndex)) {
            // 收集所有sheet中相同位置的单元格值
            const cellValues = sheets.map(sheet => {
              // 确保行存在
              if (sheet.data && sheet.data[rowIndex]) {
                return sheet.data[rowIndex][colIndex];
              }
              return '';
            });
            
            // 合并单元格值
            const mergedValue = this.mergeCellValues(
              cellValues,
              config.separator,
              config.skipEmpty
            );
            
            mergedRow.push(mergedValue);
          } else {
            // 未选择合并的列，使用第一个sheet的值
            const value = firstSheet.data[rowIndex] 
              ? (firstSheet.data[rowIndex][colIndex] || '')
              : '';
            mergedRow.push(value);
          }
        }
        
        mergedRows.push(mergedRow);
        
        // 使用setTimeout分批处理大量数据，避免长时间阻塞UI线程
        if (needsBatching && rowIndex % batchSize === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      // 返回合并后的数据
      return {
        headers: headers,
        rows: mergedRows,
        rowCount: mergedRows.length,
        colCount: colCount,
        mergedColumns: config.selectedColumns
      };
    } catch (error) {
      console.error('Data merge error:', error);
      if (error instanceof NoSheetError || error instanceof NoColumnSelectedError) {
        throw error;
      }
      throw new MergeError(`合并失败: ${error.message}`);
    }
  }
  
  /**
   * 合并单个单元格的值
   * @param {Array<any>} values - 来自不同sheet的同位置单元格值
   * @param {string} separator - 分隔符
   * @param {boolean} skipEmpty - 是否跳过空值
   * @returns {string}
   */
  mergeCellValues(values, separator, skipEmpty) {
    if (!values || values.length === 0) {
      return '';
    }
    
    // 处理值数组
    let processedValues = values.map(value => {
      // 将值转换为字符串
      if (value === null || value === undefined) {
        return '';
      }
      return String(value).trim();
    });
    
    // 如果需要跳过空值，过滤掉空字符串
    if (skipEmpty) {
      processedValues = processedValues.filter(value => value !== '');
    }

    // 使用分隔符连接值
    return processedValues.join(separator);
  }
}

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.DataMerger = DataMerger;
}
