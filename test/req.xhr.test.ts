import { describe, beforeEach, it } from 'vitest';
import request from 'supertest';
import express from '../src/express.js';

describe('req', () => {
  describe('.xhr', () => {
    beforeEach(() => {
      this.app = express()
      this.app.get('/', (req, res) => {
        res.send(req.xhr)
      })
    })

    it('should return true when X-Requested-With is xmlhttprequest', () => new Promise(done => {
      request(this.app)
        .get('/')
        .set('X-Requested-With', 'xmlhttprequest')
        .expect(200, 'true', done)
    } ) );

    it('should case-insensitive', () => new Promise(done => {
      request(this.app)
        .get('/')
        .set('X-Requested-With', 'XMLHttpRequest')
        .expect(200, 'true', done)
    } ) );

    it('should return false otherwise', () => new Promise(done => {
      request(this.app)
        .get('/')
        .set('X-Requested-With', 'blahblah')
        .expect(200, 'false', done)
    } ) );

    it('should return false when not present', () => new Promise(done => {
      request(this.app)
        .get('/')
        .expect(200, 'false', done)
    } ) );
  })
})
