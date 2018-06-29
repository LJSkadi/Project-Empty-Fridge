require('dotenv').config();

const express = require("express");
const User = require("../models/User");
const List = require("../models/List");
const Item = require('../models/Item');
const Invitation = require('../models/Invitation');
const passport = require('passport');
const nodemailer = require('nodemailer');
const mongoose     = require('mongoose');
const uploadCloud = require('../config/cloudinary.js');
// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


const privateRoutes = express.Router();

function isIncluded(role) {
  return function (req, res, next) {
    let listId = (req.params.listId) ? req.params.listId : req.body.listId;
    List.findById(listId)
      .then(list => {
        if (role === "_creator") {
          if(`${list[role]}` == `${req.user._id}`){
          console.log("I'm the creator")
          return next()}
          else
          {
            res.redirect(`/list/${listId}`)
          }
          } else {
          console.log("I'm a member")
          if(list[role].includes(req.user._id)){
          return next()
        }else
        {
            res.redirect(`/user/${req.user._id}`)
          }
        }
      })
      .catch(err => { throw err })
  }
}

const isCreator = isIncluded("_creator");
const isMember = isIncluded("_members");

//#region PROFILE
//#region GET /Profile
privateRoutes.get('/user/:userId/profile', (req, res, next) => {
  Promise.all(
    [User.findById(req.params.userId),
    List.find({ _creator: req.params.userId })]
  )
    .then((array) => {
      res.render('users/profile', { user: array[0], lists: array[1] });
    })
    .catch(err => { throw err });
});
//#endregion

//#region GET /Profile-edit
privateRoutes.get('/user/:userId/profile/edit', (req, res, next) => {
  Promise.all(
    [User.findById(req.params.userId),
    List.find({ _creator: req.params.userId })]
  )
    .then((array) => {
      res.render('users/profile-edit', { user: array[0], lists: array[1] });
    })
    .catch(err => { throw err });
});
//#endregion

//#region POST /Profile-update
privateRoutes.post('/user/:userId/profile-update', uploadCloud.single('photo'), (req, res, next) => {
  console.log("IMAGE FILE --->", req.file);
  let userId = req.params.userId;
  let newUsername = req.body.username;
  let newPassword = req.body.password;
  let changePW = false;
  console.log("This is the req.body", req.body)
  console.log("This is req.user.password", req.user.password)
  let newImage = req.file ? req.file.secure_url : req.user.profileImage;
  // Take care that no value is lost
  if (newUsername === "") {
    newUsername = req.user.username;
  } else if (newPassword !== '') {
    if (!bcrypt.compareSync(newPassword, req.user.password)) {
      const salt = bcrypt.genSaltSync(bcryptSalt);
      const hashPass = bcrypt.hashSync(newPassword, salt);
      newPassword = hashPass;
    }
    changePW = true;
  }
  console.log("This is the req.body", req.body)
  console.log("This is changePW", changePW)
  // Check if the password should be changed
  if (changePW === true) {
    User.findByIdAndUpdate(userId, { username: newUsername, password: newPassword, profileImage: newImage }, { new: true })
      .then(user => {
        console.log(user)
        res.redirect(`/user/${userId}/profile`)
      })
      .catch(err => { throw err });
  } else {
    User.findByIdAndUpdate(userId, { username: newUsername, profileImage: newImage }, { new: true })
      .then(user => {
        console.log(user)
        res.redirect(`/user/${userId}/profile`)
      })
      .catch(err => { throw err });
  }

})
//#endregion

privateRoutes.get('/user/:userId/profile/delete', (req, res, next) => {
  let userId = req.params.userId;
  User.findById(userId)
    .then(user => {
      List.find({ _creator: `${userId}` })
        .populate('_members')
        .then(lists => {
          res.render('users/profile-delete', { user, lists });
        })
        .catch(err => { throw err });
    })
    .catch(err => { throw err });
});

//#region POST /Profile-delete
privateRoutes.post('/user/:userId/profile/delete', (req, res, next) => {
  console.log(req.body)
  let userId = req.user._id;
  List.find({ _creator: `${userId}` })
    .then(lists => {
      lists.forEach(element => {
        let listId = element._id;
        let value = req.body[`${listId}`];
        if (value !== 'delete') {
          //change the Owner of the list and remove the _creator from the members
          const memberId = value;
          List.findById(listId)
            .populate('_creator')
            .populate('_members')
            .then(list => {
              // removing member from list
              list._creator = memberId;
              console.log("This was creator", userId)
              console.log("This is the new creator", list._creator)
              console.log("This was the selected member", value)
              // updating list after removing member
              list.save((err, updatedList) => {
                if (err) {
                  console.log("ERROR changing the Creator of the List --->", err);
                } else {
                  console.log(`The new owner changed`);
                }
              });
            })
            .catch(err => { throw err })
        } else if (value === 'delete'){
          List.findById(listId)
            .then(list => {
              Item.deleteMany({ _list: listId })
                .then(itemsDeleted => {
                  List.findByIdAndRemove(listId)
                    .then(listToDelete => {
                      console.log("Your list is deleted successfully");
                    })
                    .catch(err => { throw err });
                })
                .catch(err => { throw err })
            })
            .catch(err => { throw err })
        }
      })
    })
    .catch(err => { throw err })

  User.findByIdAndRemove(userId)
    .then(user => {
      res.redirect('/signup');
    })
    .catch(err => { throw err });
})
//#endregion


