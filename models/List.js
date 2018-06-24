const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   listSchema = new Schema({
  name:    String,
  _creator: {type: Schema.Types.ObjectId , ref: 'User'},
  _members: {type:[Schema.Types.ObjectId], ref: 'User'},
  _items: {type:[Schema.Types.ObjectId], ref: 'Item'},
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const List = mongoose.model('List', listSchema);
module.exports = List;
