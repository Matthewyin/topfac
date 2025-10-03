#!/usr/bin/env python3
"""
修复 topology-api.ts 文件
移除所有 baseURL 参数，因为我们现在在构造函数中处理
"""

import re

# 读取文件
with open('client/services/topology-api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 移除所有的 baseURL: this.baseURL, 行
content = re.sub(r'\s*baseURL: this\.baseURL,\s*\n', '', content)

# 移除所有的 this.buildUrl( 调用，直接使用路径
content = re.sub(r'this\.\$fetch\(this\.buildUrl\(', 'this.$fetch(', content)

# 写回文件
with open('client/services/topology-api.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ API客户端文件已修复")

