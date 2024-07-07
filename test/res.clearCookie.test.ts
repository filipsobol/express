import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('res', () => {
  describe('.clearCookie(name)', () => {
    it('should set a cookie passed expiry', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.clearCookie('sid').end();
      });

      request(app)
      .get('/')
      .expect('Set-Cookie', 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
      .expect(200, done)
    } ) );
  })

  describe('.clearCookie(name, options)', () => {
    it('should set the given params', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.clearCookie('sid', { path: '/admin' }).end();
      });

      request(app)
      .get('/')
      .expect('Set-Cookie', 'sid=; Path=/admin; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
      .expect(200, done)
    } ) );

    it('should set expires when passed', () => new Promise(done => {
      var expiresAt = new Date()
      var app = express();

      app.use((req, res) => {
        res.clearCookie('sid', { expires: expiresAt }).end();
      });

      request(app)
      .get('/')
      .expect('Set-Cookie', 'sid=; Path=/; Expires=' + expiresAt.toUTCString() )
      .expect(200, done)
    } ) );

    it('should set both maxAge and expires when passed', () => new Promise(done => {
      var maxAgeInMs = 10000
      var expiresAt = new Date()
      var expectedExpires = new Date(expiresAt.getTime() + maxAgeInMs)
      var app = express();

      app.use((req, res) => {
        res.clearCookie('sid', { expires: expiresAt, maxAge: maxAgeInMs }).end();
      });

      request(app)
      .get('/')
      // yes, this is the behavior. When we set a max-age, we also set expires to a date 10 sec ahead of expires
      // even if we set max-age only, we will also set an expires 10 sec in the future
      .expect('Set-Cookie', 'sid=; Max-Age=10; Path=/; Expires=' + expectedExpires.toUTCString())
      .expect(200, done)
    } ) );
  })
})
