const crypto = require('crypto')
const RedisMock = require('./src/redis')

let redis = new RedisMock()
let PREFIX = 'khc:'
let EXPIRES = 0

setImmediate(() => {
  if (redis instanceof RedisMock) {
    console.warn('WARN: no real redis instance was specified for koa-cache')
  }
})

/**
 * Global configuration
 * @param {Object} options
 * @param {Object} options.redis redis client (with promises support)
 * @param {String} [options.prefix='khc:'] prefix that will be added to cache keys
 * @param {Number} [options.expires=0] cache expiration time in seconds
 */
exports.configure = options => {
  if ('redis' in options) {
    redis = options.redis
  }
  if ('prefix' in options) {
    PREFIX = options.prefix
  }
  if ('expires' in options) {
    EXPIRES = options.expires
  }
}

exports.createMiddleware = id => {
  const middleware = async (ctx, next) => {
    const key = PREFIX + ':' + id(ctx)

    if (ctx.method !== 'GET') {
      await next()
      return redis.del(key)
    }

    const etag = ctx.get('If-None-Match')
    const hash = await redis.hget(key, 'hash')

    if (!hash) {
      await next()
      return cacheResponse(ctx, key)
    }

    if (!etag || etag !== hash) {
      ctx.body = await redis.hget(key, 'cache')
      ctx.type = 'application/json; charset=utf-8'
      ctx.set('ETag', hash)
      ctx.set('Cache-Control', 'private, no-cache')
      return
    }

    ctx.status = 304
  }

  return middleware
}

async function cacheResponse (ctx, key) {
  const result = JSON.stringify(ctx.body)
  const etag = await setCache(key, result)

  ctx.set('ETag', etag)
  ctx.set('Cache-Control', 'private, no-cache')
}

async function setCache (key, cache) {
  const hash = crypto
    .createHash('md5')
    .update(cache)
    .digest('hex')

  await redis.hmset(key, 'cache', cache, 'hash', hash)

  if (EXPIRES) {
    await redis.expire(key, EXPIRES)
  }

  return hash
}
