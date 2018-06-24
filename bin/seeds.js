const mongoose      = require('mongoose');
const bcrypt        = require('bcrypt');
const faker         = require('faker');
const User          = require('../models/User');

// creating a list of users
function createUsers( n ) {
  let usersList = [];
  for ( let i = 0; i < n; i++ ) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const hashCode = bcrypt.hashSync( faker.lorem.word(), bcrypt.genSaltSync(8) )
    const username = `${firstName} ${lastName}`;
    const email = firstName + "." + lastName + "@" + faker.internet.domainName;
    const password = bcrypt.hashSync( "password", bcrypt.genSaltSync(8) );
    const confirmationCode = hashCode;
    const status = true;
    const newUser = { username, email, password, confirmationCode, status };
    usersList.push( newUser );
  }
  return usersList;
}

mongoose.connect( 'mongodb://localhost/project-empty-fridge' )
.then( () => {
  console.log( "Connected to MongoDB..." )
})
.catch( err => { throw err } )

User.collection.drop();

// insert 15 new users to the database
User.insertMany( createUsers( 15 ), (err, users) => {
  if ( err ) {
    console.log( "There was an error creating users ---->", err );
    return;
  } else {
    console.log( `${users.length} new already confirmed users created.` )
    mongoose.disconnect();
  }
})