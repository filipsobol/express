import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('req', () => {
  describe('.stale', () => {
    it('should return false when the resource is not modified', () => new Promise(done => {
      var app = express();
      var etag = '"12345"';

      app.use((req, res) => {
        res.set('ETag', etag);
        res.send(req.stale);
      });

      request(app)
      .get('/')
      .set('If-None-Match', etag)
      .expect(304, done);
    } ) );

    it('should return true when the resource is modified', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.set('ETag', '"123"');
        res.send(req.stale);
      });

      request(app)
      .get('/')
      .set('If-None-Match', '"12345"')
      .expect(200, 'true', done);
    } ) );

    it('should return true without response headers', () => new Promise(done => {
      var app = express();

      app.disable('x-powered-by')
      app.use((req, res) => {
        res.send(req.stale);
      });

      request(app)
      .get('/')
      .expect(200, 'true', done);
    } ) );
  })
})
