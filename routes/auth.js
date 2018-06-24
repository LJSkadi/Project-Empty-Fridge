const express = require("express");
const passport = require('passport');
const authRoutes = express.Router();
const User = require("../models/User");

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

//#region GET /signup
authRoutes.get("/signup", (req, res, next) => {
  res.render("users/signup");
});
//#endregion


authRoutes.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  if (username === "" || email === "" || password === "") {
    res.render( "users/signup", { message: "You must indicate username, email and password" } );
    return;
  }

  User.findOne({ email }, "email", (err, user) => {
    if (user !== null) {
      res.render("users/signup", { message: "The email already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    

    const newUser = new User({
      username,
      email,
      password: hashPass,
      confirmationCode
    });

    newUser.save((err) => {
      if (err) {
        res.render("users/signup", { message: "Something went wrong" });
      } else {
        res.redirect("/");
      }
    });
  });
});


function checkStatus() {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user.status) {
      return next();
    } else {
      res.redirect('users/login')
    }
  }
}

authRoutes.get("/login", checkRoles(), (req, res, next) => {
  res.render("users/login", { "message": req.flash("error") });
});


authRoutes.post("/login", passport.authenticate("local", {
  //successRedirect: "/", we overwrite this Passport command to redirect logged in user where we want
  failureRedirect: "/login",
  failureFlash: true,
  passReqToCallback: true
}), (req, res, next) => {
  const userId = req.user._id;
  res.redirect(`/user/${userId}`); //  we redirect logged in user to /user/userId (his/her profile)
});

authRoutes.use( (req, res, next) => {
  if ( req.isAuthenticated() ) {
    console.log( "YES YOU ARE LOGGED IN" );
    next();
  } else {
    console.log("YOU MUST LOG IN BEFORE GOING TO USER PAGE");
    res.redirect('/login');
    return;
  }
})

authRoutes.get('/user/:userId',(req, res, next) => {
  User.findOne( { "_id": req.params.userId } )
  .then( user => {
    res.render( 'users/profile', user);
  } )
  .catch( err => { throw err } );
});



authRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = authRoutes;
