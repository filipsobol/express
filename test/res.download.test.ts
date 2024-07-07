import { describe, it } from 'vitest';
import after from 'after';
import assert from 'assert';
import asyncHooks from 'async_hooks';
import { Buffer } from 'safe-buffer';
import path from 'path';
import request from 'supertest';
import { shouldNotHaveHeader, shouldHaveBody } from './support/utils';
import express from '../index.cjs';

var FIXTURES_PATH = path.join(__dirname, 'fixtures')

describe('res', () => {
  describe('.download(path)', () => {
    it('should transfer as an attachment', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.download('test/fixtures/user.html');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="user.html"')
      .expect(200, '<p>{{user.name}}</p>', done)
    } ) );

    it('should accept range requests', () => new Promise(done => {
      var app = express()

      app.get('/', (req, res) => {
        res.download('test/fixtures/user.html')
      })

      request(app)
        .get('/')
        .expect('Accept-Ranges', 'bytes')
        .expect(200, '<p>{{user.name}}</p>', done)
    } ) );

    it('should respond with requested byte range', () => new Promise(done => {
      var app = express()

      app.get('/', (req, res) => {
        res.download('test/fixtures/user.html')
      })

      request(app)
        .get('/')
        .set('Range', 'bytes=0-2')
        .expect('Content-Range', 'bytes 0-2/20')
        .expect(206, '<p>', done)
    } ) );
  })

  describe('.download(path, filename)', () => {
    it('should provide an alternate filename', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.download('test/fixtures/user.html', 'document');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="document"')
      .expect(200, done)
    } ) );
  })

  describe('.download(path, fn)', () => {
    it('should invoke the callback', () => new Promise(done => {
      var app = express();
      var cb = after(2, done);

      app.use((req, res) => {
        res.download('test/fixtures/user.html', cb);
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="user.html"')
      .expect(200, cb);
    } ) );

    describe('async local storage', () => {
      it('should presist store', () => new Promise(done => {
        var app = express()
        var cb = after(2, done)
        var store = { foo: 'bar' }

        app.use((req, res, next) => {
          req.asyncLocalStorage = new asyncHooks.AsyncLocalStorage()
          req.asyncLocalStorage.run(store, next)
        })

        app.use((req, res) => {
          res.download('test/fixtures/name.txt', (err) => {
            if (err) return cb(err)

            var local = req.asyncLocalStorage.getStore()

            assert.strictEqual(local.foo, 'bar')
            cb()
          })
        })

        request(app)
          .get('/')
          .expect('Content-Type', 'text/plain; charset=UTF-8')
          .expect('Content-Disposition', 'attachment; filename="name.txt"')
          .expect(200, 'tobi', cb)
      } ) );

      it('should presist store on error', () => new Promise(done => {
        var app = express()
        var store = { foo: 'bar' }

        app.use((req, res, next) => {
          req.asyncLocalStorage = new asyncHooks.AsyncLocalStorage()
          req.asyncLocalStorage.run(store, next)
        })

        app.use((req, res) => {
          res.download('test/fixtures/does-not-exist', (err) => {
            var local = req.asyncLocalStorage.getStore()

            if (local) {
              res.setHeader('x-store-foo', String(local.foo))
            }

            res.send(err ? 'got ' + err.status + ' error' : 'no error')
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('x-store-foo', 'bar')
          .expect('got 404 error')
          .end(done)
      } ) );
    })
  })

  describe('.download(path, options)', () => {
    it('should allow options to res.sendFile()', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.download('test/fixtures/.name', {
          dotfiles: 'allow',
          maxAge: '4h'
        })
      })

      request(app)
        .get('/')
        .expect(200)
        .expect('Content-Disposition', 'attachment; filename=".name"')
        .expect('Cache-Control', 'public, max-age=14400')
        .expect(shouldHaveBody(Buffer.from('tobi')))
        .end(done)
    } ) );

    describe('with "headers" option', () => {
      it('should set headers on response', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('test/fixtures/user.html', {
            headers: {
              'X-Foo': 'Bar',
              'X-Bar': 'Foo'
            }
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('X-Foo', 'Bar')
          .expect('X-Bar', 'Foo')
          .end(done)
      } ) );

      it('should use last header when duplicated', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('test/fixtures/user.html', {
            headers: {
              'X-Foo': 'Bar',
              'x-foo': 'bar'
            }
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('X-Foo', 'bar')
          .end(done)
      } ) );

      it('should override Content-Type', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('test/fixtures/user.html', {
            headers: {
              'Content-Type': 'text/x-custom'
            }
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('Content-Type', 'text/x-custom')
          .end(done)
      } ) );

      it('should not set headers on 404', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('test/fixtures/does-not-exist', {
            headers: {
              'X-Foo': 'Bar'
            }
          })
        })

        request(app)
          .get('/')
          .expect(404)
          .expect(shouldNotHaveHeader('X-Foo'))
          .end(done)
      } ) );

      describe('when headers contains Content-Disposition', () => {
        it('should be ignored', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.download('test/fixtures/user.html', {
              headers: {
                'Content-Disposition': 'inline'
              }
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Content-Disposition', 'attachment; filename="user.html"')
            .end(done)
        } ) );

        it('should be ignored case-insensitively', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.download('test/fixtures/user.html', {
              headers: {
                'content-disposition': 'inline'
              }
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Content-Disposition', 'attachment; filename="user.html"')
            .end(done)
        } ) );
      })
    })

    describe('with "root" option', () => {
      it('should allow relative path', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('name.txt', {
            root: FIXTURES_PATH
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('Content-Disposition', 'attachment; filename="name.txt"')
          .expect(shouldHaveBody(Buffer.from('tobi')))
          .end(done)
      } ) );

      it('should allow up within root', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('fake/../name.txt', {
            root: FIXTURES_PATH
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('Content-Disposition', 'attachment; filename="name.txt"')
          .expect(shouldHaveBody(Buffer.from('tobi')))
          .end(done)
      } ) );

      it('should reject up outside root', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          var p = '..' + path.sep +
            path.relative(path.dirname(FIXTURES_PATH), path.join(FIXTURES_PATH, 'name.txt'))

          res.download(p, {
            root: FIXTURES_PATH
          })
        })

        request(app)
          .get('/')
          .expect(403)
          .expect(shouldNotHaveHeader('Content-Disposition'))
          .end(done)
      } ) );

      it('should reject reading outside root', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('../name.txt', {
            root: FIXTURES_PATH
          })
        })

        request(app)
          .get('/')
          .expect(403)
          .expect(shouldNotHaveHeader('Content-Disposition'))
          .end(done)
      } ) );
    })
  })

  describe('.download(path, filename, fn)', () => {
    it('should invoke the callback', () => new Promise(done => {
      var app = express();
      var cb = after(2, done);

      app.use((req, res) => {
        res.download('test/fixtures/user.html', 'document', cb)
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="document"')
      .expect(200, cb);
    } ) );
  })

  describe('.download(path, filename, options, fn)', () => {
    it('should invoke the callback', () => new Promise(done => {
      var app = express()
      var cb = after(2, done)
      var options = {}

      app.use((req, res) => {
        res.download('test/fixtures/user.html', 'document', options, cb)
      })

      request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect('Content-Disposition', 'attachment; filename="document"')
      .end(cb)
    } ) );

    it('should allow options to res.sendFile()', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.download('test/fixtures/.name', 'document', {
          dotfiles: 'allow',
          maxAge: '4h'
        })
      })

      request(app)
        .get('/')
        .expect(200)
        .expect('Content-Disposition', 'attachment; filename="document"')
        .expect('Cache-Control', 'public, max-age=14400')
        .expect(shouldHaveBody(Buffer.from('tobi')))
        .end(done)
    } ) );

    describe('when options.headers contains Content-Disposition', () => {
      it('should be ignored', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('test/fixtures/user.html', 'document', {
            headers: {
              'Content-Type': 'text/x-custom',
              'Content-Disposition': 'inline'
            }
          })
        })

        request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', 'text/x-custom')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .end(done)
      } ) );

      it('should be ignored case-insensitively', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.download('test/fixtures/user.html', 'document', {
            headers: {
              'content-type': 'text/x-custom',
              'content-disposition': 'inline'
            }
          })
        })

        request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', 'text/x-custom')
        .expect('Content-Disposition', 'attachment; filename="document"')
        .end(done)
      } ) );
    })
  })

  describe('on failure', () => {
    it('should invoke the callback', () => new Promise(done => {
      var app = express();

      app.use((req, res, next) => {
        res.download('test/fixtures/foobar.html', (err) => {
          if (!err) return next(new Error('expected error'));
          res.send('got ' + err.status + ' ' + err.code);
        });
      });

      request(app)
      .get('/')
      .expect(200, 'got 404 ENOENT', done);
    } ) );

    it('should remove Content-Disposition', () => new Promise(done => {
      var app = express()

      app.use((req, res, next) => {
        res.download('test/fixtures/foobar.html', (err) => {
          if (!err) return next(new Error('expected error'));
          res.end('failed');
        });
      });

      request(app)
        .get('/')
        .expect(shouldNotHaveHeader('Content-Disposition'))
        .expect(200, 'failed', done)
    } ) );
  })
})
