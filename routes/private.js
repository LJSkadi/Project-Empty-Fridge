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

//#region DISPLAY LIST-DETAILS
//#region GET/list/:listId
privateRoutes.get('/list/:listId', (req, res, next) => {
  let listId = req.params.listId;

  List.findById(listId)
  .populate( '_items' )
  .then(list => {
    const openItems = list._items.filter((item) => item.status ==='OPEN')
    const closedItems = list._items.filter((item) => item.status ==='CLOSED')
    console.log( "These are the open items", openItems);
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
    console.log( "This is the closed Item" , updatedItem );
    //console.log(`${updatedItem._list._id}`);
    res.redirect(`/list/${updatedItem._list._id}`)
  })
  .catch( err => { throw err } )
})

//#region GET/reactivate-item
privateRoutes.get('/reactivate-item/:itemId', (req, res, next) => {
  Item.findByIdAndUpdate(req.params.itemId, { status: 'OPEN' }, {new: true})
  .populate('_list')
  .then( updatedItem => {
    console.log( "This is the reactivated Item" , updatedItem );
    //console.log(`${updatedItem._list._id}`);
    res.redirect(`/list/${updatedItem._list._id}`)
  })
  .catch( err => { throw err } )
})

//#region GET /logout
privateRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
//#endregion

module.exports = privateRoutes;