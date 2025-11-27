const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Signup",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
