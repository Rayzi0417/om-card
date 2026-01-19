// 简单的内存速率限制器
// 生产环境建议使用 Redis 或 Upstash

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// 内存存储 (服务重启会清空)
const rateLimitStore = new Map<string, RateLimitRecord>();

// 定期清理过期记录 (每5分钟)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitConfig {
  maxRequests: number;  // 最大请求数
  windowMs: number;     // 时间窗口 (毫秒)
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;  // 需要等待的秒数
}

/**
 * 检查并更新速率限制
 * @param identifier 标识符 (如 IP 地址)
 * @param config 限制配置
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();
  
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  // 如果没有记录或已过期，创建新记录
  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(identifier, newRecord);
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime
    };
  }
  
  // 检查是否超出限制
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter
    };
  }
  
  // 增加计数
  record.count += 1;
  rateLimitStore.set(identifier, record);
  
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  };
}

/**
 * 生图 API 的默认限制配置
 * 每分钟 5 次
 */
export const DRAW_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 分钟
};

/**
 * 对话 API 的默认限制配置
 * 每分钟 20 次
 */
export const CHAT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000
};

/**
 * 从请求中获取客户端 IP
 */
export function getClientIP(request: Request): string {
  // 优先使用代理头
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // 本地开发回退
  return '127.0.0.1';
}
