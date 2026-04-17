// 内存存储，替代 Redis
const logger = require('../utils/logger');

class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  async set(key, value, ttl = null) {
    const data = {
      value: String(value),
      expireAt: ttl ? Date.now() + ttl * 1000 : null
    };
    this.store.set(key, data);
    return 'OK';
  }

  async setex(key, seconds, value) {
    return this.set(key, value, seconds);
  }

  async get(key) {
    const data = this.store.get(key);
    if (!data) return null;
    
    if (data.expireAt && data.expireAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return data.value;
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key) {
    let value = await this.get(key);
    value = value ? parseInt(value) + 1 : 1;
    await this.set(key, value);
    return value;
  }

  async expire(key, seconds) {
    const data = this.store.get(key);
    if (data) {
      data.expireAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    const data = this.store.get(key);
    if (!data || !data.expireAt) return -1;
    const remaining = Math.floor((data.expireAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async ping() {
    return 'PONG';
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.expireAt && data.expireAt < now) {
        this.store.delete(key);
      }
    }
  }
}

const memoryStore = new MemoryStore();

setInterval(() => {
  memoryStore.cleanup();
}, 60000);

logger.info('✅ 使用内存存储（无需 Redis）');

module.exports = memoryStore;