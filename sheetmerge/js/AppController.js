/**
 * AppController - 协调各组件，管理应用状态和流程
 */
class AppController {
  constructor() {
    this.state = {
      currentFile: null,
      parsedData: null,
      mergedData: null,
      config: {
        selectedColumns: [],
        separator: '\n',
        skipEmpty: true
      }
    };
    
    // 初始化服务实例
    this.excelParser = new ExcelParser();
    this.dataMerger = new DataMerger();
    this.csvGenerator = new CSVGenerator();
    
    // DOM元素引用
    this.elements = {
      uploadArea: document.getElementById('upload-area'),
      fileInput: document.getElementById('file-input'),
      configPanel: document.getElementById('config-panel'),
      previewSection: document.getElementById('preview-section'),
      messageContainer: document.getElementById('message-container'),
      loadingOverlay: document.getElementById('loading-overlay'),
      loadingText: document.getElementById('loading-text')
    };
  }
  
  /**
   * 初始化应用
   */
  init() {
    // 初始化应用状态对象（已在constructor中完成）
    
    // 绑定所有事件监听器
    this.bindEvents();
    
    // 显示初始界面（上传区域默认可见，其他区域隐藏）
    this.showInitialUI();
    
    console.log('AppController initialized');
  }
  
  /**
   * 显示初始界面
   */
  showInitialUI() {
    const { uploadArea, configPanel, previewSection } = this.elements;
    
    // 确保上传区域可见
    if (uploadArea) {
      uploadArea.classList.remove('hidden');
    }
    
    // 确保配置面板和预览区域隐藏
    if (configPanel) {
      configPanel.classList.add('hidden');
    }
    if (previewSection) {
      previewSection.classList.add('hidden');
    }
    
    // 隐藏加载动画和消息
    this.hideLoading();
    this.hideMessage();
  }
  
  /**
   * 更新应用状态
   * @param {Object} updates - 要更新的状态字段
   */
  updateState(updates) {
    // 更新状态
    Object.assign(this.state, updates);
    
    // 根据状态变化更新UI
    this.updateUIFromState();
  }
  
  /**
   * 根据当前状态更新UI
   */
  updateUIFromState() {
    const { currentFile, parsedData, mergedData } = this.state;
    const { uploadArea, configPanel, previewSection } = this.elements;
    
    // 根据状态决定显示哪个区域
    if (mergedData) {
      // 有合并数据：显示预览区域
      if (uploadArea) uploadArea.classList.add('hidden');
      if (configPanel) configPanel.classList.add('hidden');
      if (previewSection) previewSection.classList.remove('hidden');
    } else if (parsedData) {
      // 有解析数据：显示配置面板
      if (uploadArea) uploadArea.classList.add('hidden');
      if (configPanel) configPanel.classList.remove('hidden');
      if (previewSection) previewSection.classList.add('hidden');
    } else {
      // 初始状态：显示上传区域
      if (uploadArea) uploadArea.classList.remove('hidden');
      if (configPanel) configPanel.classList.add('hidden');
      if (previewSection) previewSection.classList.add('hidden');
    }
  }
  
  /**
   * 绑定所有事件监听器
   */
  bindEvents() {
    // 文件上传相关事件
    this.bindFileUploadEvents();
    
    // 配置面板相关事件
    this.bindConfigPanelEvents();
  }
  
