const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   itemSchema = new Schema({
  _creator: {type: Schema.Types.ObjectId , ref: 'User'},
  content: String,
  status: {
    type: String,
    enum : ['OPEN', 'CLOSED', 'DELETED'],
    default : 'OPEN'
  },
  _fullFiller: {type:[Schema.Types.ObjectId], ref: 'User'},
  _list: {type:[Schema.Types.ObjectId], ref: 'List'},
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
