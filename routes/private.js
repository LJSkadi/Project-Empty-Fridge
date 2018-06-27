const express       = require("express");
const User          = require("../models/User");
const List          = require("../models/List");
const Item          = require('../models/Item');
const Invitation    = require('../models/Invitation');
const passport      = require('passport');
const nodemailer    = require('nodemailer');
const bcrypt        = require('bcrypt');

const privateRoutes = express.Router();



//#region LIST
//#region GET /Profilpage
privateRoutes.get('/user/:userId',(req, res, next) => {
  Promise.all(
    [User.findOne( { "_id": req.params.userId } ),
    List.find( { _creator : req.params.userId })]
  )
  .then( ( array ) => {
    res.render( 'users/profile', { user: array[0], lists: array[1]} );
  } )
  .catch( err => { throw err } );
});
//#endregion

//#region POST /search-user
privateRoutes.post('/search-user', (req, res, next) => {
  const query = req.body.searchedEmail ? { email: req.body.searchedEmail } : {} ;

  List.findById( req.body.listId )
  .populate( '_items' )
  .then( list => {
    // show list
    console.log("LIST AFTER SEARCHING USERS --->", list);
    // filter items
    const openItems = list._items.filter( (item) => item.status ==='OPEN' );
    const closedItems = list._items.filter( (item) => item.status ==='CLOSED' );
    // show items
    console.log( "OPEN ITEMS --->", openItems);
    console.log( "CLOSED ITEMS --->", closedItems);

    User.find( query )
    .then( searchedUsers => {
      // show search result
      console.log( "The LIST of the USERS --->", searchedUsers );
      res.render('lists/list-details', { list: list, openItems: openItems, closedItems:closedItems, foundUsers: searchedUsers } );
    })
    .catch( err => { throw err } );
  } )
  .catch( err => { throw err } );
});
//#endregion


//#region CREATE LIST
//#region GET/new-list
privateRoutes.get('/new-list', (req, res, next) => {
  res.render('lists/newList');
})
//#endregion

//#region POST/new-list
privateRoutes.post('/new-list', (req, res, next) => {
  
  let listName = (req.body.listname==="") ? undefined : req.body.listname;
  let creator = req.user._id;
  List.create({ name: listName, _creator: creator })
    .then(list => {
      res.redirect(`/list/${list._id}`)
    })
    .catch(err => {
      console.log("We couldn't create your list", err)
    })
})
//#endregion
//#endregion

//#region DISPLAY LIST-DETAILS
//#region GET/list/:listId
privateRoutes.get('/list/:listId', (req, res, next) => {
  let listId = req.params.listId;

  List.findById(listId)
  .populate( '_items' )
  .then(list => {
    const openItems = list._items.filter((item) => item.status ==='OPEN')
    const closedItems = list._items.filter((item) => item.status ==='CLOSED')
    res.render('lists/list-details', {list: list, openItems: openItems, closedItems:closedItems} )
  })
  .catch( err => { throw err })
});
//#endregion

//#region POST/add-new-item
privateRoutes.post('/add-new-item', (req, res, next) => {
  const { listId, newItemInput }  = req.body;
  const user = req.user;
  
  const newItem = new Item( {
    _creator: user._id,
    _list: listId,
    content: newItemInput
  });

  newItem.save()
  .then( createdItem => {
    console.log( "NEW ITEM CREATED --->", createdItem );

    List.findByIdAndUpdate( listId, { $push: { _items: createdItem._id }}, { new: true } )
    .then(updatedList => {
      console.log( "LIST UPDATED --->", updatedList );
      res.redirect(`/list/${listId}`);
    })
  })
  .catch( err => { console.log( "Error creating the NEW ITEM and updating LIST", err ) });
});
//#endregion

//#region GET/delete-item
privateRoutes.get('/delete-item/:itemId', (req, res, next) => {
  Item.findByIdAndUpdate(req.params.itemId, { status: 'CLOSED' }, {new: true})
  .populate('_list')
  .then( updatedItem => {
    res.redirect(`/list/${updatedItem._list._id}`)
  })
  .catch( err => { throw err } )
})

//#region GET/reactivate-item
privateRoutes.get('/reactivate-item/:itemId', (req, res, next) => {
  Item.findByIdAndUpdate(req.params.itemId, { status: 'OPEN' }, {new: true})
  .populate('_list')
  .then( updatedItem => {
    res.redirect(`/list/${updatedItem._list._id}`)
  })
  .catch( err => { throw err } )
})

// create a transporter object for invitation
let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSWORD
  }
})

