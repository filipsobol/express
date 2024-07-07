import cookieSession from 'cookie-session';
import express from '../../src/express.js';

const app = express();

export default app;

// add req.session cookie support
app.use(cookieSession({ secret: 'manny is cool' }));

// do something with the session
app.get('/', function (req, res) {
  req.session.count = (req.session.count || 0) + 1
  res.send('viewed ' + req.session.count + ' times\n')
})

// TODO: ?????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
