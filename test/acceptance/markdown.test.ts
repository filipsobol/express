import { describe, it } from 'vitest';
import request from 'supertest';
import app from '../../examples/markdown';

describe('markdown', () => {
  describe('GET /', () => {
    it('should respond with html', () => new Promise(done => {
      request(app)
        .get('/')
        .expect(/<h1[^>]*>Markdown Example<\/h1>/,done)
    } ) );
  })

  describe('GET /fail',() => {
    it('should respond with an error', () => new Promise(done => {
      request(app)
        .get('/fail')
        .expect(500,done)
    } ) );
  })
})
