const CarePlan = require("../models/CarePlan");

// Create CarePlan
exports.createCarePlan = async (req, res) => {
  try {
    const carePlan = new CarePlan(req.body);
    await carePlan.save();
    res.status(201).json(carePlan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All CarePlans
exports.getCarePlans = async (req, res) => {
  try {
    const carePlans = await CarePlan.find().populate("patientId");
    res.json(carePlans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get CarePlan by ID
exports.getCarePlanById = async (req, res) => {
  try {
    const carePlan = await CarePlan.findById(req.params.id).populate("patientId");
    if (!carePlan) return res.status(404).json({ message: "CarePlan not found" });
    res.json(carePlan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update CarePlan
exports.updateCarePlan = async (req, res) => {
  try {
    const carePlan = await CarePlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(carePlan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete CarePlan
exports.deleteCarePlan = async (req, res) => {
  try {
    const carePlan = await CarePlan.findByIdAndDelete(req.params.id);
    res.json({ message: "CarePlan deleted", carePlan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
