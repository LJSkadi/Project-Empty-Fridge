const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User          = require('../models/User');
const bcrypt        = require('bcrypt');

passport.use(new LocalStrategy( {usernameField: 'email'}, (email, password, next) => {
  User.findOne({ email }, (err, foundUser) => {
    if (err) {
      next(err);
      return;
    }

    if (!foundUser) {
      next(null, false, { message: 'Incorrect credentials', messageType: "warning" });
      return;
    }

    if (!foundUser.status) {
      next(null, false, { message: 'You should confirm your account before proceeding. Look your emails or require a new confirmation email.', messageType: "warning" });
      return;
    }

    if (!bcrypt.compareSync(password, foundUser.password)) {
      next(null, false, { message: 'Incorrect credentials', messageType: "warning" });
      return;
    }

    next(null, foundUser);
  });
}));
