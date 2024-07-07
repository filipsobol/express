import { describe, it } from 'vitest';
import request from 'supertest';
import app from '../../examples/error';

describe('error', () => {
  describe('GET /', () => {
    it('should respond with 500', () => new Promise(done => {
      request(app)
        .get('/')
        .expect(500,done)
    } ) );
  })

  describe('GET /next', () => {
    it('should respond with 500', () => new Promise(done => {
      request(app)
        .get('/next')
        .expect(500,done)
    } ) );
  })

  describe('GET /missing', () => {
    it('should respond with 404', () => new Promise(done => {
      request(app)
        .get('/missing')
        .expect(404,done)
    } ) );
  })
})
