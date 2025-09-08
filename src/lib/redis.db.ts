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
    try {
      const parsedUrl = new URL(url);
      
      // 对用户名和密码进行编码
      if (parsedUrl.username) {
        parsedUrl.username = encodeURIComponent(parsedUrl.username);
      }
      if (parsedUrl.password) {
        parsedUrl.password = encodeURIComponent(parsedUrl.password);
      }
      
      return parsedUrl.toString();
    } catch (error) {
      console.error('Error encoding Redis URL:', error);
      return url; // 如果解析失败，返回原始 URL
    }
  }
}
