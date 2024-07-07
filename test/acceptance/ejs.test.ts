import { describe, it } from 'vitest';
import request from 'supertest';
import app from '../../examples/ejs';

describe('ejs', () => {
  describe('GET /', () => {
    it('should respond with html', () => new Promise(done => {
      request(app)
      .get('/')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<li>tobi &lt;tobi@learnboost\.com&gt;<\/li>/)
      .expect(/<li>loki &lt;loki@learnboost\.com&gt;<\/li>/)
      .expect(/<li>jane &lt;jane@learnboost\.com&gt;<\/li>/)
      .expect(200, done)
    }));
  })
})
