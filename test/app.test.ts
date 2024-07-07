import { describe, it, beforeEach, afterEach } from 'vitest';
import assert from 'assert';
import request from 'supertest';
import express from '../src/express.cjs';

describe('app', () => {
  it('should inherit from event emitter', () => new Promise((done) =>{
    var app = express();
    app.on('foo', done);
    app.emit('foo');
  }));

  it('should be callable', () => {
    var app = express();
    assert.equal(typeof app, 'function');
  })

  it( 'should 404 without routes', () => new Promise( ( done ) => {
    request(express())
    .get('/')
    .expect(404, done);
  }));
})

describe('app.parent', () => {
  it('should return the parent when mounted', () => {
    var app = express()
      , blog = express()
      , blogAdmin = express();

    app.use('/blog', blog);
    blog.use('/admin', blogAdmin);

    assert(!app.parent, 'app.parent');
    assert.strictEqual(blog.parent, app)
    assert.strictEqual(blogAdmin.parent, blog)
  })
})

describe('app.mountpath', () => {
  it('should return the mounted path', () => {
    var admin = express();
    var app = express();
    var blog = express();
    var fallback = express();

    app.use('/blog', blog);
    app.use(fallback);
    blog.use('/admin', admin);

    assert.strictEqual(admin.mountpath, '/admin')
    assert.strictEqual(app.mountpath, '/')
    assert.strictEqual(blog.mountpath, '/blog')
    assert.strictEqual(fallback.mountpath, '/')
  })
})

describe('app.router', () => {
  it( 'should throw with notice', () => new Promise( ( done ) => {
    var app = express()

    try {
      app.router;
    } catch(err) {
      done();
    }
  }));
})

describe('app.path()', () => {
  it('should return the canonical', () => {
    var app = express()
      , blog = express()
      , blogAdmin = express();

    app.use('/blog', blog);
    blog.use('/admin', blogAdmin);

    assert.strictEqual(app.path(), '')
    assert.strictEqual(blog.path(), '/blog')
    assert.strictEqual(blogAdmin.path(), '/blog/admin')
  })
})

describe('in development', () => {
  let env;

  beforeEach(() => {
    env = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = env
  })

  it('should disable "view cache"', () => {
    var app = express();
    assert.ok(!app.enabled('view cache'))
  })
})

describe('in production', () => {
  let env;

  beforeEach(() => {
    env = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
  })

  afterEach(() => {
    process.env.NODE_ENV = env
  })

  it('should enable "view cache"', () => {
    var app = express();
    assert.ok(app.enabled('view cache'))
  })
})

describe('without NODE_ENV', () => {
  let env;

  beforeEach(() => {
    env = process.env.NODE_ENV
    process.env.NODE_ENV = ''
  })

  afterEach(() => {
    process.env.NODE_ENV = env
  })

  it('should default to development', () => {
    var app = express();
    assert.strictEqual(app.get('env'), 'development')
  })
})
