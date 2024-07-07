import express, { urlencoded, serveStatic } from '../../src/express.js';
import path from 'path';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import * as site from './site.js';
import * as post from './post.js';
import * as user from './user.js';

var app = express();

export default app;

// Config

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// TODO: ????
// if (!module.parent) {
//   app.use(logger('dev'));
// }

app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(urlencoded({ extended: true }))
app.use( serveStatic(path.join(__dirname, 'public')));

// General

app.get('/', site.index);

// User

app.get('/users', user.list);
app.all('/user/:id/:op?', user.load);
app.get('/user/:id', user.view);
app.get('/user/:id/view', user.view);
app.get('/user/:id/edit', user.edit);
app.put('/user/:id/edit', user.update);

// Posts

app.get('/posts', post.list);

// TODO: ????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
