const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const   itemSchema = new Schema({  
        _list:      {type: Schema.Types.ObjectId , ref: 'List', required: true},
        _creator:   {type: Schema.Types.ObjectId , ref: 'User', required: true},
        content:    {type: String, required: true},
        status: {
                  type: String,
                  enum : ['OPEN', 'CLOSED', 'DELETED'],
                  default : 'OPEN'
        },
        _fullFiller: {type: Schema.Types.ObjectId, ref: 'User'},
    }, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  usePushEach: true
});

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
