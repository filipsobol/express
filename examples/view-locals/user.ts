export default User;

// faux model

function User(name, age, species) {
  this.name = name;
  this.age = age;
  this.species = species;
}

User.all = function(fn){
  // process.nextTick makes sure this function API
  // behaves in an asynchronous manner, like if it
  // was a real DB query to read all users.
  process.nextTick(function(){
    fn(null, users);
  });
};

User.count = function(fn){
  process.nextTick(function(){
    fn(null, users.length);
  });
};

// faux database

var users = [
  new User( 'Tobi', 2, 'ferret' ),
  new User( 'Loki', 1, 'ferret' ),
  new User( 'Jane', 6, 'ferret' ),
  new User( 'Luna', 1, 'cat' ),
  new User( 'Manny', 1, 'cat' )
];
