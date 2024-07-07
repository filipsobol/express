import { describe, it } from 'vitest';
import after from 'after';
import asyncHooks from 'async_hooks';
import { Buffer } from 'safe-buffer';
import request from 'supertest';
import assert from 'assert';
import onFinished from 'on-finished';
import path from 'path';
import { shouldNotHaveHeader, shouldHaveBody, shouldHaveHeader } from './support/utils';
import express from '../index.cjs';

var fixtures = path.join(__dirname, 'fixtures');

describe('res', () => {
  describe('.sendFile(path)', () => {
    it('should error missing path', () => new Promise(done => {
      var app = createApp();

      request(app)
      .get('/')
      .expect(500, /path.*required/, done);
    } ) );

    it('should error for non-string path', () => new Promise(done => {
      var app = createApp(42)

      request(app)
      .get('/')
      .expect(500, /TypeError: path must be a string to res.sendFile/, done)
    } ) );

    it('should error for non-absolute path', () => new Promise(done => {
      var app = createApp('name.txt')

      request(app)
        .get('/')
        .expect(500, /TypeError: path must be absolute/, done)
    } ) );

    it('should transfer a file', () => new Promise(done => {
      var app = createApp(path.resolve(fixtures, 'name.txt'));

      request(app)
      .get('/')
      .expect(200, 'tobi', done);
    } ) );

    it('should transfer a file with special characters in string', () => new Promise(done => {
      var app = createApp(path.resolve(fixtures, '% of dogs.txt'));

      request(app)
      .get('/')
      .expect(200, '20%', done);
    } ) );

    it('should include ETag', () => new Promise(done => {
      var app = createApp(path.resolve(fixtures, 'name.txt'));

      request(app)
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi', done);
    } ) );

    it('should 304 when ETag matches', () => new Promise(done => {
      var app = createApp(path.resolve(fixtures, 'name.txt'));

      request(app)
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi', (err, res) => {
        if (err) return done(err);
        var etag = res.headers.etag;
        request(app)
        .get('/')
        .set('If-None-Match', etag)
        .expect(304, done);
      });
    } ) );

    it('should 404 for directory', () => new Promise(done => {
      var app = createApp(path.resolve(fixtures, 'blog'));

      request(app)
      .get('/')
      .expect(404, done);
    } ) );

    it('should 404 when not found', () => new Promise(done => {
      var app = createApp(path.resolve(fixtures, 'does-no-exist'));

      app.use((req, res) => {
        res.statusCode = 200;
        res.send('no!');
      });

      request(app)
      .get('/')
      .expect(404, done);
    } ) );

    it('should send cache-control by default', () => new Promise(done => {
      var app = createApp(path.resolve(__dirname, 'fixtures/name.txt'))

      request(app)
        .get('/')
        .expect('Cache-Control', 'public, max-age=0')
        .expect(200, done)
    } ) );

    it('should not serve dotfiles by default', () => new Promise(done => {
      var app = createApp(path.resolve(__dirname, 'fixtures/.name'))

      request(app)
        .get('/')
        .expect(404, done)
    } ) );

    it('should not override manual content-types', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.contentType('application/x-bogus');
        res.sendFile(path.resolve(fixtures, 'name.txt'));
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'application/x-bogus')
      .end(done);
    } ) );

    it('should not error if the client aborts', () => new Promise(done => {
      var app = express();
      var cb = after(2, done)
      var error = null

      app.use((req, res) => {
        setImmediate(() => {
          res.sendFile(path.resolve(fixtures, 'name.txt'));
          setTimeout(() => {
            cb(error)
          }, 10)
        })
        test.req.abort()
      });

      app.use((err, req, res, next) => {
        error = err
        next(err)
      });

      var server = app.listen()
      var test = request(server).get('/')
      test.end((err) => {
        assert.ok(err)
        server.close(cb)
      })
    } ) );
  })

  describe('.sendFile(path, fn)', () => {
    it('should invoke the callback when complete', () => new Promise(done => {
      var cb = after(2, done);
      var app = createApp(path.resolve(fixtures, 'name.txt'), cb);

      request(app)
      .get('/')
      .expect(200, cb);
    } ) );

    it('should invoke the callback when client aborts', () => new Promise(done => {
      var cb = after(2, done)
      var app = express();

      app.use((req, res) => {
        setImmediate(() => {
          res.sendFile(path.resolve(fixtures, 'name.txt'), (err) => {
            assert.ok(err)
            assert.strictEqual(err.code, 'ECONNABORTED')
            cb()
          });
        });
        test.req.abort()
      });

      var server = app.listen()
      var test = request(server).get('/')
      test.end((err) => {
        assert.ok(err)
        server.close(cb)
      })
    } ) );

    it('should invoke the callback when client already aborted', () => new Promise(done => {
      var cb = after(2, done)
      var app = express();

      app.use((req, res) => {
        onFinished(res, () => {
          res.sendFile(path.resolve(fixtures, 'name.txt'), (err) => {
            assert.ok(err)
            assert.strictEqual(err.code, 'ECONNABORTED')
            cb()
          });
        });
        test.req.abort()
      });

      var server = app.listen()
      var test = request(server).get('/')
      test.end((err) => {
        assert.ok(err)
        server.close(cb)
      })
    } ) );

    it('should invoke the callback without error when HEAD', () => new Promise(done => {
      var app = express();
      var cb = after(2, done);

      app.use((req, res) => {
        res.sendFile(path.resolve(fixtures, 'name.txt'), cb);
      });

      request(app)
      .head('/')
      .expect(200, cb);
    } ) );

    it('should invoke the callback without error when 304', () => new Promise(done => {
      var app = express();
      var cb = after(3, done);

      app.use((req, res) => {
        res.sendFile(path.resolve(fixtures, 'name.txt'), cb);
      });

      request(app)
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi', (err, res) => {
        if (err) return cb(err);
        var etag = res.headers.etag;
        request(app)
        .get('/')
        .set('If-None-Match', etag)
        .expect(304, cb);
      });
    } ) );

    it('should invoke the callback on 404', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendFile(path.resolve(fixtures, 'does-not-exist'), (err) => {
          res.send(err ? 'got ' + err.status + ' error' : 'no error')
        });
      });

      request(app)
        .get('/')
        .expect(200, 'got 404 error', done)
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
          res.sendFile(path.resolve(fixtures, 'name.txt'), (err) => {
            if (err) return cb(err)

            var local = req.asyncLocalStorage.getStore()

            assert.strictEqual(local.foo, 'bar')
            cb()
          })
        })

        request(app)
          .get('/')
          .expect('Content-Type', 'text/plain; charset=UTF-8')
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
          res.sendFile(path.resolve(fixtures, 'does-not-exist'), (err) => {
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

  describe('.sendFile(path, options)', () => {
    it('should pass options to send module', () => new Promise(done => {
      request(createApp(path.resolve(fixtures, 'name.txt'), { start: 0, end: 1 }))
      .get('/')
      .expect(200, 'to', done)
    } ) );

    describe('with "acceptRanges" option', () => {
      describe('when true', () => {
        it('should advertise byte range accepted', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'nums.txt'), {
              acceptRanges: true
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Accept-Ranges', 'bytes')
            .expect('123456789')
            .end(done)
        } ) );

        it('should respond to range request', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'nums.txt'), {
              acceptRanges: true
            })
          })

          request(app)
            .get('/')
            .set('Range', 'bytes=0-4')
            .expect(206, '12345', done)
        } ) );
      })

      describe('when false', () => {
        it('should not advertise accept-ranges', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'nums.txt'), {
              acceptRanges: false
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect(shouldNotHaveHeader('Accept-Ranges'))
            .end(done)
        } ) );

        it('should not honor range requests', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'nums.txt'), {
              acceptRanges: false
            })
          })

          request(app)
            .get('/')
            .set('Range', 'bytes=0-4')
            .expect(200, '123456789', done)
        } ) );
      })
    })

    describe('with "cacheControl" option', () => {
      describe('when true', () => {
        it('should send cache-control header', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              cacheControl: true
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', 'public, max-age=0')
            .end(done)
        } ) );
      })

      describe('when false', () => {
        it('should not send cache-control header', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              cacheControl: false
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect(shouldNotHaveHeader('Cache-Control'))
            .end(done)
        } ) );
      })
    })

    describe('with "dotfiles" option', () => {
      describe('when "allow"', () => {
        it('should allow dotfiles', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, '.name'), {
              dotfiles: 'allow'
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect(shouldHaveBody(Buffer.from('tobi')))
            .end(done)
        } ) );
      })

      describe('when "deny"', () => {
        it('should deny dotfiles', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, '.name'), {
              dotfiles: 'deny'
            })
          })

          request(app)
            .get('/')
            .expect(403)
            .expect(/Forbidden/)
            .end(done)
        } ) );
      })

      describe('when "ignore"', () => {
        it('should ignore dotfiles', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, '.name'), {
              dotfiles: 'ignore'
            })
          })

          request(app)
            .get('/')
            .expect(404)
            .expect(/Not Found/)
            .end(done)
        } ) );
      })
    })

    describe('with "headers" option', () => {
      it('should set headers on response', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile(path.resolve(fixtures, 'user.html'), {
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
          res.sendFile(path.resolve(fixtures, 'user.html'), {
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
          res.sendFile(path.resolve(fixtures, 'user.html'), {
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
          res.sendFile(path.resolve(fixtures, 'does-not-exist'), {
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
    })

    describe('with "immutable" option', () => {
      describe('when true', () => {
        it('should send cache-control header with immutable', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              immutable: true
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', 'public, max-age=0, immutable')
            .end(done)
        } ) );
      })

      describe('when false', () => {
        it('should not send cache-control header with immutable', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              immutable: false
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', 'public, max-age=0')
            .end(done)
        } ) );
      })
    })

    describe('with "lastModified" option', () => {
      describe('when true', () => {
        it('should send last-modified header', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              lastModified: true
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect(shouldHaveHeader('Last-Modified'))
            .end(done)
        } ) );

        it('should conditionally respond with if-modified-since', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              lastModified: true
            })
          })

          request(app)
            .get('/')
            .set('If-Modified-Since', (new Date(Date.now() + 99999).toUTCString()))
            .expect(304, done)
        } ) );
      })

      describe('when false', () => {
        it('should not have last-modified header', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              lastModified: false
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect(shouldNotHaveHeader('Last-Modified'))
            .end(done)
        } ) );

        it('should not honor if-modified-since', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              lastModified: false
            })
          })

          request(app)
            .get('/')
            .set('If-Modified-Since', (new Date(Date.now() + 99999).toUTCString()))
            .expect(200)
            .expect(shouldNotHaveHeader('Last-Modified'))
            .end(done)
        } ) );
      })
    })

    describe('with "maxAge" option', () => {
      it('should set cache-control max-age to milliseconds', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile(path.resolve(fixtures, 'user.html'), {
            maxAge: 20000
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('Cache-Control', 'public, max-age=20')
          .end(done)
      } ) );

      it('should cap cache-control max-age to 1 year', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile(path.resolve(fixtures, 'user.html'), {
            maxAge: 99999999999
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('Cache-Control', 'public, max-age=31536000')
          .end(done)
      } ) );

      it('should min cache-control max-age to 0', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile(path.resolve(fixtures, 'user.html'), {
            maxAge: -20000
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('Cache-Control', 'public, max-age=0')
          .end(done)
      } ) );

      it('should floor cache-control max-age', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile(path.resolve(fixtures, 'user.html'), {
            maxAge: 21911.23
          })
        })

        request(app)
          .get('/')
          .expect(200)
          .expect('Cache-Control', 'public, max-age=21')
          .end(done)
      } ) );

      describe('when cacheControl: false', () => {
        it('should not send cache-control', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              cacheControl: false,
              maxAge: 20000
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect(shouldNotHaveHeader('Cache-Control'))
            .end(done)
        } ) );
      })

      describe('when string', () => {
        it('should accept plain number as milliseconds', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              maxAge: '20000'
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', 'public, max-age=20')
            .end(done)
        } ) );

        it('should accept suffix "s" for seconds', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              maxAge: '20s'
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', 'public, max-age=20')
            .end(done)
        } ) );

        it('should accept suffix "m" for minutes', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              maxAge: '20m'
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', 'public, max-age=1200')
            .end(done)
        } ) );

        it('should accept suffix "d" for days', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendFile(path.resolve(fixtures, 'user.html'), {
              maxAge: '20d'
            })
          })

          request(app)
            .get('/')
            .expect(200)
            .expect('Cache-Control', 'public, max-age=1728000')
            .end(done)
        } ) );
      })
    })

    describe('with "root" option', () => {
      it('should allow relative path', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile('name.txt', {
            root: fixtures
          })
        })

        request(app)
          .get('/')
          .expect(200, 'tobi', done)
      } ) );

      it('should allow up within root', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile('fake/../name.txt', {
            root: fixtures
          })
        })

        request(app)
          .get('/')
          .expect(200, 'tobi', done)
      } ) );

      it('should reject up outside root', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile('..' + path.sep + path.relative(path.dirname(fixtures), path.join(fixtures, 'name.txt')), {
            root: fixtures
          })
        })

        request(app)
          .get('/')
          .expect(403, done)
      } ) );

      it('should reject reading outside root', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.sendFile('../name.txt', {
            root: fixtures
          })
        })

        request(app)
          .get('/')
          .expect(403, done)
      } ) );
    })
  })

  describe('.sendfile(path, fn)', () => {
    it('should invoke the callback when complete', () => new Promise(done => {
      var app = express();
      var cb = after(2, done);

      app.use((req, res) => {
        res.sendfile('test/fixtures/user.html', cb)
      });

      request(app)
      .get('/')
      .expect(200, cb);
    } ) );

    it('should utilize the same options as express.static()', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendfile('test/fixtures/user.html', { maxAge: 60000 });
      });

      request(app)
      .get('/')
      .expect('Cache-Control', 'public, max-age=60')
      .end(done);
    } ) );

    it('should invoke the callback when client aborts', () => new Promise(done => {
      var cb = after(2, done)
      var app = express();

      app.use((req, res) => {
        setImmediate(() => {
          res.sendfile('test/fixtures/name.txt', (err) => {
            assert.ok(err)
            assert.strictEqual(err.code, 'ECONNABORTED')
            cb()
          });
        });
        test.req.abort()
      });

      var server = app.listen()
      var test = request(server).get('/')
      test.end((err) => {
        assert.ok(err)
        server.close(cb)
      })
    } ) );

    it('should invoke the callback when client already aborted', () => new Promise(done => {
      var cb = after(2, done)
      var app = express();

      app.use((req, res) => {
        onFinished(res, () => {
          res.sendfile('test/fixtures/name.txt', (err) => {
            assert.ok(err)
            assert.strictEqual(err.code, 'ECONNABORTED')
            cb()
          });
        });
        test.req.abort()
      });

      var server = app.listen()
      var test = request(server).get('/')
      test.end((err) => {
        assert.ok(err)
        server.close(cb)
      })
    } ) );

    it('should invoke the callback without error when HEAD', () => new Promise(done => {
      var app = express();
      var cb = after(2, done);

      app.use((req, res) => {
        res.sendfile('test/fixtures/name.txt', cb);
      });

      request(app)
      .head('/')
      .expect(200, cb);
    } ) );

    it('should invoke the callback without error when 304', () => new Promise(done => {
      var app = express();
      var cb = after(3, done);

      app.use((req, res) => {
        res.sendfile('test/fixtures/name.txt', cb);
      });

      request(app)
      .get('/')
      .expect('ETag', /^(?:W\/)?"[^"]+"$/)
      .expect(200, 'tobi', (err, res) => {
        if (err) return cb(err);
        var etag = res.headers.etag;
        request(app)
        .get('/')
        .set('If-None-Match', etag)
        .expect(304, cb);
      });
    } ) );

    it('should invoke the callback on 404', () => new Promise(done => {
      var app = express();
      var calls = 0;

      app.use((req, res) => {
        res.sendfile('test/fixtures/nope.html', (err) => {
          assert.equal(calls++, 0);
          assert(!res.headersSent);
          res.send(err.message);
        });
      });

      request(app)
      .get('/')
      .expect(200, /^ENOENT.*?, stat/, done);
    } ) );

    it('should not override manual content-types', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.contentType('txt');
        res.sendfile('test/fixtures/user.html');
      });

      request(app)
      .get('/')
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .end(done);
    } ) );

    it('should invoke the callback on 403', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.sendfile('test/fixtures/foo/../user.html', (err) => {
          assert(!res.headersSent);
          res.send(err.message);
        });
      });

      request(app)
      .get('/')
      .expect('Forbidden')
      .expect(200, done);
    } ) );

    it('should invoke the callback on socket error', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.sendfile('test/fixtures/user.html', (err) => {
          assert.ok(err)
          assert.ok(!res.headersSent)
          assert.strictEqual(err.message, 'broken!')
          done();
        });

        req.socket.destroy(new Error('broken!'))
      });

      request(app)
      .get('/')
      .end(() => {});
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
          res.sendfile('test/fixtures/name.txt', (err) => {
            if (err) return cb(err)

            var local = req.asyncLocalStorage.getStore()

            assert.strictEqual(local.foo, 'bar')
            cb()
          })
        })

        request(app)
          .get('/')
          .expect('Content-Type', 'text/plain; charset=UTF-8')
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
          res.sendfile('test/fixtures/does-not-exist', (err) => {
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

  describe('.sendfile(path)', () => {
    it('should not serve dotfiles', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendfile('test/fixtures/.name');
      });

      request(app)
      .get('/')
      .expect(404, done);
    } ) );

    it('should accept dotfiles option', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendfile('test/fixtures/.name', { dotfiles: 'allow' });
      });

      request(app)
        .get('/')
        .expect(200)
        .expect(shouldHaveBody(Buffer.from('tobi')))
        .end(done)
    } ) );

    it('should accept headers option', () => new Promise(done => {
      var app = express();
      var headers = {
        'x-success': 'sent',
        'x-other': 'done'
      };

      app.use((req, res) => {
        res.sendfile('test/fixtures/user.html', { headers: headers });
      });

      request(app)
      .get('/')
      .expect('x-success', 'sent')
      .expect('x-other', 'done')
      .expect(200, done);
    } ) );

    it('should ignore headers option on 404', () => new Promise(done => {
      var app = express();
      var headers = { 'x-success': 'sent' };

      app.use((req, res) => {
        res.sendfile('test/fixtures/user.nothing', { headers: headers });
      });

      request(app)
      .get('/')
        .expect(shouldNotHaveHeader('X-Success'))
        .expect(404, done);
    } ) );

    it('should transfer a file', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendfile('test/fixtures/name.txt');
      });

      request(app)
      .get('/')
      .expect(200, 'tobi', done);
    } ) );

    it('should transfer a directory index file', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendfile('test/fixtures/blog/');
      });

      request(app)
      .get('/')
      .expect(200, '<b>index</b>', done);
    } ) );

    it('should 404 for directory without trailing slash', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendfile('test/fixtures/blog');
      });

      request(app)
      .get('/')
      .expect(404, done);
    } ) );

    it('should transfer a file with urlencoded name', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.sendfile('test/fixtures/%25%20of%20dogs.txt');
      });

      request(app)
      .get('/')
      .expect(200, '20%', done);
    } ) );

    it('should not error if the client aborts', () => new Promise(done => {
      var app = express();
      var cb = after(2, done)
      var error = null

      app.use((req, res) => {
        setImmediate(() => {
          res.sendfile(path.resolve(fixtures, 'name.txt'));
          setTimeout(() => {
            cb(error)
          }, 10)
        });
        test.req.abort()
      });

      app.use((err, req, res, next) => {
        error = err
        next(err)
      });

      var server = app.listen()
      var test = request(server).get('/')
      test.end((err) => {
        assert.ok(err)
        server.close(cb)
      })
    } ) );

    describe('with an absolute path', () => {
      it('should transfer the file', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.sendfile(path.join(__dirname, '/fixtures/user.html'))
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200, '<p>{{user.name}}</p>', done);
      } ) );
    })

    describe('with a relative path', () => {
      it('should transfer the file', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.sendfile('test/fixtures/user.html');
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200, '<p>{{user.name}}</p>', done);
      } ) );

      it('should serve relative to "root"', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.sendfile('user.html', { root: 'test/fixtures/' });
        });

        request(app)
        .get('/')
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .expect(200, '<p>{{user.name}}</p>', done);
      } ) );

      it('should consider ../ malicious when "root" is not set', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.sendfile('test/fixtures/foo/../user.html');
        });

        request(app)
        .get('/')
        .expect(403, done);
      } ) );

      it('should allow ../ when "root" is set', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.sendfile('foo/../user.html', { root: 'test/fixtures' });
        });

        request(app)
        .get('/')
        .expect(200, done);
      } ) );

      it('should disallow requesting out of "root"', () => new Promise(done => {
        var app = express();

        app.use((req, res) => {
          res.sendfile('foo/../../user.html', { root: 'test/fixtures' });
        });

        request(app)
        .get('/')
        .expect(403, done);
      } ) );

      it('should next(404) when not found', () => new Promise(done => {
        var app = express()
          , calls = 0;

        app.use((req, res) => {
          res.sendfile('user.html');
        });

        app.use((req, res) => {
          assert(0, 'this should not be called');
        });

        app.use((err, req, res, next) => {
          ++calls;
          next(err);
        });

        request(app)
          .get('/')
          .expect(404, (err) => {
            if (err) return done(err)
            assert.strictEqual(calls, 1)
            done()
          })
      } ) );

      describe('with non-GET', () => {
        it('should still serve', () => new Promise(done => {
          var app = express()

          app.use((req, res) => {
            res.sendfile(path.join(__dirname, '/fixtures/name.txt'))
          });

          request(app)
          .get('/')
          .expect('tobi', done);
        } ) );
      })
    })
  })

  describe('.sendfile(path, options)', () => {
    it('should pass options to send module', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.sendfile(path.resolve(fixtures, 'name.txt'), { start: 0, end: 1 })
      })

      request(app)
        .get('/')
        .expect(200, 'to', done)
    } ) );
  })
})

function createApp(path, options, fn) {
  var app = express();

  app.use((req, res) => {
    res.sendFile(path, options, fn);
  });

  return app;
}
