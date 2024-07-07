import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('req', () => {
  describe('.acceptsEncoding', () => {
    it('should return encoding if accepted', () => new Promise(done => {
      var app = express();

      app.get('/', (req, res) => {
        res.send({
          gzip: req.acceptsEncoding('gzip'),
          deflate: req.acceptsEncoding('deflate')
        })
      })

      request(app)
        .get('/')
        .set('Accept-Encoding', ' gzip, deflate')
        .expect(200, { gzip: 'gzip', deflate: 'deflate' }, done)
    } ) );

    it('should be false if encoding not accepted', () => new Promise(done => {
      var app = express();

      app.get('/', (req, res) => {
        res.send({
          bogus: req.acceptsEncoding('bogus')
        })
      })

      request(app)
        .get('/')
        .set('Accept-Encoding', ' gzip, deflate')
        .expect(200, { bogus: false }, done)
    } ) );
  })
})
