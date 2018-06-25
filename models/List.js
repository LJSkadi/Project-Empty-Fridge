const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   listSchema = new Schema({
  name:    {type: String, default: `New List from ${(new Date().getDate())} - ${(new Date().getMonth())+1} - ${(new Date().getFullYear())}`},
  _creator: {type: Schema.Types.ObjectId , ref: 'User', required: true},
  _members: [{type:[Schema.Types.ObjectId], ref: 'User'}],
  items: [{
            _creator: {type: Schema.Types.ObjectId , ref: 'User', required: true},
            content: {type: String, required: true},
            status: {
                      type: String,
                      enum : ['OPEN', 'CLOSED', 'DELETED'],
                      default : 'OPEN'
            },
            _fullFiller: {type: Schema.Types.ObjectId, ref: 'User'},
        }],
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const List = mongoose.model('List', listSchema);
module.exports = List;
