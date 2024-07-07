import { describe, it } from 'vitest';
import after from 'after';
import assert from 'assert'
import request from 'supertest';
import express from '../index.cjs';

describe('app', () => {
  it('should emit "mount" when mounted', () => new Promise(done => {
    var blog = express()
      , app = express();

    blog.on('mount', (arg) => {
      assert.strictEqual(arg, app)
      done();
    });

    app.use(blog);
  }) );

  describe('.use(app)', () => {
    it('should mount the app', () => new Promise(done => {
      var blog = express()
        , app = express();

      blog.get('/blog', (req, res) => {
        res.end('blog');
      });

      app.use(blog);

      request(app)
      .get('/blog')
      .expect('blog', done);
    }) );

    it('should support mount-points', () => new Promise(done => {
      var blog = express()
        , forum = express()
        , app = express();
      var cb = after(2, done)

      blog.get('/', (req, res) => {
        res.end('blog');
      });

      forum.get('/', (req, res) => {
        res.end('forum');
      });

      app.use('/blog', blog);
      app.use('/forum', forum);

      request(app)
        .get('/blog')
        .expect(200, 'blog', cb)

      request(app)
        .get('/forum')
        .expect(200, 'forum', cb)
    } ) );

    it('should set the child\'s .parent', () => {
      var blog = express()
        , app = express();

      app.use('/blog', blog);
      assert.strictEqual(blog.parent, app)
    } );

    it('should support dynamic routes', () => new Promise(done => {
      var blog = express()
        , app = express();

      blog.get('/', (req, res) => {
        res.end('success');
      });

      app.use('/post/:article', blog);

      request(app)
      .get('/post/once-upon-a-time')
      .expect('success', done);
    } ) );

    it('should support mounted app anywhere', () => new Promise(done => {
      var cb = after(3, done);
      var blog = express()
        , other = express()
        , app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      blog.get('/', (req, res) => {
        res.end('success');
      });

      blog.once('mount', (parent) => {
        assert.strictEqual(parent, app)
        cb();
      });
      other.once('mount', (parent) => {
        assert.strictEqual(parent, app)
        cb();
      });

      app.use('/post/:article', fn1, other, fn2, blog);

      request(app)
      .get('/post/once-upon-a-time')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('success', cb);
    } ) );
  })

  describe('.use(middleware)', () => {
    it('should accept multiple arguments', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      app.use(fn1, fn2, function fn3(req, res) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      });

      request(app)
      .get('/')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );

    it('should invoke middleware for all requests', () => new Promise(done => {
      var app = express();
      var cb = after(3, done);

      app.use((req, res) => {
        res.send('saw ' + req.method + ' ' + req.url);
      });

      request(app)
      .get('/')
      .expect(200, 'saw GET /', cb);

      request(app)
      .options('/')
      .expect(200, 'saw OPTIONS /', cb);

      request(app)
      .post('/foo')
      .expect(200, 'saw POST /foo', cb);
    } ) );

    it('should accept array of middleware', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      function fn3(req, res, next) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      }

      app.use([fn1, fn2, fn3]);

      request(app)
      .get('/')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );

    it('should accept multiple arrays of middleware', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      function fn3(req, res, next) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      }

      app.use([fn1, fn2], [fn3]);

      request(app)
      .get('/')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );

    it('should accept nested arrays of middleware', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      function fn3(req, res, next) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      }

      app.use([[fn1], fn2], [fn3]);

      request(app)
      .get('/')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );
  } )

  describe('.use(path, middleware)', () => {
    it('should require middleware', () => {
      var app = express()
      assert.throws(() => { app.use('/') }, /requires a middleware function/)
    })

    it('should reject string as middleware', () => {
      var app = express()
      assert.throws(() => { app.use('/', 'foo') }, /requires a middleware function but got a string/)
    })

    it('should reject number as middleware', () => {
      var app = express()
      assert.throws(() => { app.use('/', 42) }, /requires a middleware function but got a number/)
    })

    it('should reject null as middleware', () => {
      var app = express()
      assert.throws(() => { app.use('/', null) }, /requires a middleware function but got a Null/)
    })

    it('should reject Date as middleware', () => {
      var app = express()
      assert.throws(() => { app.use('/', new Date()) }, /requires a middleware function but got a Date/)
    })

    it('should strip path from req.url', () => new Promise(done => {
      var app = express();

      app.use('/foo', (req, res) => {
        res.send('saw ' + req.method + ' ' + req.url);
      });

      request(app)
      .get('/foo/bar')
      .expect(200, 'saw GET /bar', done);
    } ) );

    it('should accept multiple arguments', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      app.use('/foo', fn1, fn2, function fn3(req, res) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      });

      request(app)
      .get('/foo')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );

    it('should invoke middleware for all requests starting with path', () => new Promise(done => {
      var app = express();
      var cb = after(3, done);

      app.use('/foo', (req, res) => {
        res.send('saw ' + req.method + ' ' + req.url);
      });

      request(app)
      .get('/')
      .expect(404, cb);

      request(app)
      .post('/foo')
      .expect(200, 'saw POST /', cb);

      request(app)
      .post('/foo/bar')
      .expect(200, 'saw POST /bar', cb);
    } ) );

    it('should work if path has trailing slash', () => new Promise(done => {
      var app = express();
      var cb = after(3, done);

      app.use('/foo/', (req, res) => {
        res.send('saw ' + req.method + ' ' + req.url);
      });

      request(app)
      .get('/')
      .expect(404, cb);

      request(app)
      .post('/foo')
      .expect(200, 'saw POST /', cb);

      request(app)
      .post('/foo/bar')
      .expect(200, 'saw POST /bar', cb);
    } ) );

    it('should accept array of middleware', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      function fn3(req, res, next) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      }

      app.use('/foo', [fn1, fn2, fn3]);

      request(app)
      .get('/foo')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );

    it('should accept multiple arrays of middleware', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      function fn3(req, res, next) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      }

      app.use('/foo', [fn1, fn2], [fn3]);

      request(app)
      .get('/foo')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );

    it('should accept nested arrays of middleware', () => new Promise(done => {
      var app = express();

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      function fn3(req, res, next) {
        res.setHeader('x-fn-3', 'hit');
        res.end();
      }

      app.use('/foo', [fn1, [fn2]], [fn3]);

      request(app)
      .get('/foo')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, done);
    } ) );

    it('should support array of paths', () => new Promise(done => {
      var app = express();
      var cb = after(3, done);

      app.use(['/foo/', '/bar'], (req, res) => {
        res.send('saw ' + req.method + ' ' + req.url + ' through ' + req.originalUrl);
      });

      request(app)
      .get('/')
      .expect(404, cb);

      request(app)
      .get('/foo')
      .expect(200, 'saw GET / through /foo', cb);

      request(app)
      .get('/bar')
      .expect(200, 'saw GET / through /bar', cb);
    } ) );

    it('should support array of paths with middleware array', () => new Promise(done => {
      var app = express();
      var cb = after(2, done);

      function fn1(req, res, next) {
        res.setHeader('x-fn-1', 'hit');
        next();
      }

      function fn2(req, res, next) {
        res.setHeader('x-fn-2', 'hit');
        next();
      }

      function fn3(req, res, next) {
        res.setHeader('x-fn-3', 'hit');
        res.send('saw ' + req.method + ' ' + req.url + ' through ' + req.originalUrl);
      }

      app.use(['/foo/', '/bar'], [[fn1], fn2], [fn3]);

      request(app)
      .get('/foo')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, 'saw GET / through /foo', cb);

      request(app)
      .get('/bar')
      .expect('x-fn-1', 'hit')
      .expect('x-fn-2', 'hit')
      .expect('x-fn-3', 'hit')
      .expect(200, 'saw GET / through /bar', cb);
    } ) );

    it('should support regexp path', () => new Promise(done => {
      var app = express();
      var cb = after(4, done);

      app.use(/^\/[a-z]oo/, (req, res) => {
        res.send('saw ' + req.method + ' ' + req.url + ' through ' + req.originalUrl);
      });

      request(app)
      .get('/')
      .expect(404, cb);

      request(app)
      .get('/foo')
      .expect(200, 'saw GET / through /foo', cb);

      request(app)
      .get('/zoo/bear')
      .expect(200, 'saw GET /bear through /zoo/bear', cb);

      request(app)
      .get('/get/zoo')
      .expect(404, cb);
    } ) );

    it('should support empty string path', () => new Promise(done => {
      var app = express();

      app.use('', (req, res) => {
        res.send('saw ' + req.method + ' ' + req.url + ' through ' + req.originalUrl);
      });

      request(app)
      .get('/')
      .expect(200, 'saw GET / through /', done);
    } ) );
  })
})
