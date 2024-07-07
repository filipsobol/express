import { describe, it } from 'vitest';
import after from 'after'
import request from 'supertest';
import express from '../src/express.cjs';

describe('app', () => {
  describe('.request', () => {
    it('should extend the request prototype', () => new Promise(done => {
      var app = express();

      app.request.querystring = () => {
        return require('url').parse(this.url).query;
      };

      app.use((req, res) => {
        res.end(req.querystring());
      });

      request(app)
      .get('/foo?name=tobi')
      .expect('name=tobi', done);
    } ) );

    it('should only extend for the referenced app', () => new Promise(done => {
      var app1 = express()
      var app2 = express()
      var cb = after(2, done)

      app1.request.foobar = () => {
        return 'tobi'
      }

      app1.get('/', (req, res) => {
        res.send(req.foobar())
      })

      app2.get('/', (req, res) => {
        res.send(req.foobar())
      })

      request(app1)
        .get('/')
        .expect(200, 'tobi', cb)

      request(app2)
        .get('/')
        .expect(500, /(?:not a function|has no method)/, cb)
    } ) );

    it('should inherit to sub apps', () => new Promise(done => {
      var app1 = express()
      var app2 = express()
      var cb = after(2, done)

      app1.request.foobar = () => {
        return 'tobi'
      }

      app1.use('/sub', app2)

      app1.get('/', (req, res) => {
        res.send(req.foobar())
      })

      app2.get('/', (req, res) => {
        res.send(req.foobar())
      })

      request(app1)
        .get('/')
        .expect(200, 'tobi', cb)

      request(app1)
        .get('/sub')
        .expect(200, 'tobi', cb)
    } ) );

    it('should allow sub app to override', () => new Promise(done => {
      var app1 = express()
      var app2 = express()
      var cb = after(2, done)

      app1.request.foobar = () => {
        return 'tobi'
      }

      app2.request.foobar = () => {
        return 'loki'
      }

      app1.use('/sub', app2)

      app1.get('/', (req, res) => {
        res.send(req.foobar())
      })

      app2.get('/', (req, res) => {
        res.send(req.foobar())
      })

      request(app1)
        .get('/')
        .expect(200, 'tobi', cb)

      request(app1)
        .get('/sub')
        .expect(200, 'loki', cb)
    } ) );

    it('should not pollute parent app', () => new Promise(done => {
      var app1 = express()
      var app2 = express()
      var cb = after(2, done)

      app1.request.foobar = () => {
        return 'tobi'
      }

      app2.request.foobar = () => {
        return 'loki'
      }

      app1.use('/sub', app2)

      app1.get('/sub/foo', (req, res) => {
        res.send(req.foobar())
      })

      app2.get('/', (req, res) => {
        res.send(req.foobar())
      })

      request(app1)
        .get('/sub')
        .expect(200, 'loki', cb)

      request(app1)
        .get('/sub/foo')
        .expect(200, 'tobi', cb)
    } ) );
  })
})
