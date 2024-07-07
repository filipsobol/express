import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('throw after .end()', () => {
  it('should fail gracefully', () => new Promise(done => {
    var app = express();

    app.get('/', (req, res) => {
      res.end('yay');
      throw new Error('boom');
    });

    request(app)
    .get('/')
    .expect('yay')
    .expect(200, done);
  } ) );
})
