import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('app.del()', () => {
  it( 'should alias app.delete()', () => new Promise(done => {
    const app = express();

    app.del('/tobi', (req, res) => {
      res.end('deleted tobi!');
    });

    request(app)
    .del('/tobi')
    .expect('deleted tobi!', done);
  }));
})
