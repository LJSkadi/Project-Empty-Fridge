const express       = require("express");
const passport      = require('passport');
const User          = require("../models/User");
const nodemailer    = require('nodemailer');

const authRoutes = express.Router();

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

// create a transporter object for nodemailer
let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSWORD
  }
})

//#region SIGNUP
//#region GET /signup
authRoutes.get("/signup", (req, res, next) => {
  res.render("users/signup");
});
//#endregion

//#region POST /signup
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
    let hashConfirm = bcrypt.hashSync(username, salt);
    const confirmationCode = hashConfirm.split('').filter(element => element!== '/').join('');

    const newUser = new User({
      username,
      email,
      password: hashPass,
      confirmationCode
    });

    // email content for the new user with a link to confirmation code
    const subject = "Confirm your account at emptyfridge.com";
    const message = "we have created an account for you inside our application. Please, confirm your account clicking on this";
      
    newUser.save( (err) => {
      if (err) {
        res.render("users/signup", { message: "Something went wrong" });
      } else {
        transporter.sendMail({
          from: '"Empty Fridge Project 👻" <empty.fridge@gmail.com>',
          to: email, 
          subject: subject, 
          text: message,
          html: `<b>Hi ${username}, ${message} <a href='http://localhost:3000/confirm/${confirmationCode}'>confirmation link</a></b>`
        })
        .then(info => {
          console.log( "EMAIL SENT!!!", info );
          console.log( "Redirecting new user to login page." )
          res.redirect("/login");
        })
        .catch(error => {
          console.log("ERROR CREATING USER: ", error);
          console.log( "Redirecting new user to login page." )
          res.redirect("/login");
        });
        
      }
    });
  });
});
//#endregion
//#endregion

//#region LOGIN
//#region GET /login
authRoutes.get("/login", (req, res, next) => {
  res.render("users/login", { "message": req.flash("error") });
});

//#region POST /login
authRoutes.post("/login", passport.authenticate("local", {
  //successRedirect: "/", we overwrite this Passport command to redirect logged in user where we want
  failureRedirect: "/login",
  failureFlash: true,
  passReqToCallback: true
}), (req, res, next) => {
  const userId = req.user._id;
  res.redirect(`/user/${userId}`); //  we redirect logged in user to /user/userId (his/her profile)
});

//#region GET /confirm/ from email
authRoutes.get('/confirm/:confirmationCode', (req,res, next) => {
  const hashCode = req.params.confirmationCode;
  User.findOne({ confirmationCode: hashCode })
  .then( user => {
    User.findByIdAndUpdate(user._id, { status: true })
    .then(updatedUser => {
      console.log( "Welcome! User account activated." );
      res.render('users/login', {
        message: "Your account is activated. Now you can login."
      });
    })
  })
  .catch( err => { throw err })
});
//#endregion

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
//#endregion
//#endregion

//#region GET /Profilpage
authRoutes.get('/user/:userId',(req, res, next) => {
  User.findOne( { "_id": req.params.userId } )
  .then( user => {
    res.render( 'users/profile', user);
  } )
  .catch( err => { throw err } );
});
//#endregion

//#region GET /logout
authRoutes.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
//#endregion

module.exports = authRoutes;
