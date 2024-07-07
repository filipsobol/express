import db from '../../db';

export const engine = 'ejs';

export function before(req, res, next){
  var pet = db.pets[req.params.pet_id];
  if (!pet) return next('route');
  req.pet = pet;
  next();
};

export function show(req, res, next){
  res.render('show', { pet: req.pet });
};

export function edit(req, res, next){
  res.render('edit', { pet: req.pet });
};

export function update(req, res, next){
  var body = req.body;
  req.pet.name = body.pet.name;
  res.message('Information updated!');
  res.redirect('/pet/' + req.pet.id);
};
