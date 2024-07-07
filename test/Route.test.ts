import { describe, it } from 'vitest';
import after from 'after';
import assert from 'assert';
import methods from 'methods';
import express from '../index.cjs'

const Route = express.Route;

describe('Route', () => {
  it('should work without handlers', () => new Promise(done => {
    var req = { method: 'GET', url: '/' }
    var route = new Route('/foo')
    route.dispatch(req, {}, done)
  } ) );

  it('should not stack overflow with a large sync stack', () => new Promise(done => {
    var req = { method: 'GET', url: '/' }
    var route = new Route('/foo')

    route.get((req, res, next) => {
      req.counter = 0
      next()
    })

    for (var i = 0; i < 6000; i++) {
      route.all((req, res, next) => {
        req.counter++
        next()
      })
    }

    route.get((req, res, next) => {
      req.called = true
      next()
    })

    route.dispatch(req, {}, (err) => {
      if (err) return done(err)
      assert.ok(req.called)
      assert.strictEqual(req.counter, 6000)
      done()
    })
  } ) );

  describe('.all', () => {
    it('should add handler', () => new Promise(done => {
      var req = { method: 'GET', url: '/' };
      var route = new Route('/foo');

      route.all((req, res, next) => {
        req.called = true;
        next();
      });

      route.dispatch(req, {}, (err) => {
        if (err) return done(err);
        assert.ok(req.called)
        done();
      });
    } ) );

    it('should handle VERBS', () => new Promise(done => {
      var count = 0;
      var route = new Route('/foo');
      var cb = after(methods.length, (err) => {
        if (err) return done(err);
        assert.strictEqual(count, methods.length)
        done();
      });

      route.all((req, res, next) => {
        count++;
        next();
      });

      methods.forEach(function testMethod(method) {
        var req = { method: method, url: '/' };
        route.dispatch(req, {}, cb);
      });
    } ) );

    it('should stack', () => new Promise(done => {
      var req = { count: 0, method: 'GET', url: '/' };
      var route = new Route('/foo');

      route.all((req, res, next) => {
        req.count++;
        next();
      });

      route.all((req, res, next) => {
        req.count++;
        next();
      });

      route.dispatch(req, {}, (err) => {
        if (err) return done(err);
        assert.strictEqual(req.count, 2)
        done();
      });
    } ) );
  })

  describe('.VERB', () => {
    it('should support .get', () => new Promise(done => {
      var req = { method: 'GET', url: '/' };
      var route = new Route('');

      route.get((req, res, next) => {
        req.called = true;
        next();
      })

      route.dispatch(req, {}, (err) => {
        if (err) return done(err);
        assert.ok(req.called)
        done();
      });
    } ) );

    it('should limit to just .VERB', () => new Promise(done => {
      var req = { method: 'POST', url: '/' };
      var route = new Route('');

      route.get(() => {
        throw new Error('not me!');
      })

      route.post((req, res, next) => {
        req.called = true;
        next();
      })

      route.dispatch(req, {}, (err) => {
        if (err) return done(err);
        assert.ok(req.called)
        done();
      });
    } ) );

    it('should allow fallthrough', () => new Promise(done => {
      var req = { order: '', method: 'GET', url: '/' };
      var route = new Route('');

      route.get((req, res, next) => {
        req.order += 'a';
        next();
      })

      route.all((req, res, next) => {
        req.order += 'b';
        next();
      });

      route.get((req, res, next) => {
        req.order += 'c';
        next();
      })

      route.dispatch(req, {}, (err) => {
        if (err) return done(err);
        assert.strictEqual(req.order, 'abc')
        done();
      });
    } ) );
  })

  describe('errors', () => {
    it('should handle errors via arity 4 functions', () => new Promise(done => {
      var req = { order: '', method: 'GET', url: '/' };
      var route = new Route('');

      route.all((req, res, next) => {
        next(new Error('foobar'));
      });

      route.all((req, res, next) => {
        req.order += '0';
        next();
      });

      route.all((err, req, res, next) => {
        req.order += 'a';
        next(err);
      });

      route.dispatch(req, {}, (err) => {
        assert.ok(err)
        assert.strictEqual(err.message, 'foobar')
        assert.strictEqual(req.order, 'a')
        done();
      });
    } ) );

    it('should handle throw', () => new Promise(done => {
      var req = { order: '', method: 'GET', url: '/' };
      var route = new Route('');

      route.all(() => {
        throw new Error('foobar');
      });

      route.all((req, res, next) => {
        req.order += '0';
        next();
      });

      route.all((err, req, res, next) => {
        req.order += 'a';
        next(err);
      });

      route.dispatch(req, {}, (err) => {
        assert.ok(err)
        assert.strictEqual(err.message, 'foobar')
        assert.strictEqual(req.order, 'a')
        done();
      });
    } ) );

    it('should handle throwing inside error handlers', () => new Promise(done => {
      var req = { method: 'GET', url: '/' };
      var route = new Route('');

      route.get(() => {
        throw new Error('boom!');
      });

      route.get((err, req, res, next) => {
        throw new Error('oops');
      });

      route.get((err, req, res, next) => {
        req.message = err.message;
        next();
      });

      route.dispatch(req, {}, (err) => {
        if (err) return done(err);
        assert.strictEqual(req.message, 'oops')
        done();
      });
    } ) );

    it('should handle throw in .all', () => new Promise(done => {
      var req = { method: 'GET', url: '/' };
      var route = new Route('');

      route.all((req, res, next) => {
        throw new Error('boom!');
      });

      route.dispatch(req, {}, (err) => {
        assert.ok(err)
        assert.strictEqual(err.message, 'boom!')
        done();
      });
    } ) );

    it('should handle single error handler', () => new Promise(done => {
      var req = { method: 'GET', url: '/' };
      var route = new Route('');

      route.all((err, req, res, next) => {
        // this should not execute
        throw new Error('should not be called')
      });

      route.dispatch(req, {}, done);
    } ) );
  })
})
