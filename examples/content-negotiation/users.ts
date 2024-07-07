import db from './db';

export function html(req, res){
  res.send('<ul>' + db.map(function(user){
    return '<li>' + user.name + '</li>';
  }).join('') + '</ul>');
};

export function text(req, res){
  res.send(db.map(function(user){
    return ' - ' + user.name + '\n';
  }).join(''));
};

export function json(req, res){
  res.json(db);
};
