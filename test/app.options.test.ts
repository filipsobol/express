import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

const noop = () => {};

describe('OPTIONS', () => {
  it('should default to the routes defined', () => new Promise(done =>{
    var app = express();

    app.del('/', noop);
    app.get('/users', noop);
    app.put('/users', noop);

    request(app)
    .options('/users')
    .expect('Allow', 'GET,HEAD,PUT')
    .expect(200, 'GET,HEAD,PUT', done);
  }));

  it( 'should only include each method once', () => new Promise(done => {
    var app = express();

    app.del('/', noop);
    app.get('/users', noop);
    app.put('/users', noop);
    app.get('/users', noop);

    request(app)
    .options('/users')
    .expect('Allow', 'GET,HEAD,PUT')
    .expect(200, 'GET,HEAD,PUT', done);
  }));

  it( 'should not be affected by app.all', () => new Promise(done => {
    var app = express();

    app.get('/', noop);
    app.get('/users', noop);
    app.put('/users', noop);
    app.all('/users', (req, res, next) => {
      res.setHeader('x-hit', '1');
      next();
    });

    request(app)
    .options('/users')
    .expect('x-hit', '1')
    .expect('Allow', 'GET,HEAD,PUT')
    .expect(200, 'GET,HEAD,PUT', done);
  }))

  it( 'should not respond if the path is not defined', () => new Promise(done => {
    var app = express();

    app.get('/users', noop);

    request(app)
    .options('/other')
    .expect(404, done);
  }))

  it( 'should forward requests down the middleware chain', () => new Promise(done => {
    var app = express();
    var router = new express.Router();

    router.get('/users', noop);
    app.use(router);
    app.get('/other', noop);

    request(app)
    .options('/other')
    .expect('Allow', 'GET,HEAD')
    .expect(200, 'GET,HEAD', done);
  }))

  describe('when error occurs in response handler', () => {
    it( 'should pass error to callback', () => new Promise(done => {
      var app = express();
      var router = express.Router();

      router.get('/users', noop);

      app.use((req, res, next) => {
        res.writeHead(200);
        next();
      });
      app.use(router);
      app.use((err, req, res, next) => {
        res.end('true');
      });

      request(app)
      .options('/users')
      .expect(200, 'true', done)
    }));
  })
})

describe('app.options()', () => {
  it( 'should override the default behavior', () => new Promise(done => {
    var app = express();

    app.options('/users', (req, res) => {
      res.set('Allow', 'GET');
      res.send('GET');
    });

    app.get('/users', noop);
    app.put('/users', noop);

    request(app)
    .options('/users')
    .expect('GET')
    .expect('Allow', 'GET', done);
  }));
})
