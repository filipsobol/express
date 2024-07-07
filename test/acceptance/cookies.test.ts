import { describe, it } from 'vitest';
import request from 'supertest';
import { shouldNotHaveHeader } from '../support/utils';
import app from '../../examples/cookies';

describe('cookies', () => {
  describe('GET /', () => {
    it('should have a form', () => new Promise(done => {
      request(app)
      .get('/')
      .expect(/<form/, done);
    } ) );

    it('should respond with no cookies', () => new Promise(done => {
      request(app)
      .get('/')
      .expect( shouldNotHaveHeader('Set-Cookie'))
      .expect(200, done)
    } ) );

    it('should respond to cookie', () => new Promise(done => {
      request(app)
      .post('/')
      .type('urlencoded')
      .send({ remember: 1 })
      .expect(302, (err, res) => {
        if (err) return done(err)
        request(app)
        .get('/')
        .set('Cookie', res.headers['set-cookie'][0])
        .expect(200, /Remembered/, done)
      })
    } ) );
  })

  describe('GET /forget', () => {
    it('should clear cookie', () => new Promise(done => {
      request(app)
      .post('/')
      .type('urlencoded')
      .send({ remember: 1 })
      .expect(302, (err, res) => {
        if (err) return done(err)
        request(app)
        .get('/forget')
        .set('Cookie', res.headers['set-cookie'][0])
        .expect('Set-Cookie', /remember=;/)
        .expect(302, done)
      })
    } ) );
  })

  describe('POST /', () => {
    it('should set a cookie', () => new Promise(done => {
      request(app)
      .post('/')
      .type('urlencoded')
      .send({ remember: 1 })
      .expect('Set-Cookie', /remember=1/)
      .expect(302, done)
    } ) );

    it('should no set cookie w/o reminder', () => new Promise(done => {
      request(app)
      .post('/')
      .send({})
      .expect(shouldNotHaveHeader('Set-Cookie'))
      .expect(302, done)
    } ) );
  })
})
