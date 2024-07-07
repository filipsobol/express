import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../index.cjs';

describe('req', () => {
  describe('.param(name, default)', () => {
    it('should use the default value unless defined', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.param('name', 'tj'));
      });

      request(app)
      .get('/')
      .expect('tj', done);
    } ) );
  })

  describe('.param(name)', () => {
    it('should check req.query', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.param('name'));
      });

      request(app)
      .get('/?name=tj')
      .expect('tj', done);
    } ) );

    it('should check req.body', () => new Promise(done => {
      var app = express();

      app.use(express.json())

      app.use((req, res) => {
        res.end(req.param('name'));
      });

      request(app)
      .post('/')
      .send({ name: 'tj' })
      .expect('tj', done);
    } ) );

    it('should check req.params', () => new Promise(done => {
      var app = express();

      app.get('/user/:name', (req, res) => {
        res.end(req.param('filter') + req.param('name'));
      });

      request(app)
      .get('/user/tj')
      .expect('undefinedtj', done);
    } ) );
  })
})
