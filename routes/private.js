const express       = require("express");
const passport      = require('passport');
const User          = require("../models/User");
const nodemailer    = require('nodemailer');

const privateRoutes = express.Router();

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


//#region LIST

//#region GET list of lists
router.get('/mylists', (req, res, next) => {
    List.find( {_creator : req.params._id})
      .then(lists => {
        res.render('mylists', { lists });
      })
      .catch( err => { throw err } )
  
  });
   //#endregion


//#region GET list
  router.get('/list/:id', (req, res, next) => {
    let listId = req.params.id;
    List.findById(listId)
      .then(list => {
        res.render('list', list )
      })
      .catch( err => { throw err })
  });
 //#endregion

  //#region CREATE LIST
  //#region GET/new-list
  privateRoutes.get('/newList', (req, res, next) => {
        res.render('lists/newlist');
  })
  //#endregion

  //#region POST/
  router.post('/newList', (req, res, next) => {
    let listName = req.body.name;
    let creator = req.params.userId;
    List.create({ name: listName, _creator: creator})
      .then(list => {
        res.redirect('/invitations')
      })
      .catch(err => {
        console.log("We couldn't create your list", err)
      })
  })
//#endregion
//#endregion
 //#endregion

 
//#region INVITATIONS
  //#region GET/invitations
  //#endregion
  //#endregion