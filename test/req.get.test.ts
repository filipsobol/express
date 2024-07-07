import { describe, it } from 'vitest';
import assert from 'assert';
import request from 'supertest';
import express from '../src/express.js';

describe('req', () => {
  describe('.get(field)', () => {
    it('should return the header field value', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        assert(req.get('Something-Else') === undefined);
        res.end(req.get('Content-Type'));
      });

      request(app)
      .post('/')
      .set('Content-Type', 'application/json')
      .expect('application/json', done);
    } ) );

    it('should special-case Referer', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.get('Referer'));
      });

      request(app)
      .post('/')
      .set('Referrer', 'http://foobar.com')
      .expect('http://foobar.com', done);
    } ) );

    it('should throw missing header name', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.end(req.get())
      })

      request(app)
      .get('/')
      .expect(500, /TypeError: name argument is required to req.get/, done)
    } ) );

    it('should throw for non-string header name', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.end(req.get(42))
      })

      request(app)
      .get('/')
      .expect(500, /TypeError: name must be a string to req.get/, done)
    } ) );
  })
})
