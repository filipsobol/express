import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('res', () => {
  describe('.get(field)', () => {
    it('should get the response header field', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.setHeader('Content-Type', 'text/x-foo');
        res.send(res.get('Content-Type'));
      });

      request(app)
      .get('/')
      .expect(200, 'text/x-foo', done);
    } ) );
  })
})
