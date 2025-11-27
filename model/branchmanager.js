const mongoose = require("mongoose");

const branchManagerSchema = new mongoose.Schema(
    {

        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PropertyBranch",
            required: true,
        },
        name: {
            type: String
        },
        email: {
            type: String
        },
        phone: {
            type: Number
        },
        status:{
            type:String,
            enum:["Active","In-Active"],
            default:"Active"
        }
    },
    { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("branchmanager", branchManagerSchema);
