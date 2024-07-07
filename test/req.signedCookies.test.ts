import { describe, it } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import express from '../src/express.js';

describe('req', () => {
  describe('.signedCookies', () => {
    it('should return a signed JSON cookie', () => new Promise(done => {
      var app = express();

      app.use(cookieParser('secret'));

      app.use((req, res) => {
        if (req.path === '/set') {
          res.cookie('obj', { foo: 'bar' }, { signed: true });
          res.end();
        } else {
          res.send(req.signedCookies);
        }
      });

      request(app)
      .get('/set')
      .end((err, res) => {
        if (err) return done(err);
        var cookie = res.header['set-cookie'];

        request(app)
        .get('/')
        .set('Cookie', cookie)
        .expect(200, { obj: { foo: 'bar' } }, done)
      });
    } ) );
  })
})

