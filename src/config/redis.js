const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

let redisErrorLogged = false;

redisClient.on('connect', () => {
  redisErrorLogged = false;
  console.log('Redis client connected');
});

redisClient.on('error', (err) => {
  if (!redisErrorLogged) {
    console.error('Redis client error:', err.message);
    redisErrorLogged = true;
  }
});

module.exports = redisClient;
