/* global test, expect, beforeAll, afterAll */
const got = require('got')
const Koa = require('koa')
const Router = require('koa-router')
const BASE_URL = 'http://localhost:3000/'

const cache = require('../index')
const caching = cache.createMiddleware(ctx => ctx.query.key)

const app = new Koa()
let server = null

const router = new Router()
router.use(caching)

router.get('/', ctx => {
  ctx.body = { n: Math.random() }
})

router.post('/', ctx => {
  ctx.status = 201
})

app.use(router.routes())

beforeAll(done => {
  server = app.listen(3000, done)
})

afterAll(done => {
  server.close(done)
})

test('it caches response after first request', async () => {
  const url = `${BASE_URL}?key=1`

  const res = await got(url, { json: true })

  expect(res.statusCode).toEqual(200)
  expect(res.headers['etag']).toBeDefined()
  expect(typeof res.body.n).toEqual('number')
})

test('it sends cached response if If-None-Match header does not match', async () => {
  const url = `${BASE_URL}?key=2`

  const res = await got(url, { json: true })
  const n1 = res.body.n
  const etag1 = res.headers['etag']
  expect(res.statusCode).toEqual(200)
  expect(etag1).toBeTruthy()

  const res2 = await got(url, { json: true, headers: { 'if-none-match': '12345' } })
  const n2 = res2.body.n
  const etag2 = res2.headers['etag']
  expect(res2.statusCode).toEqual(200)
  expect(etag2).toBeTruthy()

  expect(n1).toEqual(n2)
  expect(etag1).toEqual(etag2)
})

test('it sends 304 if If-None-Match header matches hash', async () => {
  const url = `${BASE_URL}?key=3`

  const res = await got(url, { json: true })
  const etag = res.headers['etag']
  expect(res.statusCode).toEqual(200)
  expect(etag).toBeTruthy()

  const res2 = await got(url, { json: true, headers: { 'if-none-match': etag } })
  expect(res2.statusCode).toEqual(304)
  expect(res2.body).toEqual('')
})

test('it clears cache after POST request', async () => {
  const url = `${BASE_URL}?key=4`

  const res = await got(url, { json: true })
  const n = res.body.n
  const etag = res.headers['etag']
  expect(res.statusCode).toEqual(200)
  expect(etag).toBeTruthy()

  const res2 = await got(url, { method: 'POST' })
  expect(res2.statusCode).toEqual(201)

  const res3 = await got(url, { json: true, headers: { 'if-none-match': etag } })
  const n3 = res3.body.n
  const etag3 = res3.headers['etag']
  expect(res3.statusCode).toEqual(200)
  expect(etag).toBeTruthy()

  expect(n3).not.toEqual(n)
  expect(etag3).not.toEqual(etag)
})
