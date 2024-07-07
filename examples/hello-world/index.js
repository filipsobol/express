import express from '../../src/express.cjs';

var app = module.exports = express()

app.get('/', function(req, res){
  res.send('Hello World');
});

// TODO: ????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
