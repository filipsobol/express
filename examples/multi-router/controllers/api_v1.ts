import { Router } from '../../../src/express.js';

var apiv1 = Router();

apiv1.get('/', function(req, res) {
  res.send('Hello from APIv1 root route.');
});

apiv1.get('/users', function(req, res) {
  res.send('List of APIv1 users.');
});

export default apiv1;
