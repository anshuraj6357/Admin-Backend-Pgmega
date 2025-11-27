const mongoose = require("mongoose");

const MonthlyHistorySchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyBranch",
        required: true
    },
    advanced: {
        type: Number,
        default:0
    },
    dues: {
        type: Number,
         default:0
    },
    NotPaid:[{
       type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        
    }],

    rent: {
        type: Number,
         default:0
    },

}, { timestamps: true });

module.exports = mongoose.model("paymenthistory", MonthlyHistorySchema);
