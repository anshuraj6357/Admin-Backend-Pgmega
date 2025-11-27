const mongoose = require("mongoose");

const SignupSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  role:{
    type:String,
    enum:["owner","branch-manager","tenant"],
    required:true
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  resetLink: {
    type: String
  },
  resetSession: { type: String },
  password: {
    type: String,
    required: true,
  },
  photourl: {
    type: String,
    required: false,
  }

});

module.exports = mongoose.model("Signup", SignupSchema);
