import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('req', () => {
  describe('.ip', () => {
    describe('when X-Forwarded-For is present', () => {
      describe('when "trust proxy" is enabled', () => {
        it('should return the client addr', () => new Promise(done => {
          var app = express();

          app.enable('trust proxy');

          app.use((req, res, next) => {
            res.send(req.ip);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-For', 'client, p1, p2')
          .expect('client', done);
        } ) );

        it('should return the addr after trusted proxy based on count', () => new Promise(done => {
          var app = express();

          app.set('trust proxy', 2);

          app.use((req, res, next) => {
            res.send(req.ip);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-For', 'client, p1, p2')
          .expect('p1', done);
        } ) );

        it('should return the addr after trusted proxy based on list', () => new Promise(done => {
          var app = express()

          app.set('trust proxy', '10.0.0.1, 10.0.0.2, 127.0.0.1, ::1')

          app.get('/', (req, res) => {
            res.send(req.ip)
          })

          request(app)
            .get('/')
            .set('X-Forwarded-For', '10.0.0.2, 10.0.0.3, 10.0.0.1', '10.0.0.4')
            .expect('10.0.0.3', done)
        } ) );

        it('should return the addr after trusted proxy, from sub app', () => new Promise(done => {
          var app = express();
          var sub = express();

          app.set('trust proxy', 2);
          app.use(sub);

          sub.use((req, res, next) => {
            res.send(req.ip);
          });

          request(app)
          .get('/')
          .set('X-Forwarded-For', 'client, p1, p2')
          .expect(200, 'p1', done);
        } ) );
      })

      describe('when "trust proxy" is disabled', () => {
        it('should return the remote address', () => new Promise(done => {
          var app = express();

          app.use((req, res, next) => {
            res.send(req.ip);
          });

          var test = request(app).get('/')
          test.set('X-Forwarded-For', 'client, p1, p2')
          test.expect(200, getExpectedClientAddress(test._server), done);
        } ) );
      })
    })

    describe('when X-Forwarded-For is not present', () => {
      it('should return the remote address', () => new Promise(done => {
        var app = express();

        app.enable('trust proxy');

        app.use((req, res, next) => {
          res.send(req.ip);
        });

        var test = request(app).get('/')
        test.expect(200, getExpectedClientAddress(test._server), done)
      } ) );
    })
  })
})

/**
 * Get the local client address depending on AF_NET of server
 */

function getExpectedClientAddress(server) {
  return server.address().address === '::'
    ? '::ffff:127.0.0.1'
    : '127.0.0.1';
}
