# Koa HTTP cache

[![Build Status](https://travis-ci.org/danroshko/koa-http-cache.svg?branch=master)](https://travis-ci.org/danroshko/koa-http-cache)
[![npm version](https://badge.fury.io/js/%40danroshko%2Fkoa-cache.svg)](https://badge.fury.io/js/%40danroshko%2Fkoa-cache)

HTTP caching middleware for koa

- uses redis for storage
- no need to manually add or remove entries. GET requests are automatically cached and POST, PUT, PATCH, DELETE requests automatically invalidate associated cache key
- uses MD5 hash of the response and standard HTTP headers `ETag` and `If-None-Match`
- works only with JSON payloads

## Installation

```
npm i @danroshko/koa-cache
```

## Usage

_routes.js_

```js
const Router = require('koa-router');
const cache = require('koa-cache');

const caching = cache.createMiddleware(ctx => {
  // should return unique and stable cache key
  return ctx.state.user.id;
});

const router = new Router();
router.use(caching);

router.get('/', ctx => {
  // responses from this route will be cached
  ctx.body = { n: Math.random() };
});

router.post('/', ctx => {
  // requests to this route will invalidate cache
  ctx.status = 201;
});

module.exports = router;
```

_app.js_

```js
const Koa = require('koa');
const Redis = require('ioredis');
const cache = require('koa-cache');
const router = require('./routes');

const koa = new Koa();
const redis = new Redis();

cache.configure({ redis, expires: 24 * 60 * 60 });

koa.use(router.routes());
koa.listen(3000);
```
