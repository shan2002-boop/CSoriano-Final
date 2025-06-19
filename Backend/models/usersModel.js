const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  Username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'contractor'],
    required: true
  },
  forgotPassword: { type: Boolean, default: false },
}, {timestamps: true})

module.exports = mongoose.model('User', userSchema)