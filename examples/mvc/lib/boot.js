import path from 'path';
import express from '../../../src/express.cjs';

import * as mainController from '../controllers/main/index.js';
import * as petController from '../controllers/pet/index.js';
import * as userController from '../controllers/user/index.js';
import * as userPetController from '../controllers/user-pet/index.js';

const controllers = [
  [ mainController, 'main' ],
  [ petController, 'pet' ],
  [ userController, 'user' ],
  [ userPetController, 'user-pet' ],
];

export default function(parent, options){
  var verbose = options.verbose;

  controllers.forEach(([ controller, name ]) => {
    verbose && console.log( '\n   %s:', name );

    var name = controller.name || name;
    var prefix = controller.prefix || '';
    var app = express();
    var handler;
    var method;
    var url;

    // allow specifying the view engine
    if (controller.engine) app.set('view engine', controller.engine);
    app.set('views', path.join(__dirname, '..', 'controllers', name, 'views'));

    // generate routes based
    // on the exported methods
    for (var key in controller) {
      // "reserved" exports
      if (~['name', 'prefix', 'engine', 'before'].indexOf(key)) continue;
      // route exports
      switch (key) {
        case 'show':
          method = 'get';
          url = '/' + name + '/:' + name + '_id';
          break;
        case 'list':
          method = 'get';
          url = '/' + name + 's';
          break;
        case 'edit':
          method = 'get';
          url = '/' + name + '/:' + name + '_id/edit';
          break;
        case 'update':
          method = 'put';
          url = '/' + name + '/:' + name + '_id';
          break;
        case 'create':
          method = 'post';
          url = '/' + name;
          break;
        case 'index':
          method = 'get';
          url = '/';
          break;
        default:
          /* istanbul ignore next */
          throw new Error('unrecognized route: ' + name + '.' + key);
      }

      // setup
      handler = controller[key];
      url = prefix + url;

      // before middleware support
      if (controller.before) {
        app[method](url, controller.before, handler);
        verbose && console.log('     %s %s -> before -> %s', method.toUpperCase(), url, key);
      } else {
        app[method](url, handler);
        verbose && console.log('     %s %s -> %s', method.toUpperCase(), url, key);
      }
    }

    // mount the app
    parent.use(app);
  });
};
