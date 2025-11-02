/**
 * ErrorTypes - 自定义错误类型定义
 */

/**
 * 文件类型错误
 */
class FileTypeError extends Error {
  constructor(message = '请上传.xlsx或.xls格式的Excel文件') {
    super(message);
    this.name = 'FileTypeError';
  }
}

/**
 * 文件读取错误
 */
class FileReadError extends Error {
  constructor(message = '文件读取失败，请确认文件未损坏') {
    super(message);
    this.name = 'FileReadError';
  }
}

/**
 * Sheet结构错误
 */
class SheetStructureError extends Error {
  constructor(message = '所有sheet页的列结构必须相同') {
    super(message);
    this.name = 'SheetStructureError';
  }
}

/**
 * 没有Sheet错误
 */
class NoSheetError extends Error {
  constructor(message = 'Excel文件中未找到任何工作表') {
    super(message);
    this.name = 'NoSheetError';
  }
}

/**
 * 未选择列错误
 */
class NoColumnSelectedError extends Error {
  constructor(message = '请至少选择一列进行合并') {
    super(message);
    this.name = 'NoColumnSelectedError';
  }
}

/**
 * 合并错误
 */
class MergeError extends Error {
  constructor(message = '数据合并失败，请重试') {
    super(message);
    this.name = 'MergeError';
  }
}

/**
 * 下载错误
 */
class DownloadError extends Error {
  constructor(message = '文件下载失败，请重试') {
    super(message);
    this.name = 'DownloadError';
  }
}

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.FileTypeError = FileTypeError;
  window.FileReadError = FileReadError;
  window.SheetStructureError = SheetStructureError;
  window.NoSheetError = NoSheetError;
  window.NoColumnSelectedError = NoColumnSelectedError;
  window.MergeError = MergeError;
  window.DownloadError = DownloadError;
}
