import { describe, it } from 'vitest';
import assert from 'assert';
import request from 'supertest';
import express from '../src/express.js';

describe('res', () => {
  describe('.json(object)', () => {
    it('should not support jsonp callbacks', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.json({ foo: 'bar' });
      });

      request(app)
      .get('/?callback=foo')
      .expect('{"foo":"bar"}', done);
    } ) );

    it('should not override previous Content-Types', () => new Promise(done => {
      var app = express();

      app.get('/', (req, res) => {
        res.type('application/vnd.example+json');
        res.json({ hello: 'world' });
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/vnd.example+json; charset=utf-8')
      .expect(200, '{"hello":"world"}', done);
    } ) );

    describe('when given primitives', () => {
      it('should respond with json for null', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.json(null);
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, 'null', done)
      } ) );

      it('should respond with json for Number', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.json(300);
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '300', done)
      } ) );

      it('should respond with json for String', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.json('str');
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '"str"', done)
      } ) );
    })

    describe('when given an array', () => {
      it('should respond with json', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.json(['foo', 'bar', 'baz']);
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '["foo","bar","baz"]', done)
      } ) );
    })

    describe('when given an object', () => {
      it('should respond with json', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.json({ name: 'tobi' });
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"name":"tobi"}', done)
      } ) );
    })

    describe('"json escape" setting', () => {
      it('should be undefined by default', () => {
        var app = express()
        assert.strictEqual(app.get('json escape'), undefined)
      })

      it('should unicode escape HTML-sniffing characters', () => new Promise(done => {
        var app = express()

        app.enable('json escape')

        app.use((req, res) => {
          res.json({ '&': '<script>' })
        })

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"\\u0026":"\\u003cscript\\u003e"}', done)
      } ) );

      it('should not break undefined escape', () => new Promise(done => {
        var app = express()

        app.enable('json escape')

        app.use((req, res) => {
          res.json(undefined)
        })

        request(app)
          .get('/')
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(200, '', done)
      } ) );
    })

    describe('"json replacer" setting', () => {
      it('should be passed to JSON.stringify()', () => new Promise(done => {
        var app = express();

        app.set('json replacer', (key, val) => {
          return key[0] === '_'
            ? undefined
            : val;
        });

        app.use((req, res) => {
          res.json({ name: 'tobi', _id: 12345 });
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"name":"tobi"}', done)
      } ) );
    })

    describe('"json spaces" setting', () => {
      it('should be undefined by default', () => {
        var app = express();
        assert(undefined === app.get('json spaces'));
      })

      it('should be passed to JSON.stringify()', () => new Promise(done => {
        var app = express();

        app.set('json spaces', 2);

        app.use((req, res) => {
          res.json({ name: 'tobi', age: 2 });
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{\n  "name": "tobi",\n  "age": 2\n}', done)
      } ) );
    })
  })

  describe('.json(status, object)', () => {
    it('should respond with json and set the .statusCode', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.json(201, { id: 1 });
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(201, '{"id":1}', done)
    } ) );
  })

  describe('.json(object, status)', () => {
    it('should respond with json and set the .statusCode for backwards compat', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.json({ id: 1 }, 201);
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(201, '{"id":1}', done)
    } ) );

    it('should use status as second number for backwards compat', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.json(200, 201);
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(201, '200', done)
    } ) );
  })
})
