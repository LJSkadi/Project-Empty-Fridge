const express       = require("express");
const User          = require("../models/User");
const List          = require("../models/List");
const Item          = require('../models/Item');
const passport      = require('passport');
const nodemailer    = require('nodemailer');

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

//#region GET/list/:listId
privateRoutes.get('/list/:listId', (req, res, next) => {
  let listId = req.params.listId;
  List.findById(listId)
  .populate( '_items' )
  .then(list => {
    console.log( list );
    res.render('lists/list-details', list )
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

//#region GET /logout
privateRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
//#endregion

module.exports = privateRoutes;

//#region POST/add-new-item
privateRoutes.post('/add-new-item', (req, res, next) => {
  const { listId, newItemInput }  = req.body;
  const user = req.user;
  const newItem = {
    _creator: user._id,
    content: newItemInput
  }
  List.findById( listId )
  .then( list =>{
    console.log( "LIST IS --->", list );
    
    list.items.unshift( newItem );
    console.log( "LIST ITEMS ------>", list.items );
    
    list.save( err => {
      if ( err ) {
        console.log( "ERROR updating List ---->", err );
      res.redirect( `/list/${list._id}` );
      } else {
        res.redirect(`/list/${list._id}`);
      }
    } );
  })
  .catch( err => { throw err } );


});
//Item.findByIdAndUpdate(req.params._id, { status: 'CLOSED' })