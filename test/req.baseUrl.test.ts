import { describe, it } from 'vitest';
import request from 'supertest';
import express, { Router } from '../src/express.js';

describe('req', () => {
  describe('.baseUrl', () => {
    it('should be empty for top-level route', () => new Promise(done => {
      var app = express()

      app.get('/:a', (req, res) => {
        res.end(req.baseUrl)
      })

      request(app)
      .get('/foo')
      .expect(200, '', done)
    } ) );

    it('should contain lower path', () => new Promise(done => {
      var app = express()
      var sub = Router()

      sub.get('/:b', (req, res) => {
        res.end(req.baseUrl)
      })
      app.use('/:a', sub)

      request(app)
      .get('/foo/bar')
      .expect(200, '/foo', done);
    } ) );

    it('should contain full lower path', () => new Promise(done => {
      var app = express()
      var sub1 = Router()
      var sub2 = Router()
      var sub3 = Router()

      sub3.get('/:d', (req, res) => {
        res.end(req.baseUrl)
      })
      sub2.use('/:c', sub3)
      sub1.use('/:b', sub2)
      app.use('/:a', sub1)

      request(app)
      .get('/foo/bar/baz/zed')
      .expect(200, '/foo/bar/baz', done);
    } ) );

    it('should travel through routers correctly', () => new Promise(done => {
      var urls = []
      var app = express()
      var sub1 = Router()
      var sub2 = Router()
      var sub3 = Router()

      sub3.get('/:d', (req, res, next) => {
        urls.push('0@' + req.baseUrl)
        next()
      })
      sub2.use('/:c', sub3)
      sub1.use('/', (req, res, next) => {
        urls.push('1@' + req.baseUrl)
        next()
      })
      sub1.use('/bar', sub2)
      sub1.use('/bar', (req, res, next) => {
        urls.push('2@' + req.baseUrl)
        next()
      })
      app.use((req, res, next) => {
        urls.push('3@' + req.baseUrl)
        next()
      })
      app.use('/:a', sub1)
      app.use((req, res, next) => {
        urls.push('4@' + req.baseUrl)
        res.end(urls.join(','))
      })

      request(app)
      .get('/foo/bar/baz/zed')
      .expect(200, '3@,1@/foo,0@/foo/bar/baz,2@/foo/bar,4@', done);
    } ) );
  })
})
