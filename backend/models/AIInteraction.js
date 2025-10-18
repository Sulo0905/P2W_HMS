const mongoose = require("mongoose");

const aiInteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  interaction: String,
  response: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("AIInteraction", aiInteractionSchema);
