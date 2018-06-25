const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  username: {type: String, required: true},
  email:    {type: String, required: true, unique: true},
  password: String,
  //image: String,
  confirmationCode: String,
  //_list: [{type:[Schema.Types.ObjectId], ref: 'List'}],
  status: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
