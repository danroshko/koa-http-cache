const crypto = require('crypto')
let redis = require('./src/redis')

let PREFIX = 'khc:'
let EXPIRES = 0

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

exports.cache = (namespace, id) => {
  const middleware = async (ctx, next) => {
    const etag = ctx.get('If-None-Match')
    const key = PREFIX + ':' + namespace + ':' + id

    if (!etag) {
      await next()
      return cacheResponse(ctx, key)
    }

    const hash = await redis.hget(key, 'hash')
    if (!hash) {
      await next()
      return cacheResponse(ctx, key)
    }

    if (etag !== hash) {
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

exports.clear = function (namespace, id) {
  const middleware = async (ctx, next) => {
    await next()

    const key = PREFIX + ':' + namespace + ':' + id
    return redis.del(key)
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
