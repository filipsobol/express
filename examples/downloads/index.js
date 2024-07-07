import express from '../../src/express.cjs';
import path from 'path';

const app = express();

export default app;

// path to where the files are stored on disk
var FILES_DIR = path.join(__dirname, 'files')

app.get('/', function(req, res){
  res.send('<ul>' +
    '<li>Download <a href="/files/notes/groceries.txt">notes/groceries.txt</a>.</li>' +
    '<li>Download <a href="/files/amazing.txt">amazing.txt</a>.</li>' +
    '<li>Download <a href="/files/missing.txt">missing.txt</a>.</li>' +
    '<li>Download <a href="/files/CCTV大赛上海分赛区.txt">CCTV大赛上海分赛区.txt</a>.</li>' +
    '</ul>')
});

// /files/* is accessed via req.params[0]
// but here we name it :file
app.get('/files/:file(*)', function(req, res, next){
  res.download(req.params.file, { root: FILES_DIR }, function (err) {
    if (!err) return; // file sent
    if (err.status !== 404) return next(err); // non-404 error
    // file for download not found
    res.statusCode = 404;
    res.send('Cant find that file, sorry!');
  });
});

// TODO: ????
// if (!module.parent) {
//   app.listen(3000);
//   console.log('Express started on port 3000');
// }
