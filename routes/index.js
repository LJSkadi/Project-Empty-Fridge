const express = require('express');
const User          = require("../models/User");
const List          = require("../models/List");
const Item          = require('../models/Item');
const Invitation    = require('../models/Invitation');
const passport      = require('passport');
const nodemailer    = require('nodemailer');
const bcrypt        = require('bcrypt');

const router  = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});

//#region CONFIRM invitation
router.get('/invitation/:invitationId/confirm/:confirmationCode', (req, res, next) => {
  //console.log( req.params );
  const invitationId = req.params.invitationId;
  const passedConfirmationCode = req.params.confirmationCode;
  Invitation.findById( invitationId )
  .populate( '_list' )
  .then( invitation => {
    console.log("INVITATION CATCHED --->", invitation);
    bcrypt.compare( passedConfirmationCode, invitation.confirmationCode)
    .then( () =>{
      // adding member to list after compare confirmation code
      invitation._list._members.push( invitation.receivingUser.id );
      console.log( "NOW LIST HAS A NEW MEMBER --->", invitation._list );
      // update list after adding member
      invitation._list.save( (err, updatedList) => {
        if ( err ) {
          console.log( "ERROR updating list after adding member --->", err );
        } else {
          console.log( "Member added to list", updatedList );
          res.redirect(`list/${invitation._list._id}`);
        }
      })
    })
    .catch( err => { throw err } )
  })
  .catch( err => { throw err })
});
//#endregion

module.exports = router;
