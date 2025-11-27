const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyBranch",
        required: true
    },
    tilldateAdvance: {
        type: Number,
        default: 0
    },
    tilldatestatus: {
        type: String,
        enum: ["paid", "dues", "over-dues"],
        default: "dues"
    },
    tilldatedues: {
        type: Number,
        default: 0
    },
    amountpaid: {
        type: Number
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
