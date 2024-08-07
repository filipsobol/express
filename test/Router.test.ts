import { describe, it } from 'vitest';
import after from 'after';
import methods from 'methods';
import assert from 'assert';
import { Router } from '../src/express.js'

describe('Router', () => {
  it('should return a function with router methods', () => {
    var router = new Router();
    assert(typeof router === 'function')

    assert(typeof router.get === 'function')
    assert(typeof router.handle === 'function')
    assert(typeof router.use === 'function')
  });

  it('should support .use of other routers', () => new Promise(done => {
    var router = new Router();
    var another = new Router();

    another.get('/bar', (req, res) => {
      res.end();
    });
    router.use('/foo', another);

    router.handle({ url: '/foo/bar', method: 'GET' }, { end: done });
  } ) );

  it('should support dynamic routes', () => new Promise(done => {
    var router = new Router();
    var another = new Router();

    another.get('/:bar', (req, res) => {
      assert.strictEqual(req.params.bar, 'route')
      res.end();
    });
    router.use('/:foo', another);

    router.handle({ url: '/test/route', method: 'GET' }, { end: done });
  } ) );

  it('should handle blank URL', () => new Promise(done => {
    var router = new Router();

    router.use((req, res) => {
      throw new Error('should not be called')
    });

    router.handle({ url: '', method: 'GET' }, {}, done);
  } ) );

  it('should handle missing URL', () => new Promise(done => {
    var router = new Router()

    router.use((req, res) => {
      throw new Error('should not be called')
    })

    router.handle({ method: 'GET' }, {}, done)
  } ) );

  it('handle missing method', () => new Promise(done => {
    var all = false
    var router = new Router()
    var route = router.route('/foo')
    var use = false

    route.post((req, res, next) => { next(new Error('should not run')) })
    route.all((req, res, next) => {
      all = true
      next()
    })
    route.get((req, res, next) => { next(new Error('should not run')) })

    router.get('/foo', (req, res, next) => { next(new Error('should not run')) })
    router.use((req, res, next) => {
      use = true
      next()
    })

    router.handle({ url: '/foo' }, {}, (err) => {
      if (err) return done(err)
      assert.ok(all)
      assert.ok(use)
      done()
    })
  } ) );

  it('should not stack overflow with many registered routes', () => new Promise(done => {
    var handler = (req, res) => { res.end(new Error('wrong handler')) };
    var router = new Router();

    for (var i = 0; i < 6000; i++) {
      router.get('/thing' + i, handler)
    }

    router.get('/', (req, res) => {
      res.end();
    });

    router.handle({ url: '/', method: 'GET' }, { end: done });
  } ) );

  it('should not stack overflow with a large sync route stack', () => new Promise(done => {
    var router = new Router()

    router.get('/foo', (req, res, next) => {
      req.counter = 0
      next()
    })

    for (var i = 0; i < 6000; i++) {
      router.get('/foo', (req, res, next) => {
        req.counter++
        next()
      })
    }

    router.get('/foo', (req, res) => {
      assert.strictEqual(req.counter, 6000)
      res.end()
    })

    router.handle({ url: '/foo', method: 'GET' }, { end: done })
  } ) );

  it('should not stack overflow with a large sync middleware stack', () => new Promise(done => {
    var router = new Router()

    router.use((req, res, next) => {
      req.counter = 0
      next()
    })

    for (var i = 0; i < 6000; i++) {
      router.use((req, res, next) => {
        req.counter++
        next()
      })
    }

    router.use((req, res) => {
      assert.strictEqual(req.counter, 6000)
      res.end()
    })

    router.handle({ url: '/', method: 'GET' }, { end: done })
  } ) );

  describe('.handle', () => {
    it('should dispatch', () => new Promise(done => {
      var router = new Router();

      router.route('/foo').get((req, res) => {
        res.send('foo');
      });

      var res = {
        send: (val) => {
          assert.strictEqual(val, 'foo')
          done();
        }
      }
      router.handle({ url: '/foo', method: 'GET' }, res);
    } ) );
  })

  describe('.multiple callbacks', () => {
    it('should throw if a callback is null', () => {
      assert.throws(() => {
        var router = new Router();
        router.route('/foo').all(null);
      })
    })

    it('should throw if a callback is undefined', () => {
      assert.throws(() => {
        var router = new Router();
        router.route('/foo').all(undefined);
      })
    })

    it('should throw if a callback is not a function', () => {
      assert.throws(() => {
        var router = new Router();
        router.route('/foo').all('not a function');
      })
    })

    it('should not throw if all callbacks are functions', () => {
      var router = new Router();
      router.route('/foo').all(() => {}).all(() => {});
    })
  })

  describe('error', () => {
    it('should skip non error middleware', () => new Promise(done => {
      var router = new Router();

      router.get('/foo', (req, res, next) => {
        next(new Error('foo'));
      });

      router.get('/bar', (req, res, next) => {
        next(new Error('bar'));
      });

      router.use((req, res, next) => {
        assert(false);
      });

      router.use((err, req, res, next) => {
        assert.equal(err.message, 'foo');
        done();
      });

      router.handle({ url: '/foo', method: 'GET' }, {}, done);
    } ) );

    it('should handle throwing inside routes with params', () => new Promise(done => {
      var router = new Router();

      router.get('/foo/:id', () => {
        throw new Error('foo');
      });

      router.use((req, res, next) => {
        assert(false);
      });

      router.use((err, req, res, next) => {
        assert.equal(err.message, 'foo');
        done();
      });

      router.handle({ url: '/foo/2', method: 'GET' }, {}, () => {});
    } ) );

    it('should handle throwing in handler after async param', () => new Promise(done => {
      var router = new Router();

      router.param('user', (req, res, next, val) => {
        process.nextTick(() => {
          req.user = val;
          next();
        });
      });

      router.use('/:user', (req, res, next) => {
        throw new Error('oh no!');
      });

      router.use((err, req, res, next) => {
        assert.equal(err.message, 'oh no!');
        done();
      });

      router.handle({ url: '/bob', method: 'GET' }, {}, () => {});
    } ) );

    it('should handle throwing inside error handlers', () => new Promise(done => {
      var router = new Router();

      router.use((req, res, next) => {
        throw new Error('boom!');
      });

      router.use((err, req, res, next) => {
        throw new Error('oops');
      });

      router.use((err, req, res, next) => {
        assert.equal(err.message, 'oops');
        done();
      });

      router.handle({ url: '/', method: 'GET' }, {}, done);
    } ) );
  })

  describe('FQDN', () => {
    it('should not obscure FQDNs', () => new Promise(done => {
      var request = { hit: 0, url: 'http://example.com/foo', method: 'GET' };
      var router = new Router();

      router.use((req, res, next) => {
        assert.equal(req.hit++, 0);
        assert.equal(req.url, 'http://example.com/foo');
        next();
      });

      router.handle(request, {}, (err) => {
        if (err) return done(err);
        assert.equal(request.hit, 1);
        done();
      });
    } ) );

    it('should ignore FQDN in search', () => new Promise(done => {
      var request = { hit: 0, url: '/proxy?url=http://example.com/blog/post/1', method: 'GET' };
      var router = new Router();

      router.use('/proxy', (req, res, next) => {
        assert.equal(req.hit++, 0);
        assert.equal(req.url, '/?url=http://example.com/blog/post/1');
        next();
      });

      router.handle(request, {}, (err) => {
        if (err) return done(err);
        assert.equal(request.hit, 1);
        done();
      });
    } ) );

    it('should ignore FQDN in path', () => new Promise(done => {
      var request = { hit: 0, url: '/proxy/http://example.com/blog/post/1', method: 'GET' };
      var router = new Router();

      router.use('/proxy', (req, res, next) => {
        assert.equal(req.hit++, 0);
        assert.equal(req.url, '/http://example.com/blog/post/1');
        next();
      });

      router.handle(request, {}, (err) => {
        if (err) return done(err);
        assert.equal(request.hit, 1);
        done();
      });
    } ) );

    it('should adjust FQDN req.url', () => new Promise(done => {
      var request = { hit: 0, url: 'http://example.com/blog/post/1', method: 'GET' };
      var router = new Router();

      router.use('/blog', (req, res, next) => {
        assert.equal(req.hit++, 0);
        assert.equal(req.url, 'http://example.com/post/1');
        next();
      });

      router.handle(request, {}, (err) => {
        if (err) return done(err);
        assert.equal(request.hit, 1);
        done();
      });
    } ) );

    it('should adjust FQDN req.url with multiple handlers', () => new Promise(done => {
      var request = { hit: 0, url: 'http://example.com/blog/post/1', method: 'GET' };
      var router = new Router();

      router.use((req, res, next) => {
        assert.equal(req.hit++, 0);
        assert.equal(req.url, 'http://example.com/blog/post/1');
        next();
      });

      router.use('/blog', (req, res, next) => {
        assert.equal(req.hit++, 1);
        assert.equal(req.url, 'http://example.com/post/1');
        next();
      });

      router.handle(request, {}, (err) => {
        if (err) return done(err);
        assert.equal(request.hit, 2);
        done();
      });
    } ) );

    it('should adjust FQDN req.url with multiple routed handlers', () => new Promise(done => {
      var request = { hit: 0, url: 'http://example.com/blog/post/1', method: 'GET' };
      var router = new Router();

      router.use('/blog', (req, res, next) => {
        assert.equal(req.hit++, 0);
        assert.equal(req.url, 'http://example.com/post/1');
        next();
      });

      router.use('/blog', (req, res, next) => {
        assert.equal(req.hit++, 1);
        assert.equal(req.url, 'http://example.com/post/1');
        next();
      });

      router.use((req, res, next) => {
        assert.equal(req.hit++, 2);
        assert.equal(req.url, 'http://example.com/blog/post/1');
        next();
      });

      router.handle(request, {}, (err) => {
        if (err) return done(err);
        assert.equal(request.hit, 3);
        done();
      });
    } ) );
  })

  describe('.all', () => {
    it('should support using .all to capture all http verbs', () => new Promise(done => {
      var router = new Router();

      var count = 0;
      router.all('/foo', () => { count++; });

      var url = '/foo?bar=baz';

      methods.forEach(function testMethod(method) {
        router.handle({ url: url, method: method }, {}, () => {});
      });

      assert.equal(count, methods.length);
      done();
    } ) );

    it('should be called for any URL when "*"', () => new Promise(done => {
      var cb = after(4, done)
      var router = new Router()

      function no () {
        throw new Error('should not be called')
      }

      router.all('*', (req, res) => {
        res.end()
      })

      router.handle({ url: '/', method: 'GET' }, { end: cb }, no)
      router.handle({ url: '/foo', method: 'GET' }, { end: cb }, no)
      router.handle({ url: 'foo', method: 'GET' }, { end: cb }, no)
      router.handle({ url: '*', method: 'GET' }, { end: cb }, no)
    } ) );
  })

  describe('.use', () => {
    it('should require middleware', () => {
      var router = new Router()
      assert.throws(() => { router.use('/') }, /requires a middleware function/)
    })

    it('should reject string as middleware', () => {
      var router = new Router()
      assert.throws(() => { router.use('/', 'foo') }, /requires a middleware function but got a string/)
    })

    it('should reject number as middleware', () => {
      var router = new Router()
      assert.throws(() => { router.use('/', 42) }, /requires a middleware function but got a number/)
    })

    it('should reject null as middleware', () => {
      var router = new Router()
      assert.throws(() => { router.use('/', null) }, /requires a middleware function but got a Null/)
    })

    it('should reject Date as middleware', () => {
      var router = new Router()
      assert.throws(() => { router.use('/', new Date()) }, /requires a middleware function but got a Date/)
    })

    it('should be called for any URL', () => new Promise(done => {
      var cb = after(4, done)
      var router = new Router()

      function no () {
        throw new Error('should not be called')
      }

      router.use((req, res) => {
        res.end()
      })

      router.handle({ url: '/', method: 'GET' }, { end: cb }, no)
      router.handle({ url: '/foo', method: 'GET' }, { end: cb }, no)
      router.handle({ url: 'foo', method: 'GET' }, { end: cb }, no)
      router.handle({ url: '*', method: 'GET' }, { end: cb }, no)
    } ) );

    it('should accept array of middleware', () => new Promise(done => {
      var count = 0;
      var router = new Router();

      function fn1(req, res, next){
        assert.equal(++count, 1);
        next();
      }

      function fn2(req, res, next){
        assert.equal(++count, 2);
        next();
      }

      router.use([fn1, fn2], (req, res) => {
        assert.equal(++count, 3);
        done();
      });

      router.handle({ url: '/foo', method: 'GET' }, {}, () => {});
    } ) );
  })

  describe('.param', () => {
    it('should call param function when routing VERBS', () => new Promise(done => {
      var router = new Router();

      router.param('id', (req, res, next, id) => {
        assert.equal(id, '123');
        next();
      });

      router.get('/foo/:id/bar', (req, res, next) => {
        assert.equal(req.params.id, '123');
        next();
      });

      router.handle({ url: '/foo/123/bar', method: 'get' }, {}, done);
    } ) );

    it('should call param function when routing middleware', () => new Promise(done => {
      var router = new Router();

      router.param('id', (req, res, next, id) => {
        assert.equal(id, '123');
        next();
      });

      router.use('/foo/:id/bar', (req, res, next) => {
        assert.equal(req.params.id, '123');
        assert.equal(req.url, '/baz');
        next();
      });

      router.handle({ url: '/foo/123/bar/baz', method: 'get' }, {}, done);
    } ) );

    it('should only call once per request', () => new Promise(done => {
      var count = 0;
      var req = { url: '/foo/bob/bar', method: 'get' };
      var router = new Router();
      var sub = new Router();

      sub.get('/bar', (req, res, next) => {
        next();
      });

      router.param('user', (req, res, next, user) => {
        count++;
        req.user = user;
        next();
      });

      router.use('/foo/:user/', new Router());
      router.use('/foo/:user/', sub);

      router.handle(req, {}, (err) => {
        if (err) return done(err);
        assert.equal(count, 1);
        assert.equal(req.user, 'bob');
        done();
      });
    } ) );

    it('should call when values differ', () => new Promise(done => {
      var count = 0;
      var req = { url: '/foo/bob/bar', method: 'get' };
      var router = new Router();
      var sub = new Router();

      sub.get('/bar', (req, res, next) => {
        next();
      });

      router.param('user', (req, res, next, user) => {
        count++;
        req.user = user;
        next();
      });

      router.use('/foo/:user/', new Router());
      router.use('/:user/bob/', sub);

      router.handle(req, {}, (err) => {
        if (err) return done(err);
        assert.equal(count, 2);
        assert.equal(req.user, 'foo');
        done();
      });
    } ) );
  });

  describe('parallel requests', () => {
    it('should not mix requests', () => new Promise(done => {
      var req1 = { url: '/foo/50/bar', method: 'get' };
      var req2 = { url: '/foo/10/bar', method: 'get' };
      var router = new Router();
      var sub = new Router();
      var cb = after(2, done)


      sub.get('/bar', (req, res, next) => {
        next();
      });

      router.param('ms', (req, res, next, ms) => {
        ms = parseInt(ms, 10);
        req.ms = ms;
        setTimeout(next, ms);
      });

      router.use('/foo/:ms/', new Router());
      router.use('/foo/:ms/', sub);

      router.handle(req1, {}, (err) => {
        assert.ifError(err);
        assert.equal(req1.ms, 50);
        assert.equal(req1.originalUrl, '/foo/50/bar');
        cb()
      });

      router.handle(req2, {}, (err) => {
        assert.ifError(err);
        assert.equal(req2.ms, 10);
        assert.equal(req2.originalUrl, '/foo/10/bar');
        cb()
      });
    } ) );
  });
})
