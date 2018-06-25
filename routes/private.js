const express = require("express");
const passport = require('passport');
const User = require("../models/User");
const List = require("../models/List");
const nodemailer = require('nodemailer');

const privateRoutes = express.Router();



//#region LIST
//#region GET /Profilpage
privateRoutes.get('/user/:userId',(req, res, next) => {
  Promise.all(
    [User.findOne( { "_id": req.params.userId } ),
    List.find( { _creator : req.params.userId })]
  )
  .then( ( array ) => {
    console.log(array);
    //console.log(lists);
    res.render( 'users/profile', { user: array[0], lists: array[1]} );
  } )
  .catch( err => { throw err } );
});
//#endregion


//This is an alternative solution
// privateRoutes.get('/user/:userId', (req, res, next) => {
//   User.findOne({ "_id": req.params.userId })
//     .then(user => {
//       List.find( { _creator : req.params.userId } )
//         .then(lists => {
//           res.render('users/profile', { user, lists })
//         }
//         )
//         .catch(err => { throw err })
//    })
//     .catch(err => 
//       { throw err });
// });

//#region CREATE LIST
//#region GET/new-list
privateRoutes.get('/new-list', (req, res, next) => {
  res.render('lists/newList');
})
//#endregion

//#region POST/new-list
privateRoutes.post('/new-list', (req, res, next) => {
  let listName = req.body.listname;
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

//#region GET/list/:listId
privateRoutes.get('/list/:listId', (req, res, next) => {
  let listId = req.params.listId;
  List.findById(listId)
    .then(list => {
      res.render('lists/list-details', list )
    })
    .catch( err => { throw err })
});

//#endregion

//#region GET /logout
privateRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
//#endregion

module.exports = privateRoutes;