//#region LIST
//#region GET /Dashboard
privateRoutes.get('/user/:userId', (req, res, next) => {

  Promise.all(
    [
      User.findOne({ "_id": req.params.userId }),
      List.find({ _creator: req.params.userId }).populate('_invitations'),
      List.find({ _members: { $in: [ req.params.userId ] } } ).populate('_creator'),
      Invitation.find( { 'receivingUser.email': req.user.email } )
      .populate({ path: '_list', populate: { path: '_creator' } }),
    ]
  )
  .then( ( array ) => {
    const membershipLists = array[2];
    const receivedInvitations = array[3];
    res.render( 'users/dashboard', { user: array[0], lists: array[1], membershipLists: membershipLists, receivedInvitations: receivedInvitations } );
  })
  .catch(err => { throw err });
});
//#endregion

//#region POST /search-user
privateRoutes.post('/search-user', isCreator, (req, res, next) => {
  const query = req.body.searchedEmail;

  List.findById(req.body.listId)
    .populate({ path:'_items', populate: { path: '_fullFiller'}})
    .populate({ path: '_items', populate: { path: '_creator'}})
    .populate('_creator')
    .populate('_members')
    .populate('_invitations')
    .then(list => {
      const openItems = list._items.filter((item) => item.status === 'OPEN');
      const closedItems = list._items.filter((item) => item.status === 'CLOSED');
      const listMembers = list._members;
      const pendingInvitations = list._invitations;
      User.find( { email: { "$regex": query, "$options": "i" } } )
      .then(searchedUsers => {
        // show search result
        console.log("The LIST of the USERS --->", searchedUsers);
        res.render('lists/list-details', { list: list, openItems: openItems, closedItems: closedItems, listMembers: listMembers, pendingInvitations: pendingInvitations, foundUsers: searchedUsers })
      })
      .catch(err => { throw err });
    })
    .catch(err => { throw err });
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

  let listName = (req.body.listname === "") ? undefined : req.body.listname;
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
    .populate({ path:'_items', populate: { path: '_fullFiller'}})
    .populate({ path: '_items', populate: { path: '_creator'}})
    .populate('_creator')
    .populate('_members')
    .populate('_invitations')
    .then(list => {
      const openItems = list._items.filter((item) => item.status === 'OPEN');
      const closedItems = list._items.filter((item) => item.status === 'CLOSED');
      const listMembers = list._members;
      const pendingInvitations = list._invitations;
      res.render('lists/list-details', { list: list, openItems: openItems, closedItems: closedItems, listMembers: listMembers, pendingInvitations: pendingInvitations })
    })
    .catch(err => { throw err })
});
//#endregion

//#region POST/add-new-item
privateRoutes.post('/list/:listId/add-new-item', [isCreator, isMember], (req, res, next) => {
  const { listId, newItemInput } = req.body;
  const user = req.user;

  const newItem = new Item({
    _creator: user._id,
    _list: listId,
    content: newItemInput
  });

  newItem.save()
    .then(createdItem => {
      console.log("NEW ITEM CREATED --->", createdItem);

      List.findByIdAndUpdate(listId, { $push: { _items: createdItem._id } }, { new: true })
        .then(updatedList => {
          console.log("LIST UPDATED --->", updatedList);
          res.redirect(`/list/${listId}`);
        })
    })
    .catch(err => { console.log("Error creating the NEW ITEM and updating LIST", err) });
});
//#endregion

//#region GET/delete-item
privateRoutes.get('/list/:listId/delete-item/:itemId', [isCreator, isMember], (req, res, next) => {
  Item.findByIdAndUpdate(req.params.itemId, { status: 'CLOSED', _fullFiller: `${req.user._id}` }, { new: true })
    .populate('_list')
    .then(updatedItem => {
      res.redirect(`/list/${updatedItem._list._id}`)
    })
    .catch(err => { throw err })
})

//#region GET/reactivate-item
privateRoutes.get('/list/:listId/reactivate-item/:itemId', [isCreator, isMember], (req, res, next) => {
  Item.findByIdAndUpdate(req.params.itemId, { status: 'OPEN', _fullFiller: `${req.user._id}` }, { new: true })
    .populate('_list')
    .then(updatedItem => {
      res.redirect(`/list/${updatedItem._list._id}`)
    })
    .catch(err => { throw err })
})
//#endregion

