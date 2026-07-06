const Redis = require('ioredis');

// Two separate connections: one for normal commands (publish, cache),
// one dedicated to subscribing. ioredis requires a connection used for
// .subscribe() to not also run regular commands.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const publisher = new Redis(redisUrl, { lazyConnect: false });
const subscriber = new Redis(redisUrl, { lazyConnect: false });

publisher.on('connect', () => console.log('[redis] publisher connected'));
publisher.on('error', (err) => console.error('[redis] publisher error:', err.message));

subscriber.on('connect', () => console.log('[redis] subscriber connected'));
subscriber.on('error', (err) => console.error('[redis] subscriber error:', err.message));

module.exports = { publisher, subscriber };
