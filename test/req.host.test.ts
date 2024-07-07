import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('req', () => {
  describe('.host', () => {
    it('should return the Host when present', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', 'example.com')
      .expect('example.com', done);
    } ) );

    it('should strip port number', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', 'example.com:3000')
      .expect('example.com', done);
    } ) );

    it('should return undefined otherwise', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        req.headers.host = null;
        res.end(String(req.host));
      });

      request(app)
      .post('/')
      .expect('undefined', done);
    } ) );

    it('should work with IPv6 Host', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', '[::1]')
      .expect('[::1]', done);
    } ) );

    it('should work with IPv6 Host and port', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.end(req.host);
      });

      request(app)
      .post('/')
      .set('Host', '[::1]:3000')
      .expect('[::1]', done);
    } ) );

    describe('when "trust proxy" is enabled', () => {
      it('should respect X-Forwarded-Host', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.use((req, res) => {
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'localhost')
        .set('X-Forwarded-Host', 'example.com')
        .expect('example.com', done);
      } ) );

      it('should ignore X-Forwarded-Host if socket addr not trusted', () => new Promise(done => {
        var app = express();

        app.set('trust proxy', '10.0.0.1');

        app.use((req, res) => {
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'localhost')
        .set('X-Forwarded-Host', 'example.com')
        .expect('localhost', done);
      } ) );

      it('should default to Host', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.use((req, res) => {
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'example.com')
        .expect('example.com', done);
      } ) );

      describe('when trusting hop count', () => {
        it('should respect X-Forwarded-Host', () => new Promise(done => {
          var app = express();

          app.set('trust proxy', 1);

          app.use((req, res) => {
            res.end(req.host);
          });

          request(app)
          .get('/')
          .set('Host', 'localhost')
          .set('X-Forwarded-Host', 'example.com')
          .expect('example.com', done);
        } ) );
      })
    })

    describe('when "trust proxy" is disabled', () => {
      it('should ignore X-Forwarded-Host', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.end(req.host);
        });

        request(app)
        .get('/')
        .set('Host', 'localhost')
        .set('X-Forwarded-Host', 'evil')
        .expect('localhost', done);
      } ) );
    })
  })
})
