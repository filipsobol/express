import bodyParser from 'body-parser'
import { EventEmitter } from 'events';
import mixin from 'merge-descriptors';
import proto from './application.js';
import Route from './router/route.js';
import Router from './router/index.js';
import req from './request.js';
import res from './response.js';

/**
 * Create an express application.
 *
 * @return {Function}
 * @api public
 */

export default function createApplication() {
  var app = function(req, res, next) {
    app.handle(req, res, next);
  };

  mixin(app, EventEmitter.prototype, false);
  mixin(app, proto, false);

  // expose the prototype that will get set on requests
  app.request = Object.create(req, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  // expose the prototype that will get set on responses
  app.response = Object.create(res, {
    app: { configurable: true, enumerable: true, writable: true, value: app }
  })

  app.init();
  return app;
}

const { json, raw, text, urlencoded } = bodyParser;

/**
 * Expose the prototypes.
 */

export { default as query } from './middleware/query.js';

// TODO: Breaking change!!!
export { default as serveStatic } from 'serve-static';

export {
  proto as application,
  req as request,
  res as response,

  Route,
  Router,

  json,
  raw,
  text,
  urlencoded
}
