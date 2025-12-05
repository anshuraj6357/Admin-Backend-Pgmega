const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    roomId: [{
        type: String,
    }],

    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PropertyBranch",
        required: true
    },

    mode: {
        type: String,
        enum: ["Online", "Offline"],
        default: "Offline"
    },

    tilldatestatus: {
        type: String,
        enum: ["paid", "dues", "over-dues"],
        default: "dues"
    },

    tilldateAdvance: {
        type: Number,
        default: 0
    },

    tilldatedues: {
        type: Number,
        default: 0
    },

    amountpaid: {
        type: Number,
    },

    // ⭐ ADD THESE FIELDS
    razorpay_order_id: {
        type: String,
    },

    razorpay_payment_id: {
        type: String,
    },

    razorpay_signature: {
        type: String,
    },

    date: {
        type: Date,
        default: Date.now,
    },

}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
