/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { BaseRedisStorage } from './redis-base.db';

export class RedisStorage extends BaseRedisStorage {
  constructor() {
    // 获取原始 REDIS_URL
    const rawUrl = process.env.REDIS_URL!;
    
    // 对 URL 进行编码处理
    const encodedUrl = this.encodeRedisUrl(rawUrl);
    
    const config = {
      url: encodedUrl,
      clientName: 'Redis'
    };
    const globalSymbol = Symbol.for('__MOONTV_REDIS_CLIENT__');
    super(config, globalSymbol);
  }

  private encodeRedisUrl(url: string): string {
    // 使用更基础的方法处理 URL 编码
    try {
      // 分离协议部分
      const protocolEnd = url.indexOf('://');
      if (protocolEnd === -1) {
        return url; // 不是标准 URL 格式，直接返回
      }
      
      const protocol = url.substring(0, protocolEnd + 3);
      const rest = url.substring(protocolEnd + 3);
      
      // 查找认证信息部分
      const atIndex = rest.indexOf('@');
      if (atIndex === -1) {
        return url; // 没有认证信息，直接返回
      }
      
      const authPart = rest.substring(0, atIndex);
      const hostPart = rest.substring(atIndex + 1);
      
      // 分离用户名和密码
      const colonIndex = authPart.indexOf(':');
      if (colonIndex === -1) {
        return url; // 没有密码部分，直接返回
      }
      
      const username = authPart.substring(0, colonIndex);
      const password = authPart.substring(colonIndex + 1);
      
      // 编码用户名和密码
      const encodedUsername = encodeURIComponent(username);
      const encodedPassword = encodeURIComponent(password);
      
      // 重新组合 URL
      return `${protocol}${encodedUsername}:${encodedPassword}@${hostPart}`;
    } catch (error) {
      console.error('Error encoding Redis URL:', error);
      return url; // 如果处理失败，返回原始 URL
    }
  }
}
