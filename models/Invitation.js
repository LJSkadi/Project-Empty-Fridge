const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   invitationSchema = new Schema({
  _sendingUser:    {type: Schema.Types.ObjectId , ref: 'User'},
  _receivingUser:  {type: Schema.Types.ObjectId , ref: 'User', required: true},
  _list: {type: Schema.Types.ObjectId , ref: 'List', required: true},
  confirmationCode: String,
  refuseCode: String,
  status: {type: Boolean, default: false}
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  usePushEach: true
});

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
