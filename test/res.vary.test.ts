import { describe, it } from 'vitest';
import request from 'supertest';
import { shouldNotHaveHeader } from './support/utils';
import express from '../index.cjs';

describe('res.vary()', () => {
  describe('with no arguments', () => {
    it('should not set Vary', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.vary();
        res.end();
      });

      request(app)
      .get('/')
      .expect(shouldNotHaveHeader('Vary'))
      .expect(200, done);
    } ) );
  })

  describe('with an empty array', () => {
    it('should not set Vary', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.vary([]);
        res.end();
      });

      request(app)
      .get('/')
      .expect(shouldNotHaveHeader('Vary'))
      .expect(200, done);
    } ) );
  })

  describe('with an array', () => {
    it('should set the values', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.vary(['Accept', 'Accept-Language', 'Accept-Encoding']);
        res.end();
      });

      request(app)
      .get('/')
      .expect('Vary', 'Accept, Accept-Language, Accept-Encoding')
      .expect(200, done);
    } ) );
  })

  describe('with a string', () => {
    it('should set the value', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.vary('Accept');
        res.end();
      });

      request(app)
      .get('/')
      .expect('Vary', 'Accept')
      .expect(200, done);
    } ) );
  })

  describe('when the value is present', () => {
    it('should not add it again', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.vary('Accept');
        res.vary('Accept-Encoding');
        res.vary('Accept-Encoding');
        res.vary('Accept-Encoding');
        res.vary('Accept');
        res.end();
      });

      request(app)
      .get('/')
      .expect('Vary', 'Accept, Accept-Encoding')
      .expect(200, done);
    } ) );
  })
})
