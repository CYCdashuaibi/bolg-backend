const HTTP_STATUS_CODES = {
    OK: 200, // 成功
    CREATED: 201, // 新资源创建成功
    NO_CONTENT: 204, // 资源删除成功
    BAD_REQUEST: 400, // 请求参数错误
    UNAUTHORIZED: 401, // 未授权
    FORBIDDEN: 403, // 拒绝访问
    NOT_FOUND: 404, // 资源未找到
    TOO_MANY_REQUESTS: 429, // 请求过于频繁
    INTERNAL_SERVER_ERROR: 500, // 服务器内部错误
    SERVICE_UNAVAILABLE: 503, // 服务不可用
    GATEWAY_TIMEOUT: 504, // 网关超时
  };
  
  module.exports = HTTP_STATUS_CODES;
  