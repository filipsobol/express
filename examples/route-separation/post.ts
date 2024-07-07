export function list(req, res){
  res.render('posts', {
    title: 'Posts',
    posts: [
      { title: 'Foo', body: 'some foo bar' },
      { title: 'Foo bar', body: 'more foo bar' },
      { title: 'Foo bar baz', body: 'more foo bar baz' }
    ]
  });
};
