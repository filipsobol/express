import { describe, it } from 'vitest';
import request from 'supertest';
import app from '../../examples/hello-world';

describe('hello-world', () => {
  describe('GET /', () => {
    it('should respond with hello world', () => new Promise(done => {
      request(app)
        .get('/')
        .expect(200, 'Hello World', done)
    } ) );
  })

  describe('GET /missing', () => {
    it('should respond with 404', () => new Promise(done => {
      request(app)
        .get('/missing')
        .expect(404, done)
    } ) );
  })
})
