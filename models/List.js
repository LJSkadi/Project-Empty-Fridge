const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const defaultName = function(){
  const defaultString = `New List from ${(new Date().getDate())}-${(new Date().getMonth())+1}-${(new Date().getFullYear())}`;
  return defaultString;
};


const   listSchema = new Schema({
  name:     {type: String, default: defaultName},
  _creator: {type: Schema.Types.ObjectId , ref: 'User', required: true},
  _members: [{type:[Schema.Types.ObjectId], ref: 'User'}],
  _items:   [{type:[Schema.Types.ObjectId], ref: 'Item'}],
  _invitations:   [{type:[Schema.Types.ObjectId], ref: 'Invitation'}]
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  usePushEach: true
});

const List = mongoose.model('List', listSchema);
module.exports = List;
