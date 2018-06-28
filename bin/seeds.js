require('dotenv').config();

const mongoose      = require('mongoose');
const bcrypt        = require('bcrypt');
const faker         = require('faker');
const User          = require('../models/User');
const List          = require('../models/List');
const Item          = require('../models/Item');
const Invitation    = require('../models/Invitation');

var numberOfUsers = 15;
const usersList = [];

mongoose.connect( `${process.env.MONGODB_URI}` )
.then( () => {
  console.log( "Connected to MongoDB..." )
})
.catch( err => { throw err } );

User.collection.drop();
List.collection.drop();
Item.collection.drop();


// creating a list of users
function createUsers( n ) {
  for ( let i = 0; i < n; i++ ) {
    const firstName = faker.name.firstName().toLowerCase();
    const lastName = faker.name.lastName().toLowerCase();
    const hashCode = bcrypt.hashSync( faker.lorem.word(), bcrypt.genSaltSync(8) )
    const username = `${firstName} ${lastName}`;
    const email = firstName + "." + lastName + "@" + faker.internet.domainName();
    const profileImage = `${process.env.ANONYMOUS_USER}`;
    const password = bcrypt.hashSync( "password", bcrypt.genSaltSync(8) );
    const confirmationCode = hashCode;
    const status = true;

    const newUser = new User(
      { username, email, profileImage, password, confirmationCode, status }
    );
    // push user into list _members
    usersList.push( newUser );
    // save new user on DB
    newUser.save( (err) => {
      if (err) {
        console.log("ERROR creating user --->", err)
      } else {
        console.log( "NEW USER CREATED!!!" )
      }
    })
  }
}

createUsers( numberOfUsers );


const elliot = new User({
  username: "elliot",
  email: "lj.skadi@gmail.com",
  profileImage: `${process.env.ANONYMOUS_USER}`,
  password: bcrypt.hashSync( "abc", bcrypt.genSaltSync(8) ),
  confirmationCode: bcrypt.hashSync( "confirm", bcrypt.genSaltSync(8) ),
  status: true
});

const silvio = new User({
  username: "silvio",
  email: "silvio.galli@gmail.com",
  profileImage: `${process.env.ANONYMOUS_USER}`,
  password: bcrypt.hashSync( "silvio", bcrypt.genSaltSync(8) ),
  confirmationCode: bcrypt.hashSync( "confirm", bcrypt.genSaltSync(8) ),
  status: true
});

const elliotList = new List({ 
  name: "Elliot First List",
  _creator: elliot._id
});

const silvioList = new List({ 
  name: "Silvio First List",
  _creator: silvio._id
});

// creating items for list
const createItemsInList = function ( numOfItems, user, list ) {
  return new Promise( (resolve, reject) => {
    for ( let i = 0; i < numOfItems; i++ ) {
      const newItem = new Item({
        _list: list._id,
        _creator: user.id,
        content: faker.lorem.word()
      });
  
      // adding item reference to the list
      list._items.push( newItem._id );
      // saving the list with the new reference
      list.save( (err, updatedList) => {
        if ( err ) {
          console.log( "ERROR saving" );
          return;
        } else {
          console.log("ITEM INSERTED!!! LIST with new item --->", updatedList);
        }
      });
      
      //
      newItem.save( (err, createdItem) => {
        if ( err ) {
          console.log( "PROBLEM creating item --->", err )
          reject( err );
        } else {
          console.log( "ITEM created --->", createdItem )
          resolve( createdItem );
        }
      })
    }
  })
}


// create members for list
const populateMembers = function ( numOfMembers, list ) {
  return new Promise( (resolve, reject) => {
    console.log( "I AM IN THE PROMISE!!!" )
    for (let i = 0; i < numOfMembers; i++) {
      const randomNumber = Math.floor( Math.random() * numberOfUsers );
      //console.log("RANDOM USER --->", user);
      //push random user to list._members
      list._members.push( usersList[randomNumber]._id );
      // updateing the list
      list.save( (err, updatedList) => {
        if (err) {
          console.log( "ERROR while creating member", err )
          reject( err );
        } else {
          console.log( "MEMBER ADDED!!!", updatedList );
          resolve( updatedList);
        }
      })
    }
  })
}

Promise.all(
  [
  // #0 creating elliot account
  elliot.save(),
  // #1 creating silvio account
  silvio.save(),
  // #2 insert 25 new users to the database
  //User.insertMany( createUsers( numberOfUsers ) ),
  // #2 saving Elliot's list
  elliotList.save(),
  // #3 saving Silvio's list
  silvioList.save(),
  // #4 adding items to Elliot's list
  createItemsInList( 10, elliot, elliotList ),
  // #5 creating items in Silvio's list
  createItemsInList( 10, silvio, silvioList ),
  // #6 adding members to Silvio's list
  populateMembers( 6, silvioList ),
  // #7 adding members to Elliot's list
  populateMembers( 6, elliotList )
]
)
.then( ( result ) => {
  
  const dbElliot = result[0];
  const dbSilvio = result[1];
  const dbElliotList = result[2];
  const dbSilvioList = result[3]
  
  console.log( "ELLIOT created --->", dbElliot );
  console.log( "SILVIO created --->", dbSilvio );
  console.log( "ELLIOT's LIST created --->", dbElliotList );
  console.log( "Silvio's LIST created --->", dbSilvioList );

  setTimeout( () => {
    mongoose.disconnect();
  }, 8000)
    
})
.catch( err => { throw err } );

