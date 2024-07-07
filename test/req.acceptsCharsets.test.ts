import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('req', () => {
  describe('.acceptsCharsets(type)', () => {
    describe('when Accept-Charset is not present', () => {
      it('should return true', () => new Promise(done => {
        var app = express();

        app.use((req, res, next) => {
          res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .expect('yes', done);
      } ) );
    })

    describe('when Accept-Charset is present', () => {
      it('should return true', () => new Promise(done => {
        var app = express();

        app.use((req, res, next) => {
          res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .set('Accept-Charset', 'foo, bar, utf-8')
        .expect('yes', done);
      } ) );

      it('should return false otherwise', () => new Promise(done => {
        var app = express();

        app.use((req, res, next) => {
          res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .set('Accept-Charset', 'foo, bar')
        .expect('no', done);
      } ) );
    })
  })
})
