const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   invitationSchema = new Schema({
  _sendingUser:    {type: Schema.Types.ObjectId , ref: 'User'},
  _receivingUser:  {type: Schema.Types.ObjectId , ref: 'User'},
  _list: {type: Schema.Types.ObjectId , ref: 'List'},
  confirmationCode: String,
  refuseCode: String,
  status: Boolean,
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
