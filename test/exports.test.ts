import { describe, it } from 'vitest';
import assert from 'assert'
import supertest from 'supertest';
import express, {
  Router,
  json,
  raw,
  serveStatic,
  text,
  urlencoded,
  application,
  response,
  request
} from '../src/express.js';

describe('exports', () => {
  it('should expose Router', () => {
    assert.strictEqual(typeof Router, 'function')
  })

  it('should expose json middleware', () => {
    assert.equal(typeof json, 'function')
    assert.equal(json.length, 1)
  })

  it('should expose raw middleware', () => {
    assert.equal(typeof raw, 'function')
    assert.equal(raw.length, 1)
  })

  it('should expose static middleware', () => {
    assert.equal( typeof serveStatic, 'function')
    assert.equal( serveStatic.length, 2)
  })

  it('should expose text middleware', () => {
    assert.equal(typeof text, 'function')
    assert.equal(text.length, 1)
  })

  it('should expose urlencoded middleware', () => {
    assert.equal(typeof urlencoded, 'function')
    assert.equal(urlencoded.length, 1)
  })

  it('should expose the application prototype', () => {
    assert.strictEqual(typeof application, 'object')
    assert.strictEqual(typeof application.set, 'function')
  })

  it('should expose the request prototype', () => {
    assert.strictEqual(typeof request, 'object')
    assert.strictEqual(typeof request.accepts, 'function')
  })

  it('should expose the response prototype', () => {
    assert.strictEqual(typeof response, 'object')
    assert.strictEqual(typeof response.send, 'function')
  })

  it('should permit modifying the .application prototype', () => {
    application.foo = () => { return 'bar'; };
    assert.strictEqual(express().foo(), 'bar')
  })

  it('should permit modifying the .request prototype', () => new Promise(done => {
    request.foo = () => { return 'bar'; };
    var app = express();

    app.use((req, res, next) => {
      res.end(req.foo());
    });

    supertest(app)
    .get('/')
    .expect('bar', done);
  } ) );

  it('should permit modifying the .response prototype', () => new Promise(done => {
    response.foo = () => { this.send('bar'); };
    var app = express();

    app.use((req, res, next) => {
      res.foo();
    });

    supertest(app)
    .get('/')
    .expect('bar', done);
  } ) );
})
