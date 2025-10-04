-- log_buffer.lua
-- 日志缓冲区管理模块
-- 使用共享内存缓冲日志，定时批量写入文件

local cjson = require "cjson.safe"

local _M = {}

-- 配置参数
local BUFFER_SIZE = 1000           -- 缓冲区大小（条数）
local FLUSH_INTERVAL = 5           -- 刷新间隔（秒）
local LOG_DIR = "/var/log/openresty/json"
local SHARED_DICT_NAME = "log_buffer"

-- 共享内存字典
local log_dict = ngx.shared[SHARED_DICT_NAME]

-- 获取当前日期（YYYYMMDD格式）
local function get_current_date()
    return os.date("%Y%m%d")
end

-- 获取日志文件路径
local function get_log_file_path(date)
    return string.format("%s/access-%s.json", LOG_DIR, date or get_current_date())
end

-- 添加日志到缓冲区
function _M.add(json_str)
    if not log_dict then
        return false, "Shared dict not found"
    end
    
    -- 获取当前缓冲区大小
    local count = log_dict:get("count") or 0
    
    -- 存储日志条目
    local key = string.format("log_%d", count)
    local ok, err = log_dict:set(key, json_str, 60)  -- 60秒过期时间
    if not ok then
        return false, "Failed to set log: " .. (err or "unknown")
    end
    
    -- 更新计数
    log_dict:incr("count", 1, 0)
    
    -- 如果缓冲区满了，触发刷新
    if count >= BUFFER_SIZE then
        _M.flush()
    end
    
    return true
end

-- 刷新缓冲区到文件
function _M.flush()
    if not log_dict then
        return false, "Shared dict not found"
    end
    
    -- 获取当前缓冲区大小
    local count = log_dict:get("count") or 0
    if count == 0 then
        return true  -- 没有日志需要刷新
    end
    
    -- 使用pcall保护文件操作
    local ok, err = pcall(function()
        -- 获取日志文件路径
        local log_file = get_log_file_path()
        
        -- 打开文件（追加模式）
        local file, open_err = io.open(log_file, "a")
        if not file then
            ngx.log(ngx.ERR, "[LogBuffer] Failed to open log file: ", open_err)
            return
        end
        
        -- 写入所有缓冲的日志
        local write_count = 0
        for i = 0, count - 1 do
            local key = string.format("log_%d", i)
            local json_str = log_dict:get(key)
            if json_str then
                file:write(json_str, "\n")
                log_dict:delete(key)
                write_count = write_count + 1
            end
        end
        
        -- 关闭文件
        file:close()
        
        -- 重置计数
        log_dict:set("count", 0)
        
        ngx.log(ngx.INFO, "[LogBuffer] Flushed ", write_count, " logs to ", log_file)
    end)
    
    if not ok then
        ngx.log(ngx.ERR, "[LogBuffer] Flush failed: ", err)
        return false, err
    end
    
    return true
end

-- 定时刷新任务
local function flush_timer(premature)
    if premature then
        return
    end
    
    -- 执行刷新
    _M.flush()
    
    -- 重新设置定时器
    local ok, err = ngx.timer.at(FLUSH_INTERVAL, flush_timer)
    if not ok then
        ngx.log(ngx.ERR, "[LogBuffer] Failed to create timer: ", err)
    end
end

-- 启动定时刷新
function _M.start_flush_timer()
    local ok, err = ngx.timer.at(FLUSH_INTERVAL, flush_timer)
    if not ok then
        ngx.log(ngx.ERR, "[LogBuffer] Failed to start flush timer: ", err)
        return false
    end
    ngx.log(ngx.INFO, "[LogBuffer] Flush timer started, interval: ", FLUSH_INTERVAL, "s")
    return true
end

-- 清理旧日志文件（保留指定天数）
function _M.cleanup_old_logs(keep_days)
    keep_days = keep_days or 180
    
    local ok, err = pcall(function()
        local cmd = string.format(
            "find %s -name 'access-*.json' -type f -mtime +%d -delete",
            LOG_DIR,
            keep_days
        )
        os.execute(cmd)
        ngx.log(ngx.INFO, "[LogBuffer] Cleaned up logs older than ", keep_days, " days")
    end)
    
    if not ok then
        ngx.log(ngx.ERR, "[LogBuffer] Cleanup failed: ", err)
    end
end

-- 初始化（创建日志目录）
function _M.init()
    -- 创建日志目录
    os.execute("mkdir -p " .. LOG_DIR)
    ngx.log(ngx.INFO, "[LogBuffer] Log directory: ", LOG_DIR)
    
    -- 初始化共享字典
    if log_dict then
        log_dict:set("count", 0)
        ngx.log(ngx.INFO, "[LogBuffer] Initialized")
    else
        ngx.log(ngx.ERR, "[LogBuffer] Shared dict '", SHARED_DICT_NAME, "' not found")
    end
end

return _M

