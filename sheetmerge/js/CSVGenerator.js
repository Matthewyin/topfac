/**
 * CSVGenerator - 负责生成CSV文件并触发下载
 */
class CSVGenerator {
  /**
   * 将合并数据转换为CSV格式
   * @param {MergedData} data
   * @returns {string} CSV文本内容
   */
  generateCSV(data) {
    try {
      if (!data || !data.headers || !data.rows) {
        throw new Error('Invalid data format for CSV generation');
      }
    
    // 添加UTF-8 BOM标记，确保Excel正确识别中文
    let csvContent = '\uFEFF';
    
    // 转换表头为CSV格式
    const headerRow = data.headers.map(header => this.escapeCSVValue(header)).join(',');
    csvContent += headerRow + '\r\n';
    
      // 转换每行数据为CSV格式
      data.rows.forEach(row => {
        const csvRow = row.map(cell => this.escapeCSVValue(cell)).join(',');
        csvContent += csvRow + '\r\n';
      });
      
      return csvContent;
    } catch (error) {
      console.error('CSV generation error:', error);
      throw new DownloadError(`CSV生成失败: ${error.message}`);
    }
  }
  
  /**
   * 触发浏览器下载CSV文件
   * @param {string} csvContent
   * @param {string} fileName
   */
  downloadCSV(csvContent, fileName) {
    try {
      // 创建Blob对象，类型为text/csv
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 使用URL.createObjectURL生成下载链接
      const url = URL.createObjectURL(blob);
      
      // 创建临时<a>标签触发下载
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      // 添加到DOM并触发点击
      document.body.appendChild(link);
      link.click();
      
      // 清理：移除元素并释放URL对象
      document.body.removeChild(link);
      
      // 延迟释放URL对象，确保下载开始
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Download error:', error);
      throw new DownloadError();
    }
  }
  
  /**
   * 转义CSV特殊字符
   * @param {any} value
   * @returns {string}
   */
  escapeCSVValue(value) {
    // 处理null和undefined
    if (value === null || value === undefined) {
      return '';
    }
    
    // 转换为字符串
    let stringValue = String(value);
    
    // 检测值中是否包含逗号、引号、换行符
    const needsEscaping = stringValue.includes(',') || 
                         stringValue.includes('"') || 
                         stringValue.includes('\n') || 
                         stringValue.includes('\r');
    
    if (needsEscaping) {
      // 将值中的双引号转义为两个双引号
      stringValue = stringValue.replace(/"/g, '""');
      
      // 用双引号包裹
      return `"${stringValue}"`;
    }
    
    return stringValue;
  }
}
