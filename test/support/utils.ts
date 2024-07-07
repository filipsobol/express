
/**
 * Module dependencies.
 * @private
 */

import assert from 'assert';
import { Buffer } from 'safe-buffer';

/**
 * Assert that a supertest response has a specific body.
 *
 * @param {Buffer} buf
 * @returns {function}
 */

export function shouldHaveBody (buf) {
  return (res) => {
    var body = !Buffer.isBuffer(res.body)
      ? Buffer.from(res.text)
      : res.body
    assert.ok(body, 'response has body')
    assert.strictEqual(body.toString('hex'), buf.toString('hex'))
  }
}

/**
 * Assert that a supertest response does have a header.
 *
 * @param {string} header Header name to check
 * @returns {function}
 */

export function shouldHaveHeader (header) {
  return (res) => {
    assert.ok((header.toLowerCase() in res.headers), 'should have header ' + header)
  }
}

/**
 * Assert that a supertest response does not have a body.
 *
 * @returns {function}
 */

export function shouldNotHaveBody () {
  return (res) => {
    assert.ok(res.text === '' || res.text === undefined)
  }
}

/**
 * Assert that a supertest response does not have a header.
 *
 * @param {string} header Header name to check
 * @returns {function}
 */
export function shouldNotHaveHeader(header) {
  return (res) => {
    assert.ok(!(header.toLowerCase() in res.headers), 'should not have header ' + header);
  };
}

function getMajorVersion(versionString) {
  return versionString.split('.')[0];
}

export function shouldSkipQuery(versionString) {
  // Skipping HTTP QUERY tests on Node 21, it is reported in http.METHODS on 21.7.2 but not supported
  // update this implementation to run on supported versions of 21 once they exist
  // upstream tracking https://github.com/nodejs/node/issues/51562
  // express tracking issue: https://github.com/expressjs/express/issues/5615
  return Number(getMajorVersion(versionString)) === 21
}

