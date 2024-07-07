import { describe, it } from 'vitest';
import assert from 'assert';
import request from 'supertest';
import express from '../index.cjs';

describe('app', () => {
  describe('.VERB()', () => {
    it('should not get invoked without error handler on error', () => new Promise(done => {
      var app = express();

      app.use((req, res, next) => {
        next(new Error('boom!'))
      });

      app.get('/bar', (req, res) => {
        res.send('hello, world!');
      });

      request(app)
      .post('/bar')
      .expect(500, /Error: boom!/, done);
    }) );

    it('should only call an error handling routing callback when an error is propagated', () => new Promise(done => {
      var app = express();

      var a = false;
      var b = false;
      var c = false;
      var d = false;

      app.get('/', (req, res, next) => {
        next(new Error('fabricated error'));
      }, (req, res, next) => {
        a = true;
        next();
      }, (err, req, res, next) => {
        b = true;
        assert.strictEqual(err.message, 'fabricated error')
        next(err);
      }, (err, req, res, next) => {
        c = true;
        assert.strictEqual(err.message, 'fabricated error')
        next();
      }, (err, req, res, next) => {
        d = true;
        next();
      }, (req, res) => {
        assert.ok(!a)
        assert.ok(b)
        assert.ok(c)
        assert.ok(!d)
        res.send(204);
      });

      request(app)
      .get('/')
      .expect(204, done);
    }) );
  })
})
