const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   invitationSchema = new Schema({
   receivingUser:  {
    username:   {type: String},
    id:        {type: String},
    email:      {type: String}, 
    required: true},
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
