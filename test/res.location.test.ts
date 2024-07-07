import { describe, it } from 'vitest';
import assert from 'assert';
import url from 'url';
import request from 'supertest';
import express from '../index.cjs';

describe('res', () => {
  describe('.location(url)', () => {
    it('should set the header', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.location('http://google.com/').end();
      });

      request(app)
      .get('/')
      .expect('Location', 'http://google.com/')
      .expect(200, done)
    } ) );

    it('should preserve trailing slashes when not present', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.location('http://google.com').end();
      });

      request(app)
      .get('/')
      .expect('Location', 'http://google.com')
      .expect(200, done)
    } ) );

    it('should encode "url"', () => new Promise(done => {
      var app = express()

      app.use((req, res) => {
        res.location('https://google.com?q=\u2603 §10').end()
      })

      request(app)
      .get('/')
      .expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
      .expect(200, done)
    } ) );

    describe('when url is "back"', () => {
      it('should set location from "Referer" header', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.location('back').end()
        })

        request(app)
        .get('/')
        .set('Referer', '/some/page.html')
        .expect('Location', '/some/page.html')
        .expect(200, done)
      } ) );

      it('should set location from "Referrer" header', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.location('back').end()
        })

        request(app)
        .get('/')
        .set('Referrer', '/some/page.html')
        .expect('Location', '/some/page.html')
        .expect(200, done)
      } ) );

      it('should prefer "Referrer" header', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.location('back').end()
        })

        request(app)
        .get('/')
        .set('Referer', '/some/page1.html')
        .set('Referrer', '/some/page2.html')
        .expect('Location', '/some/page2.html')
        .expect(200, done)
      } ) );

      it('should set the header to "/" without referrer', () => new Promise(done => {
        var app = express()

        app.use((req, res) => {
          res.location('back').end()
        })

        request(app)
        .get('/')
        .expect('Location', '/')
        .expect(200, done)
      } ) );
    })

    it('should encode data uri', () => new Promise(done => {
      var app = express()
      app.use((req, res) => {
        res.location('data:text/javascript,export default () => { }').end();
      });

      request(app)
        .get('/')
        .expect('Location', 'data:text/javascript,export%20default%20()%20=%3E%20%7B%20%7D')
        .expect(200, done)
    } ) );

    it('should consistently handle non-string input: boolean', () => new Promise(done => {
      var app = express()
      app.use((req, res) => {
        res.location(true).end();
      });

      request(app)
        .get('/')
        .expect('Location', 'true')
        .expect(200, done)
    } ) );

    it('should consistently handle non-string inputs: object', () => new Promise(done => {
      var app = express()
      app.use((req, res) => {
        res.location({}).end();
      });

      request(app)
        .get('/')
        .expect('Location', '[object%20Object]')
        .expect(200, done)
    } ) );

    it('should consistently handle non-string inputs: array', () => new Promise(done => {
      var app = express()
      app.use((req, res) => {
        res.location([]).end();
      });

      request(app)
        .get('/')
        .expect('Location', '')
        .expect(200, done)
    } ) );

    it('should consistently handle empty string input', () => new Promise(done => {
      var app = express()
      app.use((req, res) => {
        res.location('').end();
      });

      request(app)
        .get('/')
        .expect('Location', '')
        .expect(200, done)
    } ) );


    it('should accept an instance of URL', () => new Promise(done => {
      var app = express();

      app.use((req, res) => {
        res.location(new URL('http://google.com/')).end();
      });

      request(app)
        .get('/')
        .expect('Location', 'http://google.com/')
        .expect(200, done);
    } ) );
  })

  describe('location header encoding', () => {
    function createRedirectServerForDomain (domain) {
      var app = express();
      app.use((req, res) => {
        var host = url.parse(req.query.q, false, true).host;
        // This is here to show a basic check one might do which
        // would pass but then the location header would still be bad
        if (host !== domain) {
          res.status(400).end('Bad host: ' + host + ' !== ' + domain);
        }
        res.location(req.query.q).end();
      });
      return app;
    }

    function testRequestedRedirect (app, inputUrl, expected, expectedHost, done) {
      return request(app)
        // Encode uri because old supertest does not and is required
        // to test older node versions. New supertest doesn't re-encode
        // so this works in both.
        .get('/?q=' + encodeURIComponent(inputUrl))
        .expect('') // No body.
        .expect(200)
        .expect('Location', expected)
        .end((err, res) => {
          if (err) {
            console.log('headers:', res.headers)
            console.error('error', res.error, err);
            return done(err, res);
          }

          // Parse the hosts from the input URL and the Location header
          var inputHost = url.parse(inputUrl, false, true).host;
          var locationHost = url.parse(res.headers['location'], false, true).host;

          assert.strictEqual(locationHost, expectedHost);

          // Assert that the hosts are the same
          if (inputHost !== locationHost) {
            return done(new Error('Hosts do not match: ' + inputHost + " !== " +  locationHost));
          }

          return done(null, res);
        });
    }

    it('should not touch already-encoded sequences in "url"', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com?q=%A710',
        'https://google.com?q=%A710',
        'google.com',
        done
      );
    } ) );

    it('should consistently handle relative urls', () => new Promise(done => {
      var app = createRedirectServerForDomain(null);
      testRequestedRedirect(
        app,
        '/foo/bar',
        '/foo/bar',
        null,
        done
      );
    } ) );

    it('should not encode urls in such a way that they can bypass redirect allow lists', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'http://google.com\\@apple.com',
        'http://google.com\\@apple.com',
        'google.com',
        done
      );
    } ) );

    it('should not be case sensitive', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'HTTP://google.com\\@apple.com',
        'HTTP://google.com\\@apple.com',
        'google.com',
        done
      );
    } ) );

    it('should work with https', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com\\@apple.com',
        'https://google.com\\@apple.com',
        'google.com',
        done
      );
    } ) );

    it('should correctly encode schemaless paths', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        '//google.com\\@apple.com/',
        '//google.com\\@apple.com/',
        'google.com',
        done
      );
    } ) );

    it('should keep backslashes in the path', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com/foo\\bar\\baz',
        'https://google.com/foo\\bar\\baz',
        'google.com',
        done
      );
    } ) );

    it('should escape header splitting for old node versions', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'http://google.com\\@apple.com/%0d%0afoo:%20bar',
        'http://google.com\\@apple.com/%0d%0afoo:%20bar',
        'google.com',
        done
      );
    } ) );

    it('should encode unicode correctly', () => new Promise(done => {
      var app = createRedirectServerForDomain(null);
      testRequestedRedirect(
        app,
        '/%e2%98%83',
        '/%e2%98%83',
        null,
        done
      );
    } ) );

    it('should encode unicode correctly even with a bad host', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'http://google.com\\@apple.com/%e2%98%83',
        'http://google.com\\@apple.com/%e2%98%83',
        'google.com',
        done
      );
    } ) );

    it('should work correctly despite using deprecated url.parse', () => new Promise(done => {
      var app = createRedirectServerForDomain('google.com');
      testRequestedRedirect(
        app,
        'https://google.com\'.bb.com/1.html',
        'https://google.com\'.bb.com/1.html',
        'google.com',
        done
      );
    } ) );

    it('should encode file uri path', () => new Promise(done => {
      var app = createRedirectServerForDomain('');
      testRequestedRedirect(
        app,
        'file:///etc\\passwd',
        'file:///etc\\passwd',
        '',
        done
      );
    } ) );
  });
})
