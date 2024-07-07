import { describe, it } from 'vitest';
import assert from 'assert';
import express from '../index.cjs';

describe('app', () => {
  describe('.locals', () => {
    it('should default object', () => {
      var app = express()
      assert.ok(app.locals)
      assert.strictEqual(typeof app.locals, 'object')
    })

    describe('.settings', () => {
      it('should contain app settings ', () => {
        var app = express()
        app.set('title', 'Express')
        assert.ok(app.locals.settings)
        assert.strictEqual(typeof app.locals.settings, 'object')
        assert.strictEqual(app.locals.settings, app.settings)
        assert.strictEqual(app.locals.settings.title, 'Express')
      })
    })
  })
})
