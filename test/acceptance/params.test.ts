import { describe, it } from 'vitest';
import request from 'supertest';
import app from '../../examples/params';

describe('params', () => {
  describe('GET /', () => {
    it('should respond with instructions', () => new Promise(done => {
      request(app)
        .get('/')
        .expect(/Visit/,done)
    }));
  })

  describe('GET /user/0', () => {
    it('should respond with a user', () => new Promise(done => {
      request(app)
        .get('/user/0')
        .expect(/user tj/,done)
    } ) );
  })

  describe('GET /user/9', () => {
    it('should fail to find user', () => new Promise(done => {
      request(app)
      .get('/user/9')
      .expect(404, /failed to find user/, done)
    } ) );
  })

  describe('GET /users/0-2', () => {
    it('should respond with three users', () => new Promise(done => {
      request(app)
      .get('/users/0-2')
      .expect(/users tj, tobi, loki/, done)
    } ) );
  })

  describe('GET /users/foo-bar', () => {
    it('should fail integer parsing', () => new Promise(done => {
      request(app)
      .get('/users/foo-bar')
      .expect(400, /failed to parseInt foo/, done)
    } ) );
  })
})
