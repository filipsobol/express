import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('req', () => {
  describe('.path', () => {
    it('should return the parsed pathname', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.path);
      });

      request(app)
      .get('/login?redirect=/post/1/comments')
      .expect('/login', done);
    } ) );
  })
})
