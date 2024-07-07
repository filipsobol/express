import { describe, it } from 'vitest';
import request from 'supertest'
import express from '../index.cjs'

describe('res', () => {
  describe('.sendStatus(statusCode)', () => {
    it('should send the status code and message as body', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendStatus(201);
      });

      request(app)
      .get('/')
      .expect(201, 'Created', done);
    } ) );

    it('should work with unknown code', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendStatus(599);
      });

      request(app)
      .get('/')
      .expect(599, '599', done);
    } ) );
  })
})
