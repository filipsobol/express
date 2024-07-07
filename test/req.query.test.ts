import { describe, it } from 'vitest';
import assert from 'assert';
import request from 'supertest';
import express from '../src/express.js';

describe('req', () => {
  describe('.query', () => {
    it('should default to {}', () => new Promise(done => {
      var app = createApp();

      request(app)
      .get('/')
      .expect(200, '{}', done);
    } ) );

    it('should default to parse complex keys', () => new Promise(done => {
      var app = createApp();

      request(app)
      .get('/?user[name]=tj')
      .expect(200, '{"user":{"name":"tj"}}', done);
    } ) );

    describe('when "query parser" is extended', () => {
      it('should parse complex keys', () => new Promise(done => {
        var app = createApp('extended');

        request(app)
        .get('/?foo[0][bar]=baz&foo[0][fizz]=buzz&foo[]=done!')
        .expect(200, '{"foo":[{"bar":"baz","fizz":"buzz"},"done!"]}', done);
      } ) );

      it('should parse parameters with dots', () => new Promise(done => {
        var app = createApp('extended');

        request(app)
        .get('/?user.name=tj')
        .expect(200, '{"user.name":"tj"}', done);
      } ) );
    });

    describe('when "query parser" is simple', () => {
      it('should not parse complex keys', () => new Promise(done => {
        var app = createApp('simple');

        request(app)
        .get('/?user%5Bname%5D=tj')
        .expect(200, '{"user[name]":"tj"}', done);
      } ) );
    });

    describe('when "query parser" is a function', () => {
      it('should parse using function', () => new Promise(done => {
        var app = createApp((str) => {
          return {'length': (str || '').length};
        });

        request(app)
        .get('/?user%5Bname%5D=tj')
        .expect(200, '{"length":17}', done);
      } ) );
    });

    describe('when "query parser" disabled', () => {
      it('should not parse query', () => new Promise(done => {
        var app = createApp(false);

        request(app)
        .get('/?user%5Bname%5D=tj')
        .expect(200, '{}', done);
      } ) );
    });

    describe('when "query parser" enabled', () => {
      it('should not parse complex keys', () => new Promise(done => {
        var app = createApp(true);

        request(app)
        .get('/?user%5Bname%5D=tj')
        .expect(200, '{"user[name]":"tj"}', done);
      } ) );
    });

    describe('when "query parser fn" is missing', () => {
      it('should act like "extended"', () => new Promise(done => {
        var app = express();

        delete app.settings['query parser'];
        delete app.settings['query parser fn'];

        app.use((req, res) => {
          res.send(req.query);
        });

        request(app)
        .get('/?user[name]=tj&user.name=tj')
        .expect(200, '{"user":{"name":"tj"},"user.name":"tj"}', done);
      } ) );
    });

    describe('when "query parser" an unknown value', () => {
      it('should throw', () => {
        assert.throws(createApp.bind(null, 'bogus'),
          /unknown value.*query parser/)
      });
    });
  })
})

function createApp(setting) {
  var app = express();

  if (setting !== undefined) {
    app.set('query parser', setting);
  }

  app.use((req, res) => {
    res.send(req.query);
  });

  return app;
}
