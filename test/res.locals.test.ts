import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../index.cjs';

describe('res', () => {
  describe('.locals', () => {
    it('should be empty by default', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.json(res.locals)
      });

      request(app)
      .get('/')
      .expect(200, {}, done)
    } ) );
  })

  it('should work when mounted', () => new Promise(done => {
    var app = express();
    var blog = express();

    app.use(blog);

    blog.use((req, res, next) => {
      res.locals.foo = 'bar';
      next();
    });

    app.use((req, res) => {
      res.json(res.locals)
    });

    request(app)
    .get('/')
    .expect(200, { foo: 'bar' }, done)
  } ) );
})
