import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('req', () => {
  describe('.protocol', () => {
    it('should return the protocol string', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.protocol);
      });

      request(app)
      .get('/')
      .expect('http', done);
    } ) );

    describe('when "trust proxy" is enabled', () => {
      it('should respect X-Forwarded-Proto', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.use((req, res) => {
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('https', done);
      } ) );

      it('should default to the socket addr if X-Forwarded-Proto not present', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.use((req, res) => {
          req.connection.encrypted = true;
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .expect('https', done);
      } ) );

      it('should ignore X-Forwarded-Proto if socket addr not trusted', () => new Promise(done => {
        var app = express();

        app.set('trust proxy', '10.0.0.1');

        app.use((req, res) => {
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('http', done);
      } ) );

      it('should default to http', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.use((req, res) => {
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .expect('http', done);
      } ) );

      describe('when trusting hop count', () => {
        it('should respect X-Forwarded-Proto', () => new Promise(done => {
          var app = express();

          app.set('trust proxy', 1);

          app.use((req, res) => {
            res.end(req.protocol);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-Proto', 'https')
          .expect('https', done);
        } ) );
      })
    })

    describe('when "trust proxy" is disabled', () => {
      it('should ignore X-Forwarded-Proto', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.end(req.protocol);
        });

        request(app)
        .get('/')
        .set('X-Forwarded-Proto', 'https')
        .expect('http', done);
      } ) );
    })
  })
})
