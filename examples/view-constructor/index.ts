import express from '../../src/express.js';
import GithubView from './github-view.js';
import md from 'marked'.parse;

const app = express();

export default app;

// register .md as an engine in express view system
app.engine('md', function(str, options, fn){
  try {
    var html = md(str);
    html = html.replace(/\{([^}]+)\}/g, function(_, name){
      return options[name] || '';
    });
    fn(null, html);
  } catch(err) {
    fn(err);
  }
});

// pointing to a particular github repo to load files from it
app.set('views', 'expressjs/express');

// register a new view constructor
app.set('view', GithubView);

app.get('/', function(req, res){
  // rendering a view relative to the repo.
  // app.locals, res.locals, and locals passed
  // work like they normally would
  res.render('examples/markdown/views/index.md', { title: 'Example' });
});

app.get('/Readme.md', function(req, res){
  // rendering a view from https://github.com/expressjs/express/blob/master/Readme.md
  res.render('Readme.md');
});

// TODO: ????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
