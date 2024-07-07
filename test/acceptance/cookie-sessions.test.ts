import { describe, it } from 'vitest';
import request from 'supertest';
import app from '../../examples/cookie-sessions';

describe('cookie-sessions', () => {
  describe('GET /', () => {
    it('should display no views', () => new Promise(done => {
      request(app)
      .get('/')
      .expect(200, 'viewed 1 times\n', done)
    }));

    it('should set a session cookie', () => new Promise(done => {
      request(app)
      .get('/')
      .expect('Set-Cookie', /session=/)
      .expect(200, done)
    } ) );

    it('should display 1 view on revisit', () => new Promise(done => {
      request(app)
      .get('/')
      .expect(200, 'viewed 1 times\n', (err, res) => {
        if (err) return done(err)
        request(app)
        .get('/')
        .set('Cookie', getCookies(res))
        .expect(200, 'viewed 2 times\n', done)
      })
    } ) );
  })
})

function getCookies(res) {
  return res.headers['set-cookie'].map((val) => {
    return val.split(';')[0]
  }).join('; ');
}
