import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('req', () => {
  describe('.secure', () => {
    describe('when X-Forwarded-Proto is missing', () => {
      it('should return false when http', () => new Promise(done => {
        var app = express();

        app.get('/', (req, res) => {
          res.send(req.secure ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .expect('no', done)
      } ) );
    })
  })

  describe('.secure', () => {
    describe('when X-Forwarded-Proto is present', () => {
      it('should return false when http', () => new Promise(done => {
        var app = express();

        app.get('/', (req, res) => {
          res.send(req.secure ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('no', done)
      } ) );

      it('should return true when "trust proxy" is enabled', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.get('/', (req, res) => {
          res.send(req.secure ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('yes', done)
      } ) );

      it('should return false when initial proxy is http', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.get('/', (req, res) => {
          res.send(req.secure ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'http, https')
        .expect('no', done)
      } ) );

      it('should return true when initial proxy is https', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.get('/', (req, res) => {
          res.send(req.secure ? 'yes' : 'no');
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https, http')
        .expect('yes', done)
      } ) );

      describe('when "trust proxy" trusting hop count', () => {
        it('should respect X-Forwarded-Proto', () => new Promise(done => {
          var app = express();

          app.set('trust proxy', 1);

          app.get('/', (req, res) => {
            res.send(req.secure ? 'yes' : 'no');
          });

          request(app)
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('yes', done)
        } ) );
      })
    })
  })
})
