import express from '../../src/express.js';

const app = express();

export default app;

app.get('/', function(req, res){
  res.send('Hello World');
});

// TODO: ????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