//#region POST /create-invitation
privateRoutes.post("/create-invitation", (req, res, next) => {
  const sendingUser = req.user;
  const invitedUserId = req.body.invitedUserId;
  const listId = req.body.listId;

  console.log( "INVITED USER ID --->", invitedUserId );
  console.log( "LIST ID --->", listId );

  Promise.all(
    [
      User.findById( invitedUserId ),
      List.findById( listId )
    ]
  )
  .then( ( result ) => {
    //console.log( result );
    const invitedUser = result[0];
    const sharedList = result[1];

    console.log( "You want invite THIS USER --->", invitedUser );
    console.log( "You want to invite on THIS LIST --->", sharedList );

    let newInvitation = new Invitation({
      _sendingUser: sendingUser._id,
      _receivingUser: invitedUser._id,
      _list: listId,
      confirmationCode: bcrypt.hashSync( invitedUser.email, bcrypt.genSaltSync(8) ).split('').filter( x => x !== "/").join(''),
      refuseCode: bcrypt.hashSync( sendingUser.email, bcrypt.genSaltSync(8) ).split('').filter( x => x !== "/").join('')
    });

    console.log("LIST INVITATIONS --->", sharedList._invitations);
    // sharedList.save((err, updatedList) => {
    //   if ( err ) {
    //     console.log( err );
    //   } else {
    //     console.log( "Invitation reference inside list done!", updatedList );
    //   }
    // })

    console.log( "NEW INVITATION --->", newInvitation );

    // email content for the new user with a link to confirmation code
    const subject = `${sendingUser.email} is inviting you to join a list on emptyfridge.com`;
    const message = `<strong>Hi ${_receivingUser.username}</strong>, <strong>${sendingUser.username}</strong> is inviting you to join his/her <strong>${sharedList.name} list</strong> on our platform <strong><a href="http://localhost:3000/">Empty Fridge</a></strong>.
    You can <a href='http://localhost:3000/list/${sharedList._id}/confirm/${newInvitation.confirmationCode}'>confirm</a> or <a href='http://localhost:3000/list/${sharedList._id}/declin/${newInvitation.refuseCode}'>declin</a> this invitation, clicking on these links: <b><a href='http://localhost:3000/list/${sharedList._id}/confirm/${newInvitation.confirmationCode}'>Accept Invitation</a></b> --- <a href='http://localhost:3000/list/${sharedList._id}/declin/${newInvitation.refuseCode}'>Declin Invitation</a>`;
  })
  .catch( err => {
    console.log("PROBLEM CREATING INVITATION --->", err );
  });


      
  //   newUser.save( (err) => {
  //     if (err) {
  //       res.render("users/signup", { message: "Something went wrong" });
  //     } else {
  //       transporter.sendMail({
  //         from: '"Empty Fridge Project 👻" <empty.fridge@gmail.com>',
  //         to: email, 
  //         subject: subject, 
  //         text: message,
  //         html: `<b>Hi ${username}, ${message} <a href='http://localhost:3000/confirm/${confirmationCode}'>confirmation link</a></b>`
  //       })
  //       .then(info => {
  //         console.log( "EMAIL SENT!!!", info );
  //         console.log( "Redirecting new user to login page." )
  //         res.redirect("/login");
  //       })
  //       .catch(error => {
  //         console.log("ERROR CREATING USER: ", error);
  //         console.log( "Redirecting new user to login page." )
  //         res.redirect("/login");
  //       });
        
  //     }
  //   });
  // });
});
//#endregion

//#region GET /logout
privateRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
//#endregion

//#region GET/delete-list
privateRoutes.get('/delete-list/:listId', (req, res, next) => {
  let userId = req.user._id;
  let listId = req.params.listId;
  List.findById(listId)
  .then( list => {
    if (`${userId}` == `${list._creator}`){
      Item.deleteMany({_list: listId})
      .then( itemsDeleted => {
        List.findByIdAndRemove(req.params.listId)
        .then( listToDelete => {
          let message = "Your list is deleted successfully";
          
          res.redirect(`/user/${userId}`)
        })
      })
      .catch( err => { throw err } )
    }else{
      res.redirect(`/user/${userId}`)
    }
  })
  .catch( err => { throw err } )
})

module.exports = privateRoutes;


// function checkCreator(userId, creator) {
//   return function(req, res, next) {
//     if (req.isAuthenticated() && element._creator === userId ) {
//       return next();
//     }
//   }
// }

// const checkListCreator  = checkCreator(req.user._id, list);
// const checkItemCreator = checkCreator(req.user._id, item);

// //* GET method to show the signup form
// privateRoutes.get('/delete-list/:listId', checkListCreator, (req, res, next) => {
//   Item.deleteMany({_list: req.params.listId})
//   .then( itemsDeleted => {
//     console.log("I'm here")
//     List.findByIdAndRemove(req.params.listId)
//     .then( listToDelete => {
//       let message = "Your list is deleted successfully";
//       let userId = req.user._id;
//       res.redirect(`/user/${userId}`)
//     })
//   })
//   .catch( err => { throw err } )
// })
