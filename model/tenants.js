const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyBranch",
        required: true
    },
    branchmanager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branchmanager",
       
    },
    contactNumber: {
        type: Number,
       
        // unique: true
    },
    lastupdated: {
        type: Date,
        default: "2025-11-03T05:33:04.078Z"
    },
    name: {
        type: String
    },
    checkInDate: {
        type: Date,
        default: Date.now
    },
    roomNumber: {
        type: Number,
        // required: true,
    },
    checkedoutdate: {
        type: Date
    },
    Rent: {
        type: Number,
        default: 0
    },
    dues: {
        type: Number,
        default: 0
    },
    duesdays: {
        type: Number,
    },
    duesmonth: {
        type: Number,
    },
    advanced: {
        type: Number,
        default: 0
    },
    startdues: {
        type: Date,
        default: null
    },


    paymentstatus: {
        type: String,
        enum: ["paid", "dues", "over-dues"],
        default: "paid"
    },
    securitydeposit: {
        type: Number,
        default: 0
    },

    idProof: {
        type: String,
     
    },

    idProofType: {
        type: String,
        enum: ["Aadhar-Card", "Voter-Id-Card"],
   
    },
    status: {
        type: String,
        enum: ["Active", "In-Active"],
        default: "Active"
    },
    emergencyContactNumber: {
        type: Number
    },
    documentsPhoto: {
        type: [String]
    },
}, { timestamps: true });

module.exports = mongoose.model("Tenant", tenantSchema);