//#region DELETE MEMBER FROM LIST -> GET /list/listId/delete-member/memberId
privateRoutes.get('/list/:listId/delete-member/:memberId', isCreator, (req, res, next) => {
  const listId = req.params.listId;
  const memberId = req.params.memberId;
  List.findById(listId)
    .populate('_members')
    .then(list => {
      // removing member from list
      list._members.pull({ _id: memberId });
      // updating list after removing member
      list.save((err, updatedList) => {
        if (err) {
          console.log("ERROR updating list after removing member --->", err);
        } else {
          res.redirect(`/list/${updatedList._id}`);
        }
      });
    })
    .catch(err => { throw err })
});
//#end

// create a transporter object for invitation
let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSWORD
  }
})

//#region POST /create-invitation
privateRoutes.post("/create-invitation", isCreator, (req, res, next) => {
  const sendingUser = req.user;
  const invitedUserId = req.body.invitedUserId;
  const listId = req.body.listId;

  console.log("INVITED USER ID --->", invitedUserId);
  console.log("LIST ID --->", listId);

  Promise.all(
    [
      User.findById(invitedUserId),
      List.findById(listId)
    ]
  )
    .then((result) => {
      //console.log( result );
      const invitedUser = result[0];
      const sharedList = result[1];

      console.log("You want invite THIS USER --->", invitedUser);
      console.log("You want to invite on THIS LIST --->", sharedList);

      let newInvitation = new Invitation({
        receivingUser: {
          id: invitedUser._id,
          username: invitedUser.username,
          email: invitedUser.email
        },
        _list: listId,
        confirmationCode: bcrypt.hashSync(invitedUser.email, bcrypt.genSaltSync(8)).split('').filter(x => x !== "/").join(''),
        refuseCode: bcrypt.hashSync(sendingUser.email, bcrypt.genSaltSync(8)).split('').filter(x => x !== "/").join('')
      });

      // push invitation reference into list
      sharedList._invitations.push(newInvitation._id);
      // update the list
      sharedList.save((err, updatedList) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Invitation reference inside list done!", updatedList);

          // email content for the new user with a link to confirmation code
          const subject = `${sendingUser.email} is inviting you to join a list on emptyfridge.com`;
          const message = `<strong>Hi ${invitedUser.username}</strong>, <strong>${sendingUser.username}</strong> is inviting you to join his/her <strong>${sharedList.name} list</strong> on our platform <strong><a href="${process.env.HTTP_ROOT_URL}">Empty Fridge</a></strong>.
        You can <a href='${process.env.HTTP_ROOT_URL}/invitation/${newInvitation._id}/confirm/${newInvitation.confirmationCode}'>confirm</a> or <a href='${process.env.HTTP_ROOT_URL}/invitation/${newInvitation._id}/decline/${newInvitation.refuseCode}'>decline</a> this invitation, clicking on these links: <b><a href='${process.env.HTTP_ROOT_URL}/invitation/${newInvitation._id}/confirm/${newInvitation.confirmationCode}'>Accept Invitation</a></b> --- <a href='${process.env.HTTP_ROOT_URL}/invitation/${newInvitation._id}/decline/${newInvitation.refuseCode}'>Decline Invitation</a>`;

          newInvitation.save((err, invitation) => {
            if (err) {
              res.render("lists/list-details", { message: "Something went wrong" });
            } else {
              console.log("NEW INVITATION CREATED --->", invitation);

              transporter.sendMail({
                from: '"Empty Fridge Project 👻" <empty.fridge@gmail.com>',
                to: invitedUser.email,
                subject: subject,
                text: message,
                html: `${message}`
              })
                .then(info => {
                  console.log("EMAIL SENT!!!", info);
                  console.log("Rendering list page.")
                  res.redirect(`/list/${sharedList._id}`);
                })
                .catch(error => {
                  console.log("ERROR CREATING USER: ", error);
                  console.log("Redirecting new user to login page.")
                  res.redirect(`/list/${sharedList._id}`);
                });

            }
          });
        }
      })

    })
    .catch(err => {
      console.log("PROBLEM CREATING INVITATION --->", err);
    });

});
//#endregion


//#region GET /logout
privateRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
//#endregion

//#region GET/delete-list
privateRoutes.get('/delete-list/:listId', isCreator, (req, res, next) => {
  let userId = req.user._id;
  let listId = req.params.listId;
  List.findById(listId)
    .then(list => {
      Item.deleteMany({ _list: listId })
        .then(itemsDeleted => {
          List.findByIdAndRemove(req.params.listId)
            .then(listToDelete => {
              res.redirect(`/user/${userId}/profile`)
            })
        })
        .catch(err => { throw err })
    })
    .catch(err => { throw err })
})

module.exports = privateRoutes;

