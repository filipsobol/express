import { describe, it } from 'vitest';
import after from 'after';
import request from 'supertest';
import assert from 'assert';
import express, { Router } from '../src/express.js'

var app1 = express();

app1.use((req, res, next) => {
  res.format({
    'text/plain': () => {
      res.send('hey');
    },

    'text/html': () => {
      res.send('<p>hey</p>');
    },

    'application/json': (a, b, c) => {
      assert(req === a)
      assert(res === b)
      assert(next === c)
      res.send({ message: 'hey' });
    }
  });
});

app1.use((err, req, res, next) => {
  if (!err.types) throw err;
  res.send(err.status, 'Supports: ' + err.types.join(', '));
})

var app2 = express();

app2.use((req, res, next) => {
  res.format({
    text: () => { res.send('hey') },
    html: () => { res.send('<p>hey</p>') },
    json: () => { res.send({ message: 'hey' }) }
  });
});

app2.use((err, req, res, next) => {
  res.send(err.status, 'Supports: ' + err.types.join(', '));
})

var app3 = express();

app3.use((req, res, next) => {
  res.format({
    text: () => { res.send('hey') },
    default: (a, b, c) => {
      assert(req === a)
      assert(res === b)
      assert(next === c)
      res.send('default')
    }
  })
});

var app4 = express();

app4.get('/', (req, res) => {
  res.format({
    text: () => { res.send('hey') },
    html: () => { res.send('<p>hey</p>') },
    json: () => { res.send({ message: 'hey' }) }
  });
});

app4.use((err, req, res, next) => {
  res.send(err.status, 'Supports: ' + err.types.join(', '));
})

var app5 = express();

app5.use((req, res, next) => {
  res.format({
    default: () => { res.send('hey') }
  });
});

describe('res', () => {
  describe('.format(obj)', () => {
    describe('with canonicalized mime types', () => {
      test(app1);
    })

    describe('with extnames', () => {
      test(app2);
    })

    describe('with parameters', () => {
      var app = express();

      app.use((req, res, next) => {
        res.format({
          'text/plain; charset=utf-8': () => { res.send('hey') },
          'text/html; foo=bar; bar=baz': () => { res.send('<p>hey</p>') },
          'application/json; q=0.5': () => { res.send({ message: 'hey' }) }
        });
      });

      app.use((err, req, res, next) => {
        res.send(err.status, 'Supports: ' + err.types.join(', '));
      });

      test(app);
    })

    describe('given .default', () => {
      it('should be invoked instead of auto-responding', () => new Promise(done => {
        request(app3)
        .get('/')
        .set('Accept', 'text/html')
        .expect('default', done);
      } ) );

      it('should work when only .default is provided', () => new Promise(done => {
        request(app5)
        .get('/')
        .set('Accept', '*/*')
        .expect('hey', done);
      } ) );

      it('should be able to invoke other formatter', () => new Promise(done => {
        var app = express()

        app.use((req, res, next) => {
          res.format({
            json: () => { res.send('json') },
            default: () => {
              res.header('x-default', '1')
              this.json()
            }
          })
        })

        request(app)
          .get('/')
          .set('Accept', 'text/plain')
          .expect(200)
          .expect('x-default', '1')
          .expect('json')
          .end(done)
      } ) );
    })

    describe('in router', () => {
      test(app4);
    })

    describe('in router', () => {
      var app = express();
      var router = Router();

      router.get('/', (req, res) => {
        res.format({
          text: () => { res.send('hey') },
          html: () => { res.send('<p>hey</p>') },
          json: () => { res.send({ message: 'hey' }) }
        });
      });

      router.use((err, req, res, next) => {
        res.send(err.status, 'Supports: ' + err.types.join(', '));
      })

      app.use(router)

      test(app)
    })
  })
})

function test(app) {
  it('should utilize qvalues in negotiation', () => new Promise(done => {
    request(app)
    .get('/')
    .set('Accept', 'text/html; q=.5, application/json, */*; q=.1')
    .expect({"message":"hey"}, done);
  } ) );

  it('should allow wildcard type/subtypes', () => new Promise(done => {
    request(app)
    .get('/')
    .set('Accept', 'text/html; q=.5, application/*, */*; q=.1')
    .expect({"message":"hey"}, done);
  } ) );

  it('should default the Content-Type', () => new Promise(done => {
    request(app)
    .get('/')
    .set('Accept', 'text/html; q=.5, text/plain')
    .expect('Content-Type', 'text/plain; charset=utf-8')
    .expect('hey', done);
  } ) );

  it('should set the correct charset for the Content-Type', () => new Promise(done => {
    var cb = after(3, done)

    request(app)
    .get('/')
    .set('Accept', 'text/html')
    .expect('Content-Type', 'text/html; charset=utf-8', cb)

    request(app)
    .get('/')
    .set('Accept', 'text/plain')
    .expect('Content-Type', 'text/plain; charset=utf-8', cb)

    request(app)
    .get('/')
    .set('Accept', 'application/json')
    .expect('Content-Type', 'application/json; charset=utf-8', cb)
  } ) );

  it('should Vary: Accept', () => new Promise(done => {
    request(app)
    .get('/')
    .set('Accept', 'text/html; q=.5, text/plain')
    .expect('Vary', 'Accept', done);
  } ) );

  describe('when Accept is not present', () => {
    it('should invoke the first callback', () => new Promise(done => {
      request(app)
      .get('/')
      .expect('hey', done);
    } ) );
  })

  describe('when no match is made', () => {
    it('should should respond with 406 not acceptable', () => new Promise(done => {
      request(app)
      .get('/')
      .set('Accept', 'foo/bar')
      .expect('Supports: text/plain, text/html, application/json')
      .expect(406, done)
    } ) );
  })
}
