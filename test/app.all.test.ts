import { describe, it } from 'vitest';
import after from 'after';
import request from 'supertest';
import express from '../src/express.cjs';

describe('app.all()', () => {
  it('should add a router per method', () => new Promise(done => {
    const app = express();
    const cb = after(2, done)

    app.all('/tobi', (req, res) => {
      res.end(req.method);
    });

    request(app)
      .put('/tobi')
      .expect(200, 'PUT', cb)

    request(app)
      .get('/tobi')
      .expect(200, 'GET', cb)
  }));

  it( 'should run the callback for a method just once', () => new Promise(done => {
    const app = express();
    let n = 0;

    app.all('/*', (req, res, next) => {
      if (n++) return done(new Error('DELETE called several times'));
      next();
    });

    request(app)
    .del('/tobi')
    .expect(404, done);
  } ));
})
