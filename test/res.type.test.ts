import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('res', () => {
  describe('.type(str)', () => {
    it('should set the Content-Type based on a filename', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.type('foo.js').end('var name = "tj";');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/javascript; charset=utf-8')
      .end(done)
    } ) );

    it('should default to application/octet-stream', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.type('rawr').end('var name = "tj";');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/octet-stream', done);
    } ) );

    it('should set the Content-Type with type/subtype', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.type('application/vnd.amazon.ebook')
          .end('var name = "tj";');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/vnd.amazon.ebook', done);
    } ) );
  })
})
