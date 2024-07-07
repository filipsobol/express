import { describe, it } from 'vitest';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import express from '../src/express.cjs';

function render(path, options, fn) {
  fs.readFile(path, 'utf8', (err, str) => {
    if (err) return fn(err);
    str = str.replace('{{user.name}}', options.user.name);
    fn(null, str);
  });
}

describe('app', () => {
  describe('.engine(ext, fn)', () => {
    it( 'should map a template engine', () => new Promise(done => {
      var app = express();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('.html', render);
      app.locals.user = { name: 'tobi' };

      app.render('user.html', (err, str) => {
        if (err) return done(err);
        assert.strictEqual(str, '<p>tobi</p>')
        done();
      })
    }));

    it('should throw when the callback is missing', () => {
      var app = express();
      assert.throws(() => {
        app.engine('.html', null);
      }, /callback function required/)
    })

    it( 'should work without leading "."', () => new Promise(done => {
      var app = express();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('html', render);
      app.locals.user = { name: 'tobi' };

      app.render('user.html', (err, str) => {
        if (err) return done(err);
        assert.strictEqual(str, '<p>tobi</p>')
        done();
      })
    }));

    it( 'should work "view engine" setting', () => new Promise(done => {
      var app = express();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('html', render);
      app.set('view engine', 'html');
      app.locals.user = { name: 'tobi' };

      app.render('user', (err, str) => {
        if (err) return done(err);
        assert.strictEqual(str, '<p>tobi</p>')
        done();
      })
    }));

    it('should work "view engine" with leading "."', () => new Promise(done => {
      var app = express();

      app.set('views', path.join(__dirname, 'fixtures'))
      app.engine('.html', render);
      app.set('view engine', '.html');
      app.locals.user = { name: 'tobi' };

      app.render('user', (err, str) => {
        if (err) return done(err);
        assert.strictEqual(str, '<p>tobi</p>')
        done();
      })
    }))
  })
})
