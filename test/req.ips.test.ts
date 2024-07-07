import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('req', () => {
  describe('.ips', () => {
    describe('when X-Forwarded-For is present', () => {
      describe('when "trust proxy" is enabled', () => {
        it('should return an array of the specified addresses', () => new Promise(done => {
          var app = express();

          app.enable('trust proxy');

          app.use((req, res, next) => {
            res.send(req.ips);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-For', 'client, p1, p2')
          .expect('["client","p1","p2"]', done);
        } ) );

        it('should stop at first untrusted', () => new Promise(done => {
          var app = express();

          app.set('trust proxy', 2);

          app.use((req, res, next) => {
            res.send(req.ips);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-For', 'client, p1, p2')
          .expect('["p1","p2"]', done);
        } ) );
      })

      describe('when "trust proxy" is disabled', () => {
        it('should return an empty array', () => new Promise(done => {
          var app = express();

          app.use((req, res, next) => {
            res.send(req.ips);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-For', 'client, p1, p2')
          .expect('[]', done);
        } ) );
      })
    })

    describe('when X-Forwarded-For is not present', () => {
      it('should return []', () => new Promise(done => {
        var app = express();

        app.use((req, res, next) => {
          res.send(req.ips);
        });

        request(app)
        .get('/')
        .expect('[]', done);
      } ) );
    })
  })
})
