const HealthLog = require("../models/HealthLog");

// Create HealthLog
exports.createHealthLog = async (req, res) => {
  try {
    const log = new HealthLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Logs
exports.getHealthLogs = async (req, res) => {
  try {
    const logs = await HealthLog.find().populate("patientId");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Log by ID
exports.getHealthLogById = async (req, res) => {
  try {
    const log = await HealthLog.findById(req.params.id).populate("patientId");
    if (!log) return res.status(404).json({ message: "HealthLog not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Log
exports.updateHealthLog = async (req, res) => {
  try {
    const log = await HealthLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Log
exports.deleteHealthLog = async (req, res) => {
  try {
    const log = await HealthLog.findByIdAndDelete(req.params.id);
    res.json({ message: "HealthLog deleted", log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