  /**
   * 绑定文件上传事件
   */
  bindFileUploadEvents() {
    const { uploadArea, fileInput } = this.elements;
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });
    
    // 文件选择后处理
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    });
    
    // 拖拽上传事件
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });
  }
  
  /**
   * 处理文件上传
   * @param {File} file - 用户上传的文件
   */
  async handleFileUpload(file) {
    try {
      // 验证文件类型
      if (!this.validateFileType(file)) {
        throw new FileTypeError();
      }
      
      // 显示文件名反馈
      this.showFileNameFeedback(file.name, file.size);
      
      // 检测文件大小，超过10MB时显示警告
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        this.showMessage('warning', `文件较大 (${fileSizeMB.toFixed(2)} MB)，处理可能需要较长时间，请耐心等待`);
        // 给用户时间看到警告消息
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // 显示加载动画
      this.showLoading('正在读取文件...');
      
      // 解析Excel文件
      const parsedData = await this.excelParser.parseFile(file);
      
      // 验证sheet结构（现在会自动对齐列数）
      const validation = this.excelParser.validateSheetStructure(parsedData.sheets);
      
      if (!validation.isValid) {
        this.hideLoading();
        throw new SheetStructureError(validation.message);
      }
      
      // 保存解析数据
      this.state.currentFile = file;
      this.state.parsedData = parsedData;
      
      // 隐藏加载动画
      this.hideLoading();
      
      // 显示成功消息
      this.showMessage('success', `成功读取文件：${file.name}，包含 ${parsedData.sheets.length} 个工作表`);
      
      // 显示配置面板
      this.showConfigPanel();
      
    } catch (error) {
      this.hideLoading();
      this.handleError(error, 'file upload');
    }
  }
  
  /**
   * 显示文件名反馈
   * @param {string} fileName - 文件名
   * @param {number} fileSize - 文件大小（字节）
   */
  showFileNameFeedback(fileName, fileSize) {
    const uploadArea = this.elements.uploadArea;
    const uploadPrompt = uploadArea.querySelector('.upload-prompt');
    
    // 创建或更新文件信息显示
    let fileInfo = uploadArea.querySelector('.file-info');
    if (!fileInfo) {
      fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      uploadPrompt.appendChild(fileInfo);
    }
    
    // 格式化文件大小
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    const sizeDisplay = fileSize > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
    
    fileInfo.innerHTML = `<p style="margin-top: 12px; color: #4A90E2; font-weight: 600;">📄 ${fileName} (${sizeDisplay})</p>`;
  }
  
  /**
   * 验证文件类型
   * @param {File} file
   * @returns {boolean}
   */
  validateFileType(file) {
    // 检查文件扩展名
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return false;
    }
    
    // 检查MIME类型
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // 某些系统可能返回这个
    ];
    
    // 如果MIME类型存在，验证它；否则只依赖扩展名
    if (file.type && !validMimeTypes.includes(file.type)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 显示消息提示
   * @param {string} type - 消息类型: info, success, error, warning
   * @param {string} text - 消息文本
   */
  showMessage(type, text) {
    const { messageContainer } = this.elements;
    const messageIcon = messageContainer.querySelector('.message-icon');
    const messageText = messageContainer.querySelector('.message-text');
    const messageClose = messageContainer.querySelector('.message-close');
    
    // 设置图标
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    
    messageIcon.textContent = icons[type] || icons.info;
    messageText.textContent = text;
    
    // 移除所有类型类
    messageContainer.classList.remove('info', 'success', 'error', 'warning');
    // 添加当前类型类
    messageContainer.classList.add(type);
    // 显示消息
    messageContainer.classList.remove('hidden');
    
    // 自动关闭（3秒后）
    const autoCloseTimer = setTimeout(() => {
      this.hideMessage();
    }, 3000);
    
    // 手动关闭
    const closeHandler = () => {
      clearTimeout(autoCloseTimer);
      this.hideMessage();
      messageClose.removeEventListener('click', closeHandler);
    };
    
    messageClose.addEventListener('click', closeHandler);
  }
  
  /**
   * 隐藏消息提示
   */
  hideMessage() {
    this.elements.messageContainer.classList.add('hidden');
  }
  
  /**
   * 显示加载动画
   * @param {string} text - 加载提示文本
   */
  showLoading(text = '处理中...') {
    const { loadingOverlay, loadingText } = this.elements;
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
  }
  
  /**
   * 隐藏加载动画
   */
  hideLoading() {
    this.elements.loadingOverlay.classList.add('hidden');
  }
  
  /**
   * 绑定配置面板事件
   */
  bindConfigPanelEvents() {
    // 全选按钮
    const selectAllBtn = document.getElementById('select-all');
    selectAllBtn.addEventListener('click', () => {
      this.selectAllColumns();
    });
    
    // 取消全选按钮
    const deselectAllBtn = document.getElementById('deselect-all');
    deselectAllBtn.addEventListener('click', () => {
      this.deselectAllColumns();
    });
    
    // 分隔符下拉菜单
    const separatorSelect = document.getElementById('separator-select');
    separatorSelect.addEventListener('change', (e) => {
      this.handleSeparatorChange(e.target.value);
    });
    
    // 跳过空单元格复选框
    const skipEmptyCheckbox = document.getElementById('skip-empty');
    skipEmptyCheckbox.addEventListener('change', (e) => {
      this.state.config.skipEmpty = e.target.checked;
    });
    
    // 合并按钮
    const mergeBtn = document.getElementById('merge-btn');
    mergeBtn.addEventListener('click', () => {
      this.handleMerge();
    });
  }
  
  /**
   * 显示配置面板
   */
  showConfigPanel() {
    const { configPanel, uploadArea } = this.elements;
    
    if (!this.state.parsedData) {
      return;
    }
    
    // 隐藏上传区域
    uploadArea.classList.add('hidden');
    
    // 显示sheet信息
    this.displaySheetInfo();
    
    // 生成列选择复选框
    this.generateColumnCheckboxes();
    
    // 显示配置面板
    configPanel.classList.remove('hidden');
  }
  
  /**
   * 显示sheet信息
   */
  displaySheetInfo() {
    const { parsedData } = this.state;
    const sheetCountElement = document.getElementById('sheet-count');
    
    if (!parsedData || !parsedData.sheets) {
      return;
    }
    
    // 显示sheet数量
    sheetCountElement.textContent = parsedData.sheets.length;
    
    // 可以在这里添加更详细的sheet信息显示
    // 例如：每个sheet的名称和行数
    const sheetInfo = document.querySelector('.sheet-info');
    
    // 创建详细信息元素
    let detailsHTML = `<p>检测到 <strong id="sheet-count">${parsedData.sheets.length}</strong> 个工作表</p>`;
    detailsHTML += '<ul style="margin-top: 8px; font-size: 13px; color: #666;">';
    
    parsedData.sheets.forEach(sheet => {
      detailsHTML += `<li>${sheet.name} (${sheet.rowCount} 行, ${sheet.colCount} 列)</li>`;
    });
    
    detailsHTML += '</ul>';
    sheetInfo.innerHTML = detailsHTML;
  }
  
  /**
   * 动态生成列选择复选框
   */
  generateColumnCheckboxes() {
    const { parsedData } = this.state;
    const columnList = document.getElementById('column-list');
    
    if (!parsedData || !parsedData.sheets || parsedData.sheets.length === 0) {
      return;
    }
    
    // 清空现有内容
    columnList.innerHTML = '';
    
    // 从第一个sheet提取列信息
    const firstSheet = parsedData.sheets[0];
    const columns = this.excelParser.extractColumns(firstSheet);
    
    // 为每列创建复选框（跳过空白列）
    columns.forEach(column => {
      // 跳过列名为空的列
      if (!column.name || column.name.trim() === '') {
        return;
      }
      
      const label = document.createElement('label');
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = column.index;
      checkbox.dataset.columnIndex = column.index;
      checkbox.dataset.columnName = column.displayName;
      
      // 绑定change事件
      checkbox.addEventListener('change', () => {
        this.handleColumnSelectionChange();
      });
      
      const span = document.createElement('span');
      span.textContent = column.displayName;
      
      label.appendChild(checkbox);
      label.appendChild(span);
      columnList.appendChild(label);
    });
  }
  
  /**
   * 处理列选择变化
   */
  handleColumnSelectionChange() {
    const columnList = document.getElementById('column-list');
    const checkboxes = columnList.querySelectorAll('input[type="checkbox"]');
    
    // 收集选中的列索引
    const selectedColumns = [];
    checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedColumns.push(parseInt(checkbox.value));
      }
    });
    
    // 更新状态
    this.state.config.selectedColumns = selectedColumns;
    
    // 更新合并按钮状态
    this.updateMergeButtonState();
  }
  
  /**
   * 更新合并按钮状态
   */
  updateMergeButtonState() {
    const mergeBtn = document.getElementById('merge-btn');
    const { selectedColumns } = this.state.config;
    
    if (selectedColumns.length > 0) {
      mergeBtn.disabled = false;
    } else {
      mergeBtn.disabled = true;
    }
  }
  
  /**
   * 全选所有列
   */
  selectAllColumns() {
    const columnList = document.getElementById('column-list');
    const checkboxes = columnList.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
    
    // 触发选择变化处理
    this.handleColumnSelectionChange();
  }
  
  /**
   * 取消全选所有列
   */
  deselectAllColumns() {
    const columnList = document.getElementById('column-list');
    const checkboxes = columnList.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // 触发选择变化处理
    this.handleColumnSelectionChange();
  }
  
  /**
   * 处理分隔符变化
   * @param {string} value - 选择的分隔符值
   */
  handleSeparatorChange(value) {
    const customSeparatorInput = document.getElementById('custom-separator');
    
    if (value === 'custom') {
      // 显示自定义输入框
      customSeparatorInput.classList.remove('hidden');
      customSeparatorInput.focus();
      
      // 监听自定义输入
      customSeparatorInput.addEventListener('input', (e) => {
        this.state.config.separator = e.target.value;
      });
    } else {
      // 隐藏自定义输入框
      customSeparatorInput.classList.add('hidden');
      
      // 设置预定义分隔符
      // 将转义字符转换为实际字符
      let separator = value;
      if (value === '\\n') {
        separator = '\n';
      }
      this.state.config.separator = separator;
    }
  }
  
  /**
   * 处理合并操作
   */
  async handleMerge() {
    const mergeBtn = document.getElementById('merge-btn');
    
    try {
      const { parsedData, config } = this.state;
      
      // 验证是否有数据
      if (!parsedData || !parsedData.sheets || parsedData.sheets.length === 0) {
        throw new NoSheetError('没有可合并的数据');
      }
      
      // 验证是否选择了列
      if (!config.selectedColumns || config.selectedColumns.length === 0) {
        throw new NoColumnSelectedError();
      }
      
      // 禁用按钮，添加视觉反馈
      mergeBtn.disabled = true;
      mergeBtn.textContent = '合并中...';
      
      // 显示加载动画
      this.showLoading('正在合并数据...');
      
      // 使用setTimeout让UI有时间更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 调用DataMerger.merge方法执行合并（现在是async）
      const mergedData = await this.dataMerger.merge(parsedData.sheets, config);
      
      // 保存合并结果
      this.state.mergedData = mergedData;
      
      // 隐藏加载动画
      this.hideLoading();
      
      // 恢复按钮状态
      mergeBtn.disabled = false;
      mergeBtn.textContent = '开始合并';
      
      // 显示成功消息
      this.showMessage('success', `合并成功！共 ${mergedData.rowCount} 行数据`);
      
      // 显示预览区域
      this.showPreview();
      
    } catch (error) {
      this.hideLoading();
      // 恢复按钮状态
      mergeBtn.disabled = false;
      mergeBtn.textContent = '开始合并';
      this.handleError(error, 'merge');
    }
  }
  
  /**
   * 显示预览区域
   */
  showPreview() {
    const { mergedData } = this.state;
    const { configPanel, previewSection } = this.elements;
    
    if (!mergedData) {
      return;
    }
    
    // 隐藏配置面板
    configPanel.classList.add('hidden');
    
    // 显示预览区域
    previewSection.classList.remove('hidden');
    
    // 更新统计信息
    document.getElementById('total-rows').textContent = mergedData.rowCount;
    document.getElementById('total-cols').textContent = mergedData.colCount;
    
    // 显示合并的列信息
    this.displayMergedColumnsInfo();
    
    // 生成预览表格
    this.generatePreviewTable();
    
    // 绑定预览区域的事件（如果还没绑定）
    this.bindPreviewEvents();
  }
  
  /**
   * 显示合并的列信息
   */
  displayMergedColumnsInfo() {
    const { mergedData } = this.state;
    const previewInfo = document.querySelector('.preview-info');
    
    if (!mergedData || !previewInfo) {
      return;
    }
    
    // 获取合并的列名
    const mergedColumnNames = mergedData.mergedColumns.map(colIndex => {
      return mergedData.headers[colIndex] || `列${colIndex + 1}`;
    });
    
    // 检查是否已存在合并列信息元素
    let mergedInfoSpan = previewInfo.querySelector('.merged-columns-info');
    
    if (!mergedInfoSpan) {
      mergedInfoSpan = document.createElement('span');
      mergedInfoSpan.className = 'merged-columns-info';
      previewInfo.appendChild(mergedInfoSpan);
    }
    
    // 更新合并列信息
    if (mergedColumnNames.length > 0) {
      mergedInfoSpan.innerHTML = `已合并列: <strong>${mergedColumnNames.join(', ')}</strong>`;
    } else {
      mergedInfoSpan.innerHTML = '';
    }
  }
  
  /**
   * 生成预览表格
   * 优化：使用文档片段减少DOM操作，只渲染前10行数据
   */
  generatePreviewTable() {
    const { mergedData } = this.state;
    const previewTable = document.getElementById('preview-table');
    
    if (!mergedData) {
      return;
    }
    
    // 清空现有表格
    previewTable.innerHTML = '';
    
    // 使用文档片段减少DOM操作
    const fragment = document.createDocumentFragment();
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    mergedData.headers.forEach((header, index) => {
      const th = document.createElement('th');
      th.textContent = header;
      
      // 如果是合并的列，添加特殊样式
      if (mergedData.mergedColumns.includes(index)) {
        th.classList.add('merged-column');
        th.title = '已合并列';
      }
      
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    fragment.appendChild(thead);
    
    // 创建表体（只渲染前10行数据）
    const tbody = document.createElement('tbody');
    const previewRows = mergedData.rows.slice(0, 10);
    
    previewRows.forEach(row => {
      const tr = document.createElement('tr');
      
      row.forEach((cell, index) => {
        const td = document.createElement('td');
        
        // 处理换行符显示
        const cellValue = String(cell || '');
        
        // 如果是合并的列，添加特殊样式
        if (mergedData.mergedColumns.includes(index)) {
          td.classList.add('merged-column');
          // 保留换行符的显示
          td.style.whiteSpace = 'pre-wrap';
        }
        
        td.textContent = cellValue;
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    fragment.appendChild(tbody);
    
    // 一次性添加到DOM，减少重排
    previewTable.appendChild(fragment);
  }
  
  /**
   * 绑定预览区域事件
   */
  bindPreviewEvents() {
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // 移除旧的事件监听器（如果存在）
    const newDownloadBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);
    
    const newResetBtn = resetBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
    
    // 绑定下载按钮
    newDownloadBtn.addEventListener('click', () => {
      this.handleDownload();
    });
    
    // 绑定重置按钮
    newResetBtn.addEventListener('click', () => {
      this.handleReset();
    });
  }
  
  /**
   * 处理下载操作
   */
  handleDownload() {
    const downloadBtn = document.getElementById('download-btn');
    
    try {
      const { mergedData, currentFile } = this.state;
      
      // 验证是否有合并数据
      if (!mergedData) {
        throw new DownloadError('没有可下载的数据');
      }
      
      // 禁用按钮，添加视觉反馈
      downloadBtn.disabled = true;
      downloadBtn.textContent = '生成中...';
      
      // 显示加载动画
      this.showLoading('正在生成文件...');
      
      // 使用setTimeout让UI有时间更新
      setTimeout(() => {
        try {
          // 调用CSVGenerator.generateCSV生成CSV内容
          const csvContent = this.csvGenerator.generateCSV(mergedData);
          
          // 生成文件名（原文件名_merged.csv）
          let fileName = 'merged.csv';
          if (currentFile && currentFile.name) {
            // 移除原文件扩展名，添加_merged.csv
            const originalName = currentFile.name.replace(/\.(xlsx|xls)$/i, '');
            fileName = `${originalName}_merged.csv`;
          }
          
          // 调用CSVGenerator.downloadCSV触发下载
          this.csvGenerator.downloadCSV(csvContent, fileName);
          
          // 隐藏加载动画
          this.hideLoading();
          
          // 恢复按钮状态
          downloadBtn.disabled = false;
          downloadBtn.textContent = '下载CSV文件';
          
          // 显示下载成功提示
          this.showMessage('success', `文件下载成功：${fileName}`);
          
        } catch (error) {
          this.hideLoading();
          // 恢复按钮状态
          downloadBtn.disabled = false;
          downloadBtn.textContent = '下载CSV文件';
          this.handleError(error, 'download');
        }
      }, 100);
      
    } catch (error) {
      this.hideLoading();
      // 恢复按钮状态
      downloadBtn.disabled = false;
      downloadBtn.textContent = '下载CSV文件';
      this.handleError(error, 'download');
    }
  }
  
  /**
   * 处理重新配置操作（从预览返回配置面板）
   */
  handleReset() {
    const { previewSection, configPanel } = this.elements;
    
    // 隐藏预览区域
    previewSection.classList.add('hidden');
    
    // 显示配置面板
    configPanel.classList.remove('hidden');
    
    // 清空合并数据
    this.state.mergedData = null;
  }
  
  /**
   * 处理完全重置操作（返回初始上传界面）
   */
  handleFullReset() {
    // 确认用户是否要重置
    if (confirm('确定要重新开始吗？当前的配置和数据将被清空。')) {
      this.reset();
      this.showMessage('info', '已重置，请重新上传文件');
    }
  }
  
  /**
   * 统一错误处理方法
   * @param {Error} error - 错误对象
   * @param {string} context - 错误发生的上下文
   */
  handleError(error, context = 'operation') {
    console.error(`Error in ${context}:`, error);
    
    let message = '操作失败，请重试';
    
    // 根据错误类型显示友好提示
    if (error instanceof FileTypeError) {
      message = error.message;
    } else if (error instanceof FileReadError) {
      message = error.message;
    } else if (error instanceof SheetStructureError) {
      message = error.message;
    } else if (error instanceof NoSheetError) {
      message = error.message;
    } else if (error instanceof NoColumnSelectedError) {
      message = error.message;
    } else if (error instanceof MergeError) {
      message = error.message;
    } else if (error instanceof DownloadError) {
      message = error.message;
    } else if (error.message) {
      message = error.message;
    }
    
    // 显示错误消息
    this.showMessage('error', message);
    
    // 重置到安全状态
    this.resetToSafeState(error);
  }
  
  /**
   * 重置到安全状态
   * @param {Error} error - 错误对象
   */
  resetToSafeState(error) {
    // 根据错误类型决定重置策略
    if (error instanceof FileTypeError || error instanceof FileReadError) {
      // 文件相关错误：清空文件输入，允许重新上传
      if (this.elements.fileInput) {
        this.elements.fileInput.value = '';
      }
      // 清理可能的中间数据
      this.state.currentFile = null;
      this.state.parsedData = null;
      this.state.mergedData = null;
      
      // 确保显示上传区域
      if (this.elements.uploadArea) {
        this.elements.uploadArea.classList.remove('hidden');
      }
      if (this.elements.configPanel) {
        this.elements.configPanel.classList.add('hidden');
      }
      if (this.elements.previewSection) {
        this.elements.previewSection.classList.add('hidden');
      }
    } else if (error instanceof SheetStructureError || error instanceof NoSheetError) {
      // Sheet结构错误：清空解析数据，允许重新上传
      if (this.elements.fileInput) {
        this.elements.fileInput.value = '';
      }
      this.state.parsedData = null;
      this.state.mergedData = null;
      
      // 显示上传区域
      if (this.elements.uploadArea) {
        this.elements.uploadArea.classList.remove('hidden');
      }
      if (this.elements.configPanel) {
        this.elements.configPanel.classList.add('hidden');
      }
    } else if (error instanceof NoColumnSelectedError) {
      // 未选择列错误：保持在配置面板，允许用户选择列
      // 不需要清理状态，用户可以继续选择
    } else if (error instanceof MergeError) {
      // 合并错误：保留配置，清空合并数据，允许重新合并
      this.state.mergedData = null;
      
      // 确保配置面板可见
      if (this.elements.configPanel) {
        this.elements.configPanel.classList.remove('hidden');
      }
      if (this.elements.previewSection) {
        this.elements.previewSection.classList.add('hidden');
      }
    } else if (error instanceof DownloadError) {
      // 下载错误：保留合并数据，允许重新下载
      // 不需要清理状态，用户可以重试下载
    }
    
    // 确保加载动画已隐藏
    this.hideLoading();
    
    // 确保消息提示可见（如果还没显示）
    // 这样用户可以看到错误信息
  }
  
  /**
   * 重置应用到初始状态
   * 清空所有状态，隐藏配置面板和预览区域，显示文件上传区域
   */
  reset() {
    // 清空所有状态
    this.state.currentFile = null;
    this.state.parsedData = null;
    this.state.mergedData = null;
    this.state.config = {
      selectedColumns: [],
      separator: '\n',
      skipEmpty: true
    };
    
    // 清空file input的值
    if (this.elements.fileInput) {
      this.elements.fileInput.value = '';
    }
    
    // 隐藏配置面板和预览区域
    if (this.elements.configPanel) {
      this.elements.configPanel.classList.add('hidden');
    }
    if (this.elements.previewSection) {
      this.elements.previewSection.classList.add('hidden');
    }
    
    // 显示文件上传区域
    if (this.elements.uploadArea) {
      this.elements.uploadArea.classList.remove('hidden');
    }
    
    // 隐藏加载动画和消息
    this.hideLoading();
    this.hideMessage();
    
    // 重置分隔符选择器
    const separatorSelect = document.getElementById('separator-select');
    if (separatorSelect) {
      separatorSelect.value = '\\n';
    }
    
    // 隐藏自定义分隔符输入框
    const customSeparatorInput = document.getElementById('custom-separator');
    if (customSeparatorInput) {
      customSeparatorInput.classList.add('hidden');
      customSeparatorInput.value = '';
    }
    
    // 重置跳过空单元格复选框
    const skipEmptyCheckbox = document.getElementById('skip-empty');
    if (skipEmptyCheckbox) {
      skipEmptyCheckbox.checked = true;
    }
    
    // 清空列选择列表
    const columnList = document.getElementById('column-list');
    if (columnList) {
      columnList.innerHTML = '';
    }
    
    // 禁用合并按钮
    const mergeBtn = document.getElementById('merge-btn');
    if (mergeBtn) {
      mergeBtn.disabled = true;
    }
  }
  
  /**
   * 完全重置应用状态（别名方法，保持向后兼容）
   */
  fullReset() {
    this.reset();
  }
}
