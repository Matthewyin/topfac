#!/bin/bash
# User-Agent分析统计脚本
# 分析JSON日志中的User-Agent，识别正常用户、爬虫、扫描器等

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 设置日期参数
DATE=$(date +%Y%m%d)
LOG_FILE="/var/log/openresty/json/access-${DATE}.json"

echo -e "${GREEN}=== User-Agent分析报告 ===${NC}"
echo "日期: $DATE"
echo ""

# 检查日志文件是否存在
if [ ! -f "$LOG_FILE" ]; then
    echo "错误: 日志文件不存在: $LOG_FILE"
    exit 1
fi

echo "日志文件: $LOG_FILE"
echo ""

# 1. 基础统计
echo "=== 📊 基础统计 ==="
echo ""

TOTAL=$(wc -l < "$LOG_FILE")
echo "总请求数: $TOTAL"

SUCCESS=$(grep -c '"status":200' "$LOG_FILE" 2>/dev/null || echo 0)
echo "成功请求 (200): $SUCCESS"

ERROR_4XX=$(grep -cE '"status":4[0-9]{2}' "$LOG_FILE" 2>/dev/null || echo 0)
echo "客户端错误 (4xx): $ERROR_4XX"

ERROR_5XX=$(grep -cE '"status":5[0-9]{2}' "$LOG_FILE" 2>/dev/null || echo 0)
echo "服务器错误 (5xx): $ERROR_5XX"

echo ""

# 2. User-Agent分类
echo "=== 🔍 User-Agent分类 ==="
echo ""

# 正常浏览器
BROWSER=$(grep -cE 'Chrome.*Safari|Firefox|Edge' "$LOG_FILE" 2>/dev/null || echo 0)
echo "正常浏览器: $BROWSER ($(awk "BEGIN {printf \"%.1f\", $BROWSER*100/$TOTAL}")%)"

# 移动设备
MOBILE=$(grep -cE 'Mobile|Android|iPhone|iPad' "$LOG_FILE" 2>/dev/null || echo 0)
echo "移动设备: $MOBILE ($(awk "BEGIN {printf \"%.1f\", $MOBILE*100/$TOTAL}")%)"

# curl/wget等工具
TOOLS=$(grep -cE '"http_user_agent":"(curl|wget|python|java|go-http)' "$LOG_FILE" 2>/dev/null || echo 0)
echo "命令行工具: $TOOLS ($(awk "BEGIN {printf \"%.1f\", $TOOLS*100/$TOTAL}")%)"

# 爬虫/机器人
BOTS=$(grep -cE 'bot|spider|crawler|scraper' "$LOG_FILE" 2>/dev/null || echo 0)
echo "爬虫/机器人: $BOTS ($(awk "BEGIN {printf \"%.1f\", $BOTS*100/$TOTAL}")%)"

# 扫描器
SCANNERS=$(grep -cE 'zgrab|masscan|nmap|nikto|sqlmap|scan' "$LOG_FILE" 2>/dev/null || echo 0)
echo "扫描器: $SCANNERS ($(awk "BEGIN {printf \"%.1f\", $SCANNERS*100/$TOTAL}")%)"

# 无User-Agent
NO_UA=$(grep -c '"http_user_agent":"-"' "$LOG_FILE" 2>/dev/null || echo 0)
echo "无User-Agent: $NO_UA ($(awk "BEGIN {printf \"%.1f\", $NO_UA*100/$TOTAL}")%)"

echo ""

# 3. Top 10 User-Agent
echo "=== 📈 Top 10 User-Agent ==="
echo ""
grep -o '"http_user_agent":"[^"]*"' "$LOG_FILE" | \
    sed 's/"http_user_agent":"//;s/"$//' | \
    sort | uniq -c | sort -rn | head -10 | \
    awk '{count=$1; $1=""; ua=$0; printf "  %3d  %s\n", count, ua}'

echo ""

# 4. 可疑请求分析
echo "=== ⚠️  可疑请求分析 ==="
echo ""

# 400错误（格式错误的请求）
BAD_REQUEST=$(grep -c '"status":400' "$LOG_FILE" 2>/dev/null || echo 0)
echo "400错误（格式错误）: $BAD_REQUEST"

# 403错误（被拒绝）
FORBIDDEN=$(grep -c '"status":403' "$LOG_FILE" 2>/dev/null || echo 0)
echo "403错误（被拒绝）: $FORBIDDEN"

# 404错误（资源不存在）
NOT_FOUND=$(grep -c '"status":404' "$LOG_FILE" 2>/dev/null || echo 0)
echo "404错误（不存在）: $NOT_FOUND"

# 没有请求方法的请求
NO_METHOD=$(grep -c '"request_method":"-"' "$LOG_FILE" 2>/dev/null || echo 0)
echo "无请求方法: $NO_METHOD"

echo ""

