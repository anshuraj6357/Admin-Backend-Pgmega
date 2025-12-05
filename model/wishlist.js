const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId:{
      type:String,
    },
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyBranch",
      required: true,
    },
  },
  { timestamps: true }
);

wishlistSchema.index({ userId: 1, pgId: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
