import express from '../../index.cjs';
import apiV1 from './controllers/api_v1';
import apiV2 from './controllers/api_v2';

const app = express();

export default app;

app.use( '/api/v1', apiV1 );
app.use( '/api/v2', apiV2 );

app.get('/', function(req, res) {
  res.send('Hello from root route.')
});

// TODO: ????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
