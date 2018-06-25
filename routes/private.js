const express = require("express");
const passport = require('passport');
const User = require("../models/User");
const List = require("../models/List");
const nodemailer = require('nodemailer');

const privateRoutes = express.Router();



//#region LIST

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
      res.render(`/list/${list._id}`)
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
      res.render('list', list )
    })
    .catch( err => { throw err })
});

//#endregion

module.exports = privateRoutes;