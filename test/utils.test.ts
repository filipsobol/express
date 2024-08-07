import { describe, it } from 'vitest';
import assert from 'assert';
import { Buffer } from 'safe-buffer';
import { etag, setCharset, wetag, isAbsolute, flatten } from '../src/utils.js';

describe('etag(body, encoding)', () => {
  it('should support strings', () => {
    assert.strictEqual(etag('express!'),
      '"8-O2uVAFaQ1rZvlKLT14RnuvjPIdg"')
  })

  it('should support utf8 strings', () => {
    assert.strictEqual(etag('express❤', 'utf8'),
      '"a-JBiXf7GyzxwcrxY4hVXUwa7tmks"')
  })

  it('should support buffer', () => {
    assert.strictEqual(etag(Buffer.from('express!')),
      '"8-O2uVAFaQ1rZvlKLT14RnuvjPIdg"')
  })

  it('should support empty string', () => {
    assert.strictEqual(etag(''),
      '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"')
  })
})

describe('setCharset(type, charset)', () => {
  it('should do anything without type', () => {
    assert.strictEqual(setCharset(), undefined);
  });

  it('should return type if not given charset', () => {
    assert.strictEqual(setCharset('text/html'), 'text/html');
  });

  it('should keep charset if not given charset', () => {
    assert.strictEqual(setCharset('text/html; charset=utf-8'), 'text/html; charset=utf-8');
  });

  it('should set charset', () => {
    assert.strictEqual(setCharset('text/html', 'utf-8'), 'text/html; charset=utf-8');
  });

  it('should override charset', () => {
    assert.strictEqual(setCharset('text/html; charset=iso-8859-1', 'utf-8'), 'text/html; charset=utf-8');
  });
});

describe('wetag(body, encoding)', () => {
  it('should support strings', () => {
    assert.strictEqual(wetag('express!'),
      'W/"8-O2uVAFaQ1rZvlKLT14RnuvjPIdg"')
  })

  it('should support utf8 strings', () => {
    assert.strictEqual(wetag('express❤', 'utf8'),
      'W/"a-JBiXf7GyzxwcrxY4hVXUwa7tmks"')
  })

  it('should support buffer', () => {
    assert.strictEqual(wetag(Buffer.from('express!')),
      'W/"8-O2uVAFaQ1rZvlKLT14RnuvjPIdg"')
  })

  it('should support empty string', () => {
    assert.strictEqual(wetag(''),
      'W/"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"')
  })
})

describe('isAbsolute()', () => {
  it('should support windows', () => {
    assert(isAbsolute('c:\\'));
    assert(isAbsolute('c:/'));
    assert(!isAbsolute(':\\'));
  })

  it('should support windows unc', () => {
    assert(isAbsolute('\\\\foo\\bar'))
  })

  it('should support unices', () => {
    assert(isAbsolute('/foo/bar'));
    assert(!isAbsolute('foo/bar'));
  })
})

describe('flatten(arr)', () => {
  it('should flatten an array', () => {
    var arr = ['one', ['two', ['three', 'four'], 'five']];
    var flat = flatten(arr)

    assert.strictEqual(flat.length, 5)
    assert.strictEqual(flat[0], 'one')
    assert.strictEqual(flat[1], 'two')
    assert.strictEqual(flat[2], 'three')
    assert.strictEqual(flat[3], 'four')
    assert.strictEqual(flat[4], 'five')
    assert.ok(flat.every((v) => { return typeof v === 'string' }))
  })
})
