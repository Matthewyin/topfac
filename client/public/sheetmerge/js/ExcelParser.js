/**
 * ExcelParser - 负责解析Excel文件，提取sheet数据
 */
class ExcelParser {
  /**
   * 解析Excel文件
   * @param {File} file - 用户上传的文件对象
   * @returns {Promise<ParsedExcelData>}
   */
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 检查是否有sheet
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new NoSheetError();
          }
          
          // 提取所有sheet的数据
          const sheets = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,  // 返回二维数组
              defval: ''  // 空单元格默认值为空字符串
            });
            
            // 如果sheet为空，至少返回一个空数组
            const data = jsonData.length > 0 ? jsonData : [[]];
            const rowCount = data.length;
            const colCount = rowCount > 0 ? Math.max(...data.map(row => row.length)) : 0;
            
            // 提取列标题（第一行）
            const headers = rowCount > 0 ? data[0] : [];
            
            return {
              name: sheetName,
              data: data,
              rowCount: rowCount,
              colCount: colCount,
              headers: headers
            };
          });
          
          resolve({
            fileName: file.name,
            sheets: sheets
          });
        } catch (error) {
          console.error('Excel parsing error:', error);
          if (error instanceof NoSheetError) {
            reject(error);
          } else {
            reject(new FileReadError(`文件解析失败: ${error.message}`));
          }
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error');
        reject(new FileReadError());
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * 验证所有sheet结构一致性（放宽验证，自动对齐列数）
   * @param {Array<Sheet>} sheets
   * @returns {ValidationResult}
   */
  validateSheetStructure(sheets) {
    if (!sheets || sheets.length === 0) {
      const error = new NoSheetError();
      return {
        isValid: false,
        message: error.message,
        columnCount: 0,
        headers: [],
        warnings: []
      };
    }
    
    // 找出最大列数
    const maxColumnCount = Math.max(...sheets.map(s => s.colCount));
    
    // 收集警告信息
    const warnings = [];
    
    // 检查并对齐所有sheet
    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      
      if (sheet.colCount < maxColumnCount) {
        warnings.push(`工作表 "${sheet.name}" 列数 (${sheet.colCount}) 少于最大列数 (${maxColumnCount})，将自动填充空列`);
        
        // 填充 headers
        while (sheet.headers.length < maxColumnCount) {
          sheet.headers.push('');
        }
        
        // 填充每一行数据
        sheet.data.forEach(row => {
          while (row.length < maxColumnCount) {
            row.push('');
          }
        });
        
        // 更新列数
        sheet.colCount = maxColumnCount;
      }
    }
    
    // 使用第一个sheet的headers作为基准（已经对齐过了）
    const baseHeaders = sheets[0].headers;
    
    return {
      isValid: true,
      message: warnings.length > 0 ? '已自动对齐所有工作表的列数' : '所有工作表结构一致',
      columnCount: maxColumnCount,
      headers: baseHeaders,
      warnings: warnings
    };
  }
  
  /**
   * 提取列信息
   * @param {Sheet} sheet
   * @returns {Array<ColumnInfo>}
   */
  extractColumns(sheet) {
    if (!sheet || !sheet.headers) {
      return [];
    }
    
    const columns = [];
    const headers = sheet.headers;
    
    for (let i = 0; i < headers.length; i++) {
      // 生成列字母标识 (A, B, C, ...)
      const columnLetter = this._getColumnLetter(i);
      const columnName = headers[i] || '';
      
      columns.push({
        index: i,
        letter: columnLetter,
        name: columnName,
        displayName: columnName ? `${columnLetter}: ${columnName}` : ''
      });
    }
    
    return columns;
  }
  
  /**
   * 将列索引转换为Excel列字母 (0 -> A, 1 -> B, 25 -> Z, 26 -> AA, ...)
   * @param {number} index - 列索引 (0-based)
   * @returns {string}
   * @private
   */
  _getColumnLetter(index) {
    let letter = '';
    let num = index;
    
    while (num >= 0) {
      letter = String.fromCharCode(65 + (num % 26)) + letter;
      num = Math.floor(num / 26) - 1;
    }
    
    return letter;
  }
}
