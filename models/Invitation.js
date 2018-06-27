const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   invitationSchema = new Schema({
  _sendingUser:    { 
      _id:      {type: Schema.Types.ObjectId},
      username: {type: String}
    },
  _receivingUser:  {
    _id:      {type: Schema.Types.ObjectId},
    username: {type: String}
  },
  _list: {type: Schema.Types.ObjectId , ref: 'List', required: true},
  confirmationCode: String,
  refuseCode: String,
  status: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
