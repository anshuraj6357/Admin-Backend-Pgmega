const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ["Electrical", "Plumbing", "Cleaning", "Other"], default: "Other" },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyBranch" },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "staff" },
  status: { type: String, enum: ["Pending", "In-Progress", "Resolved"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
