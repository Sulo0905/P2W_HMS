const AIInteraction = require("../models/AIInteraction");

// Create Interaction
exports.createInteraction = async (req, res) => {
  try {
    const interaction = new AIInteraction(req.body);
    await interaction.save();
    res.status(201).json(interaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Interactions
exports.getInteractions = async (req, res) => {
  try {
    const interactions = await AIInteraction.find().populate("userId");
    res.json(interactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Interaction by ID
exports.getInteractionById = async (req, res) => {
  try {
    const interaction = await AIInteraction.findById(req.params.id).populate("userId");
    if (!interaction) return res.status(404).json({ message: "Interaction not found" });
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Interaction
exports.updateInteraction = async (req, res) => {
  try {
    const interaction = await AIInteraction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Interaction
exports.deleteInteraction = async (req, res) => {
  try {
    const interaction = await AIInteraction.findByIdAndDelete(req.params.id);
    res.json({ message: "Interaction deleted", interaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

