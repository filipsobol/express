import { describe, beforeEach, it } from 'vitest';
import assert from 'assert'
import asyncHooks from 'async_hooks';
import { Buffer } from 'safe-buffer';
import request from 'supertest';
import express, { raw } from '../src/express.js';

var describeAsyncHooks = typeof asyncHooks.AsyncLocalStorage === 'function'
  ? describe
  : describe.skip

describe('express.raw()', () => {
  beforeEach(() => {
    this.app = createApp()
  })

  it('should parse application/octet-stream', () => new Promise(done => {
    request(this.app)
      .post('/')
      .set('Content-Type', 'application/octet-stream')
      .send('the user is tobi')
      .expect(200, { buf: '746865207573657220697320746f6269' }, done)
  }));

  it('should 400 when invalid content-length', () => new Promise(done => {
    var app = express()

    app.use((req, res, next) => {
      req.headers['content-length'] = '20' // bad length
      next()
    })

    app.use(raw())

    app.post('/', (req, res) => {
      if (Buffer.isBuffer(req.body)) {
        res.json({ buf: req.body.toString('hex') })
      } else {
        res.json(req.body)
      }
    })

    request(app)
      .post('/')
      .set('Content-Type', 'application/octet-stream')
      .send('stuff')
      .expect(400, /content length/, done)
  } ) );

  it('should handle Content-Length: 0', () => new Promise(done => {
    request(this.app)
      .post('/')
      .set('Content-Type', 'application/octet-stream')
      .set('Content-Length', '0')
      .expect(200, { buf: '' }, done)
  } ) );

  it('should handle empty message-body', () => new Promise(done => {
    request(this.app)
      .post('/')
      .set('Content-Type', 'application/octet-stream')
      .set('Transfer-Encoding', 'chunked')
      .send('')
      .expect(200, { buf: '' }, done)
  } ) );

  it('should 500 if stream not readable', () => new Promise(done => {
    var app = express()

    app.use((req, res, next) => {
      req.on('end', next)
      req.resume()
    })

    app.use(raw())

    app.use((err, req, res, next) => {
      res.status(err.status || 500)
      res.send('[' + err.type + '] ' + err.message)
    })

    app.post('/', (req, res) => {
      if (Buffer.isBuffer(req.body)) {
        res.json({ buf: req.body.toString('hex') })
      } else {
        res.json(req.body)
      }
    })

    request(app)
      .post('/')
      .set('Content-Type', 'application/octet-stream')
      .send('the user is tobi')
      .expect(500, '[stream.not.readable] stream is not readable', done)
  } ) );

  it('should handle duplicated middleware', () => new Promise(done => {
    var app = express()

    app.use(raw())
    app.use(raw())

    app.post('/', (req, res) => {
      if (Buffer.isBuffer(req.body)) {
        res.json({ buf: req.body.toString('hex') })
      } else {
        res.json(req.body)
      }
    })

    request(app)
      .post('/')
      .set('Content-Type', 'application/octet-stream')
      .send('the user is tobi')
      .expect(200, { buf: '746865207573657220697320746f6269' }, done)
  } ) );

  describe('with limit option', () => {
    it('should 413 when over limit with Content-Length', () => new Promise(done => {
      var buf = Buffer.alloc(1028, '.')
      var app = createApp({ limit: '1kb' })
      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.set('Content-Length', '1028')
      test.write(buf)
      test.expect(413, done)
    } ) );

    it('should 413 when over limit with chunked encoding', () => new Promise(done => {
      var buf = Buffer.alloc(1028, '.')
      var app = createApp({ limit: '1kb' })
      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.set('Transfer-Encoding', 'chunked')
      test.write(buf)
      test.expect(413, done)
    } ) );

    it('should 413 when inflated body over limit', () => new Promise(done => {
      var app = createApp({ limit: '1kb' })
      var test = request(app).post('/')
      test.set('Content-Encoding', 'gzip')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('1f8b080000000000000ad3d31b05a360148c64000087e5a14704040000', 'hex'))
      test.expect(413, done)
    } ) );

    it('should accept number of bytes', () => new Promise(done => {
      var buf = Buffer.alloc(1028, '.')
      var app = createApp({ limit: 1024 })
      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.write(buf)
      test.expect(413, done)
    } ) );

    it('should not change when options altered', () => new Promise(done => {
      var buf = Buffer.alloc(1028, '.')
      var options = { limit: '1kb' }
      var app = createApp(options)

      options.limit = '100kb'

      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.write(buf)
      test.expect(413, done)
    } ) );

    it('should not hang response', () => new Promise(done => {
      var buf = Buffer.alloc(10240, '.')
      var app = createApp({ limit: '8kb' })
      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.write(buf)
      test.write(buf)
      test.write(buf)
      test.expect(413, done)
    } ) );

    it('should not error when inflating', () => new Promise(done => {
      var app = createApp({ limit: '1kb' })
      var test = request(app).post('/')
      test.set('Content-Encoding', 'gzip')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('1f8b080000000000000ad3d31b05a360148c64000087e5a147040400', 'hex'))
      test.expect(413, done)
    } ) );
  })

  describe('with inflate option', () => {
    describe('when false', () => {
      beforeEach(() => {
        this.app = createApp({ inflate: false })
      })

      it('should not accept content-encoding', () => new Promise(done => {
        var test = request(this.app).post('/')
        test.set('Content-Encoding', 'gzip')
        test.set('Content-Type', 'application/octet-stream')
        test.write(Buffer.from('1f8b080000000000000bcb4bcc4db57db16e170099a4bad608000000', 'hex'))
        test.expect(415, '[encoding.unsupported] content encoding unsupported', done)
      } ) );
    })

    describe('when true', () => {
      beforeEach(() => {
        this.app = createApp({ inflate: true })
      })

      it('should accept content-encoding', () => new Promise(done => {
        var test = request(this.app).post('/')
        test.set('Content-Encoding', 'gzip')
        test.set('Content-Type', 'application/octet-stream')
        test.write(Buffer.from('1f8b080000000000000bcb4bcc4db57db16e170099a4bad608000000', 'hex'))
        test.expect(200, { buf: '6e616d653de8aeba' }, done)
      } ) );
    })
  })

  describe('with type option', () => {
    describe('when "application/vnd+octets"', () => {
      beforeEach(() => {
        this.app = createApp({ type: 'application/vnd+octets' })
      })

      it('should parse for custom type', () => new Promise(done => {
        var test = request(this.app).post('/')
        test.set('Content-Type', 'application/vnd+octets')
        test.write(Buffer.from('000102', 'hex'))
        test.expect(200, { buf: '000102' }, done)
      } ) );

      it('should ignore standard type', () => new Promise(done => {
        var test = request(this.app).post('/')
        test.set('Content-Type', 'application/octet-stream')
        test.write(Buffer.from('000102', 'hex'))
        test.expect(200, '{}', done)
      } ) );
    })

    describe('when ["application/octet-stream", "application/vnd+octets"]', () => {
      beforeEach(() => {
        this.app = createApp({
          type: ['application/octet-stream', 'application/vnd+octets']
        })
      })

      it('should parse "application/octet-stream"', () => new Promise(done => {
        var test = request(this.app).post('/')
        test.set('Content-Type', 'application/octet-stream')
        test.write(Buffer.from('000102', 'hex'))
        test.expect(200, { buf: '000102' }, done)
      } ) );

      it('should parse "application/vnd+octets"', () => new Promise(done => {
        var test = request(this.app).post('/')
        test.set('Content-Type', 'application/vnd+octets')
        test.write(Buffer.from('000102', 'hex'))
        test.expect(200, { buf: '000102' }, done)
      } ) );

      it('should ignore "application/x-foo"', () => new Promise(done => {
        var test = request(this.app).post('/')
        test.set('Content-Type', 'application/x-foo')
        test.write(Buffer.from('000102', 'hex'))
        test.expect(200, '{}', done)
      } ) );
    })

    describe('when a function', () => {
      it('should parse when truthy value returned', () => new Promise(done => {
        var app = createApp({ type: accept })

        function accept (req) {
          return req.headers['content-type'] === 'application/vnd.octet'
        }

        var test = request(app).post('/')
        test.set('Content-Type', 'application/vnd.octet')
        test.write(Buffer.from('000102', 'hex'))
        test.expect(200, { buf: '000102' }, done)
      } ) );

      it('should work without content-type', () => new Promise(done => {
        var app = createApp({ type: accept })

        function accept (req) {
          return true
        }

        var test = request(app).post('/')
        test.write(Buffer.from('000102', 'hex'))
        test.expect(200, { buf: '000102' }, done)
      } ) );

      it('should not invoke without a body', () => new Promise(done => {
        var app = createApp({ type: accept })

        function accept (req) {
          throw new Error('oops!')
        }

        request(app)
          .get('/')
          .expect(404, done)
      } ) );
    })
  })

  describe('with verify option', () => {
    it('should assert value is function', () => {
      assert.throws(createApp.bind(null, { verify: 'lol' }),
        /TypeError: option verify must be function/)
    })

    it('should error from verify', () => new Promise(done => {
      var app = createApp({
        verify: (req, res, buf) => {
          if (buf[0] === 0x00) throw new Error('no leading null')
        }
      })

      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('000102', 'hex'))
      test.expect(403, '[entity.verify.failed] no leading null', done)
    } ) );

    it('should allow custom codes', () => new Promise(done => {
      var app = createApp({
        verify: (req, res, buf) => {
          if (buf[0] !== 0x00) return
          var err = new Error('no leading null')
          err.status = 400
          throw err
        }
      })

      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('000102', 'hex'))
      test.expect(400, '[entity.verify.failed] no leading null', done)
    } ) );

    it('should allow pass-through', () => new Promise(done => {
      var app = createApp({
        verify: (req, res, buf) => {
          if (buf[0] === 0x00) throw new Error('no leading null')
        }
      })

      var test = request(app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('0102', 'hex'))
      test.expect(200, { buf: '0102' }, done)
    } ) );
  })

  describeAsyncHooks('async local storage', () => {
    beforeEach(() => {
      var app = express()
      var store = { foo: 'bar' }

      app.use((req, res, next) => {
        req.asyncLocalStorage = new asyncHooks.AsyncLocalStorage()
        req.asyncLocalStorage.run(store, next)
      })

      app.use(raw())

      app.use((req, res, next) => {
        var local = req.asyncLocalStorage.getStore()

        if (local) {
          res.setHeader('x-store-foo', String(local.foo))
        }

        next()
      })

      app.use((err, req, res, next) => {
        var local = req.asyncLocalStorage.getStore()

        if (local) {
          res.setHeader('x-store-foo', String(local.foo))
        }

        res.status(err.status || 500)
        res.send('[' + err.type + '] ' + err.message)
      })

      app.post('/', (req, res) => {
        if (Buffer.isBuffer(req.body)) {
          res.json({ buf: req.body.toString('hex') })
        } else {
          res.json(req.body)
        }
      })

      this.app = app
    })

    it('should presist store', () => new Promise(done => {
      request(this.app)
        .post('/')
        .set('Content-Type', 'application/octet-stream')
        .send('the user is tobi')
        .expect(200)
        .expect('x-store-foo', 'bar')
        .expect({ buf: '746865207573657220697320746f6269' })
        .end(done)
    } ) );

    it('should presist store when unmatched content-type', () => new Promise(done => {
      request(this.app)
        .post('/')
        .set('Content-Type', 'application/fizzbuzz')
        .send('buzz')
        .expect(200)
        .expect('x-store-foo', 'bar')
        .expect('{}')
        .end(done)
    } ) );

    it('should presist store when inflated', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Encoding', 'gzip')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('1f8b080000000000000bcb4bcc4db57db16e170099a4bad608000000', 'hex'))
      test.expect(200)
      test.expect('x-store-foo', 'bar')
      test.expect({ buf: '6e616d653de8aeba' })
      test.end(done)
    } ) );

    it('should presist store when inflate error', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Encoding', 'gzip')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('1f8b080000000000000bcb4bcc4db57db16e170099a4bad6080000', 'hex'))
      test.expect(400)
      test.expect('x-store-foo', 'bar')
      test.end(done)
    } ) );

    it('should presist store when limit exceeded', () => new Promise(done => {
      request(this.app)
        .post('/')
        .set('Content-Type', 'application/octet-stream')
        .send('the user is ' + Buffer.alloc(1024 * 100, '.').toString())
        .expect(413)
        .expect('x-store-foo', 'bar')
        .end(done)
    } ) );
  })

  describe('charset', () => {
    beforeEach(() => {
      this.app = createApp()
    })

    it('should ignore charset', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Type', 'application/octet-stream; charset=utf-8')
      test.write(Buffer.from('6e616d6520697320e8aeba', 'hex'))
      test.expect(200, { buf: '6e616d6520697320e8aeba' }, done)
    } ) );
  })

  describe('encoding', () => {
    beforeEach(() => {
      this.app = createApp({ limit: '10kb' })
    })

    it('should parse without encoding', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('6e616d653de8aeba', 'hex'))
      test.expect(200, { buf: '6e616d653de8aeba' }, done)
    } ) );

    it('should support identity encoding', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Encoding', 'identity')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('6e616d653de8aeba', 'hex'))
      test.expect(200, { buf: '6e616d653de8aeba' }, done)
    } ) );

    it('should support gzip encoding', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Encoding', 'gzip')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('1f8b080000000000000bcb4bcc4db57db16e170099a4bad608000000', 'hex'))
      test.expect(200, { buf: '6e616d653de8aeba' }, done)
    } ) );

    it('should support deflate encoding', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Encoding', 'deflate')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('789ccb4bcc4db57db16e17001068042f', 'hex'))
      test.expect(200, { buf: '6e616d653de8aeba' }, done)
    } ) );

    it('should be case-insensitive', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Encoding', 'GZIP')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('1f8b080000000000000bcb4bcc4db57db16e170099a4bad608000000', 'hex'))
      test.expect(200, { buf: '6e616d653de8aeba' }, done)
    } ) );

    it('should 415 on unknown encoding', () => new Promise(done => {
      var test = request(this.app).post('/')
      test.set('Content-Encoding', 'nulls')
      test.set('Content-Type', 'application/octet-stream')
      test.write(Buffer.from('000000000000', 'hex'))
      test.expect(415, '[encoding.unsupported] unsupported content encoding "nulls"', done)
    } ) );
  })
})

function createApp (options) {
  var app = express()

  app.use(raw(options))

  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.send(String(req.headers['x-error-property']
      ? err[req.headers['x-error-property']]
      : ('[' + err.type + '] ' + err.message)))
  })

  app.post('/', (req, res) => {
    if (Buffer.isBuffer(req.body)) {
      res.json({ buf: req.body.toString('hex') })
    } else {
      res.json(req.body)
    }
  })

  return app
}
