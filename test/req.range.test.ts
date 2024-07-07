import { describe, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.cjs';

describe('req', () => {
  describe('.range(size)', () => {
    it('should return parsed ranges', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.json(req.range(120))
      })

      request(app)
      .get('/')
      .set('Range', 'bytes=0-50,51-100')
      .expect(200, '[{"start":0,"end":50},{"start":51,"end":100}]', done)
    } ) );

    it('should cap to the given size', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.json(req.range(75))
      })

      request(app)
      .get('/')
      .set('Range', 'bytes=0-100')
      .expect(200, '[{"start":0,"end":74}]', done)
    } ) );

    it('should cap to the given size when open-ended', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.json(req.range(75))
      })

      request(app)
      .get('/')
      .set('Range', 'bytes=0-')
      .expect(200, '[{"start":0,"end":74}]', done)
    } ) );

    it('should have a .type', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.json(req.range(120).type)
      })

      request(app)
      .get('/')
      .set('Range', 'bytes=0-100')
      .expect(200, '"bytes"', done)
    } ) );

    it('should accept any type', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.json(req.range(120).type)
      })

      request(app)
      .get('/')
      .set('Range', 'users=0-2')
      .expect(200, '"users"', done)
    } ) );

    it('should return undefined if no range', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.send(String(req.range(120)))
      })

      request(app)
      .get('/')
      .expect(200, 'undefined', done)
    } ) );
  })

  describe('.range(size, options)', () => {
    describe('with "combine: true" option', () => {
      it('should return combined ranges', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.json(req.range(120, {
            combine: true
          }))
        })

        request(app)
        .get('/')
        .set('Range', 'bytes=0-50,51-100')
        .expect(200, '[{"start":0,"end":100}]', done)
      } ) );
    })
  })
})
