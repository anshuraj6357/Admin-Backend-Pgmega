const mongoose = require("mongoose");

const expensesSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Electricity", "Water Bill", "WiFi", "Maintenance", "Other"],
      default: "Other",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyBranch",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);

module.exports = mongoose.model("Expenses", expensesSchema);
