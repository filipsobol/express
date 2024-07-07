import { describe, it } from 'vitest';
import request from 'supertest';
import app from '../../examples/auth';

function getCookie(res) {
  return res.headers['set-cookie'][0].split(';')[0];
}

describe('auth', () => {
  describe('GET /',() => {
    it('should redirect to /login', () => new Promise(done => {
      request(app)
      .get('/')
      .expect('Location', '/login')
      .expect(302, done)
    } ) );
  })

  describe('GET /login',() => {
    it('should render login form', () => new Promise(done => {
      request(app)
      .get('/login')
      .expect(200, /<form/, done)
    } ) );

    it('should display login error for bad user', () => new Promise(done => {
      request(app)
      .post('/login')
      .type('urlencoded')
      .send('username=not-tj&password=foobar')
      .expect('Location', '/login')
      .expect(302, (err, res) => {
        if (err) return done(err)
        request(app)
        .get('/login')
        .set('Cookie', getCookie(res))
        .expect(200, /Authentication failed/, done)
      })
    } ) );

    it('should display login error for bad password', () => new Promise(done => {
      request(app)
        .post('/login')
        .type('urlencoded')
        .send('username=tj&password=nogood')
        .expect('Location', '/login')
        .expect(302, (err, res) => {
          if (err) return done(err)
          request(app)
            .get('/login')
            .set('Cookie', getCookie(res))
            .expect(200, /Authentication failed/, done)
        })
    } ) );
  })

  describe('GET /logout',() => {
    it('should redirect to /', () => new Promise(done => {
      request(app)
      .get('/logout')
      .expect('Location', '/')
      .expect(302, done)
    } ) );
  })

  describe('GET /restricted',() => {
    it('should redirect to /login without cookie', () => new Promise(done => {
      request(app)
      .get('/restricted')
      .expect('Location', '/login')
      .expect(302, done)
    } ) );

    it('should succeed with proper cookie', () => new Promise(done => {
      request(app)
      .post('/login')
      .type('urlencoded')
      .send('username=tj&password=foobar')
      .expect('Location', '/')
      .expect(302, (err, res) => {
        if (err) return done(err)
        request(app)
        .get('/restricted')
        .set('Cookie', getCookie(res))
        .expect(200, done)
      })
    } ) );
  })

  describe('POST /login', () => {
    it('should fail without proper username', () => new Promise(done => {
      request(app)
      .post('/login')
      .type('urlencoded')
      .send('username=not-tj&password=foobar')
      .expect('Location', '/login')
      .expect(302, done)
    } ) );

    it('should fail without proper password', () => new Promise(done => {
      request(app)
      .post('/login')
      .type('urlencoded')
      .send('username=tj&password=baz')
      .expect('Location', '/login')
      .expect(302, done)
    } ) );

    it('should succeed with proper credentials', () => new Promise(done => {
      request(app)
      .post('/login')
      .type('urlencoded')
      .send('username=tj&password=foobar')
      .expect('Location', '/')
      .expect(302, done)
    } ) );
  })
})
