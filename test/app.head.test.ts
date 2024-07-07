import { describe, it } from 'vitest';
import request from 'supertest';
import assert from 'assert';
import express from '../src/express.cjs';

describe('HEAD', () => {
  it( 'should default to GET', () => new Promise(done => {
    const app = express();

    app.get('/tobi', (req, res) =>{
      // send() detects HEAD
      res.send('tobi');
    });

    request(app)
    .head('/tobi')
    .expect(200, done);
  }));

  it( 'should output the same headers as GET requests', () => new Promise( done => {
    const app = express();

    app.get('/tobi', (req, res) => {
      // send() detects HEAD
      res.send('tobi');
    });

    request(app)
    .head('/tobi')
    .expect(200, (err, res) =>{
      if (err) return done(err);
      var headers = res.headers;
      request(app)
      .get('/tobi')
      .expect(200, (err, res) =>{
        if (err) return done(err);
        delete headers.date;
        delete res.headers.date;
        assert.deepEqual(res.headers, headers);
        done();
      });
    });
  }));
})

describe('app.head()', () => {
  it( 'should override', () => new Promise(done => {
    var app = express()

    app.head('/tobi', (req, res) => {
      res.header('x-method', 'head')
      res.end()
    });

    app.get('/tobi', (req, res) => {
      res.header('x-method', 'get')
      res.send('tobi');
    });

    request(app)
      .head('/tobi')
      .expect('x-method', 'head')
      .expect(200, done)
  }));
})
