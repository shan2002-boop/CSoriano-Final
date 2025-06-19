const mongoose = require('mongoose')

const schema = mongoose.Schema

const locationsSchema = new schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  markup: {
    type: Number,
    required: true
  }
}, {timestamps: true})

module.exports = mongoose.model('Location', locationsSchema)