const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["manager", "security", "maintenance", "cleaning"],
    required: true,
  },
  branch: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "PropertyBranch",
    required: true
  }],
  inservice: {
    type: Date,
    default: Date.now,
  },
    outservice: {
      type: Date
    },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    permissions: [{ type: String }], // e.g., ['view_reports', 'manage_staff']
    status: { type: String, enum: ["Active", "In-active"], default: "Active" },
  });

module.exports = mongoose.model("Staff", staffSchema);
