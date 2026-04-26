const redisClient = require('../config/redis');

exports.get = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Redis GET failed:', err.message);
    return null; // Graceful degradation
  }
};

exports.set = async (key, value, ttlSeconds) => {
  try {
    // Cap TTL to 300 seconds (5 min) as requested
    const finalTtl = Math.min(ttlSeconds, 300);
    await redisClient.setex(key, finalTtl, JSON.stringify(value));
  } catch (err) {
    console.warn('Redis SET failed:', err.message);
  }
};

exports.del = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn('Redis DEL failed:', err.message);
  }
};

exports.delPattern = async (pattern) => {
  try {
    let cursor = '0';
    do {
      const [newCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = newCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.warn('Redis DELPATTERN failed:', err.message);
  }
};
