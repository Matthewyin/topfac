-- logger.lua
-- OpenResty JSON日志模块
-- 负责收集请求信息并构造JSON格式日志

local cjson = require "cjson.safe"
local log_buffer = require "custom.log_buffer"

local _M = {}

-- 安全获取变量值，如果为空返回默认值
local function safe_get(var, default)
    if var == nil or var == "" or var == ngx.null then
        return default or "-"
    end
    return var
end

-- 安全转换为数字
local function safe_number(var, default)
    local num = tonumber(var)
    if num == nil then
        return default or 0
    end
    return num
end

-- 安全处理字符串（不使用正则表达式）
local function safe_string(str)
    if str == nil or str == "" or str == "-" then
        return str
    end
    -- 简单返回，让cjson库处理转义
    return str
end

-- 生成请求唯一ID
local function generate_request_id()
    return ngx.var.request_id or string.format("%s-%s-%s", 
        ngx.var.connection,
        ngx.var.connection_requests,
        ngx.now()
    )
end

-- 收集所有日志字段
function _M.collect_log_data()
    local log_data = {
        -- 基础请求信息
        timestamp = ngx.var.time_iso8601,
        log_time = ngx.now(),
        request_id = generate_request_id(),
        remote_addr = safe_get(ngx.var.remote_addr),
        remote_port = safe_number(ngx.var.remote_port),
        remote_user = safe_get(ngx.var.remote_user),
        request_method = safe_get(ngx.var.request_method),
        request_uri = safe_get(ngx.var.request_uri),
        uri = safe_get(ngx.var.uri),
        args = safe_get(ngx.var.args),
        server_protocol = safe_get(ngx.var.server_protocol),
        
        -- 服务器信息
        scheme = safe_get(ngx.var.scheme),
        host = safe_get(ngx.var.host),
        server_name = safe_get(ngx.var.server_name),
        server_addr = safe_get(ngx.var.server_addr),
        server_port = safe_number(ngx.var.server_port),
        hostname = safe_get(ngx.var.hostname),
        
        -- 响应信息
        status = safe_number(ngx.var.status),
        body_bytes_sent = safe_number(ngx.var.body_bytes_sent),
        bytes_sent = safe_number(ngx.var.bytes_sent),
        request_length = safe_number(ngx.var.request_length),
        content_type = safe_get(ngx.var.sent_http_content_type),
        
        -- 性能指标
        request_time = safe_number(ngx.var.request_time, 0),
        upstream_response_time = safe_get(ngx.var.upstream_response_time),
        upstream_connect_time = safe_get(ngx.var.upstream_connect_time),
        upstream_header_time = safe_get(ngx.var.upstream_header_time),
        
        -- 后端服务信息
        upstream_addr = safe_get(ngx.var.upstream_addr),
        upstream_status = safe_get(ngx.var.upstream_status),
        upstream_cache_status = safe_get(ngx.var.upstream_cache_status),
        
        -- SSL/TLS信息
        ssl_protocol = safe_get(ngx.var.ssl_protocol),
        ssl_cipher = safe_get(ngx.var.ssl_cipher),
        ssl_session_id = safe_get(ngx.var.ssl_session_id),
        ssl_session_reused = safe_get(ngx.var.ssl_session_reused),
        
        -- HTTP头信息
        http_referer = safe_string(safe_get(ngx.var.http_referer)),
        http_user_agent = safe_string(safe_get(ngx.var.http_user_agent)),
        http_x_forwarded_for = safe_get(ngx.var.http_x_forwarded_for),
        http_accept_language = safe_get(ngx.var.http_accept_language),
        http_accept_encoding = safe_get(ngx.var.http_accept_encoding),
        http_accept = safe_get(ngx.var.http_accept),
        
        -- 连接信息
        connection = safe_number(ngx.var.connection),
        connection_requests = safe_number(ngx.var.connection_requests),
        pipe = safe_get(ngx.var.pipe),
    }
    
    return log_data
end

-- 记录日志（主入口函数）
function _M.log()
    -- 使用pcall保护，避免日志错误影响请求处理
    local ok, err = pcall(function()
        -- 收集日志数据
        local log_data = _M.collect_log_data()
        
        -- 转换为JSON
        local json_str, encode_err = cjson.encode(log_data)
        if not json_str then
            ngx.log(ngx.ERR, "[Logger] JSON encode failed: ", encode_err)
            return
        end
        
        -- 写入缓冲区
        local buffer_ok, buffer_err = log_buffer.add(json_str)
        if not buffer_ok then
            ngx.log(ngx.ERR, "[Logger] Buffer add failed: ", buffer_err)
        end
    end)
    
    if not ok then
        ngx.log(ngx.ERR, "[Logger] Log failed: ", err)
    end
end

return _M

