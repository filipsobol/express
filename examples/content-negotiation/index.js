import express from '../../index.cjs';
import users from './users';
import db from './db';

const app = express();

export default app;

// so either you can deal with different types of formatting
// for expected response in index.js
app.get('/', function(req, res){
  res.format({
    html: function(){
      res.send('<ul>' + db.map(function(user){
        return '<li>' + user.name + '</li>';
      }).join('') + '</ul>');
    },

    text: function(){
      res.send(db.map(function(user){
        return ' - ' + user.name + '\n';
      }).join(''));
    },

    json: function(){
      res.json(db);
    }
  });
});


app.get('/users', ( req, res ) => {
  res.format(users);
});

// TODO: ??????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