# 5. Top 10 访问IP
echo "=== 🌐 Top 10 访问IP ==="
echo ""
grep -o '"remote_addr":"[^"]*"' "$LOG_FILE" | \
    sed 's/"remote_addr":"//;s/"$//' | \
    sort | uniq -c | sort -rn | head -10 | \
    awk '{printf "  %3d  %s\n", $1, $2}'

echo ""

# 6. 扫描器详情
if [ $SCANNERS -gt 0 ]; then
    echo "=== 🔎 扫描器详情 ==="
    echo ""
    grep -E 'zgrab|masscan|nmap|nikto|sqlmap|scan|Palo Alto' "$LOG_FILE" | \
        grep -o '"remote_addr":"[^"]*".*"http_user_agent":"[^"]*"' | \
        sed 's/"remote_addr":"//;s/".*"http_user_agent":"/ | /;s/"$//' | \
        sort -u | head -5
    echo ""
fi

# 7. 无User-Agent详情
if [ $NO_UA -gt 0 ]; then
    echo "=== 🚫 无User-Agent请求详情 ==="
    echo ""
    grep '"http_user_agent":"-"' "$LOG_FILE" | \
        grep -o '"remote_addr":"[^"]*".*"status":[0-9]*' | \
        sed 's/"remote_addr":"//;s/".*"status":/ | 状态: /' | \
        sort -u
    echo ""
fi

# 8. 性能统计
echo "=== ⚡ 性能统计 ==="
echo ""

# 平均响应时间
AVG_TIME=$(grep -o '"request_time":[0-9.]*' "$LOG_FILE" | \
    awk -F: '{sum+=$2; count++} END {if(count>0) printf "%.3f", sum/count; else print "0"}')
echo "平均响应时间: ${AVG_TIME}秒"

# 慢请求（>1秒）
SLOW=$(grep -o '"request_time":[0-9.]*' "$LOG_FILE" | \
    awk -F: '$2>1' | wc -l)
echo "慢请求 (>1秒): $SLOW"

# 最慢的5个请求
echo ""
echo "最慢的5个请求:"
grep -o '"request_uri":"[^"]*".*"request_time":[0-9.]*' "$LOG_FILE" | \
    sed 's/"request_uri":"//;s/".*"request_time":/|/;s/$//' | \
    sort -t'|' -k2 -rn | head -5 | \
    awk -F'|' '{printf "  %.3fs  %s\n", $2, $1}'

echo ""

# 9. 请求方法分布
echo "=== 📊 请求方法分布 ==="
echo ""
grep -o '"request_method":"[^"]*"' "$LOG_FILE" | \
    sed 's/"request_method":"//;s/"$//' | \
    sort | uniq -c | sort -rn | \
    awk '{printf "  %s: %d\n", $2, $1}'

echo ""

# 10. 访问最多的URI（Top 10）
echo "=== 🔗 访问最多的URI (Top 10) ==="
echo ""
grep -o '"request_uri":"[^"]*"' "$LOG_FILE" | \
    sed 's/"request_uri":"//;s/"$//' | \
    sort | uniq -c | sort -rn | head -10 | \
    awk '{count=$1; $1=""; uri=$0; printf "  %3d  %s\n", count, uri}'

echo ""

# 11. SSL/TLS统计
echo "=== 🔒 SSL/TLS统计 ==="
echo ""
echo "SSL协议分布:"
grep -o '"ssl_protocol":"[^"]*"' "$LOG_FILE" | \
    sed 's/"ssl_protocol":"//;s/"$//' | \
    grep -v '^-$' | \
    sort | uniq -c | sort -rn | \
    awk '{printf "  %s: %d\n", $2, $1}'

echo ""

# 12. 建议
echo "=== 💡 安全建议 ==="
echo ""

if [ $NO_UA -gt 0 ]; then
    echo "⚠️  发现 $NO_UA 个无User-Agent的请求，建议阻止"
fi

if [ $SCANNERS -gt 0 ]; then
    echo "⚠️  发现 $SCANNERS 个扫描器请求，建议限流"
fi

if [ $BAD_REQUEST -gt 5 ]; then
    echo "⚠️  发现 $BAD_REQUEST 个格式错误的请求，可能是攻击探测"
fi

if [ $SLOW -gt 10 ]; then
    echo "⚠️  发现 $SLOW 个慢请求，建议优化性能"
fi

if [ $NO_UA -eq 0 ] && [ $SCANNERS -eq 0 ] && [ $BAD_REQUEST -lt 5 ]; then
    echo "✅ 未发现明显的安全威胁"
fi

echo ""
echo "=== 分析完成 ==="
echo ""
echo -e "${CYAN}提示：${NC}"
echo "1. 定期运行此脚本监控安全状况"
echo "2. 如发现大量可疑请求，考虑添加防护规则"
echo "3. 可以将此脚本加入cron定时任务"
echo ""
echo "示例cron配置（每天早上9点运行）："
echo "0 9 * * * /usr/local/bin/analyze-user-agent.sh > /var/log/ua-analysis.log"

