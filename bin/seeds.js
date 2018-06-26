const mongoose      = require('mongoose');
const bcrypt        = require('bcrypt');
const faker         = require('faker');
const User          = require('../models/User');
const List          = require('../models/List');
const Item          = require('../models/Item');

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
List.collection.drop();
Item.collection.drop();

const elliot = new User({
  username: "elliot",
  email: "lj.skadi@gmail.com",
  password: bcrypt.hashSync( "abc", bcrypt.genSaltSync(8) ),
  confirmationCode: bcrypt.hashSync( "confirm", bcrypt.genSaltSync(8) ),
  status: true
});

const silvio = new User({
  username: "silvio",
  email: "silvio.galli@gmail.com",
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


Promise.all(
  [
  // #0 creating elliot account
  elliot.save(),
  // #1 creating elliot account
  silvio.save(),
  // #2 insert 15 new users to the database
  User.insertMany( createUsers( 15 ) ),
  // #3 saving Elliot's list
  elliotList.save(),
  // #4 saving Silvio's list
  silvioList.save(),
  // #5 adding items to Elliot's list
  createItemsInList( 10, elliot, elliotList ),
  // #6 creating items in Silvio's list
  createItemsInList( 10, silvio, silvioList )
]
)
.then( ( result ) => {
  const dbElliot = result[0];
  const dbSilvio = result[1];
  const others = result[2];
  const dbElliotList = result[3];

  console.log( "ELLIOT created --->", dbElliot );
  console.log( "SILVIO created --->", dbSilvio );
  console.log( `${others.length} other users created` );
  console.log( "ELLIOT's LIST created --->", dbElliotList );
  mongoose.disconnect();
})
.catch( err => { throw err } );

