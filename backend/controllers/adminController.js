import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import asyncHandler from "express-async-handler";

// Dashboard Stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalDoctors = await Doctor.countDocuments({ isActive: true });
  const totalPatients = await Patient.countDocuments({ isActive: true });
  const totalAppointments = await Appointment.countDocuments();
  const pendingAppointments = await Appointment.countDocuments({
    status: "Scheduled",
  });

  const entDoctors = await Doctor.countDocuments({
    specialization: "ENT",
    isActive: true,
  });
  const gynecologyDoctors = await Doctor.countDocuments({
    specialization: "Gynecology",
    isActive: true,
  });

  const entPatients = await Patient.countDocuments({
    category: "ENT",
    isActive: true,
  });
  const pregnancyPatients = await Patient.countDocuments({
    category: "Pregnancy",
    isActive: true,
  });

  res.json({
    totalDoctors,
    totalPatients,
    totalAppointments,
    pendingAppointments,
    doctorsBySpecialization: {
      ENT: entDoctors,
      Gynecology: gynecologyDoctors,
    },
    patientsByCategory: {
      ENT: entPatients,
      Pregnancy: pregnancyPatients,
    },
  });
});

// Assign Patient to Doctor
export const assignPatientToDoctor = asyncHandler(async (req, res) => {
  const { patientId, doctorId } = req.body;

  if (!patientId || !doctorId) {
    return res
      .status(400)
      .json({ message: "Patient ID and Doctor ID are required" });
  }

  const patient = await Patient.findById(patientId);
  const doctor = await Doctor.findById(doctorId);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  // Remove patient from previous doctor if assigned
  if (patient.assignedDoctor) {
    await Doctor.findByIdAndUpdate(patient.assignedDoctor, {
      $pull: { patients: patient._id },
    });
  }

  // Assign patient to new doctor
  patient.assignedDoctor = doctorId;
  await patient.save();

  // Add patient to doctor's patients array
  await Doctor.findByIdAndUpdate(doctorId, {
    $addToSet: { patients: patientId },
  });

  res.json({
    message: "Patient assigned to doctor successfully",
    patient: {
      _id: patient._id,
      name: patient.name,
      assignedDoctor: doctorId,
    },
  });
});

// Update Credentials (Username/Password)
export const updateCredentials = asyncHandler(async (req, res) => {
  const { userId, userType, username, password } = req.body;

  if (!userId || !userType || (!username && !password)) {
    return res.status(400).json({
      message:
        "User ID, user type, and at least username or password are required",
    });
  }

  let user;
  if (userType === "doctor") {
    user = await Doctor.findById(userId);
  } else if (userType === "patient") {
    user = await Patient.findById(userId);
  } else {
    return res.status(400).json({ message: "Invalid user type" });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if username already exists
  if (username && username !== user.username) {
    const Model = userType === "doctor" ? Doctor : Patient;
    const usernameExists = await Model.findOne({
      username,
      _id: { $ne: userId },
    });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }
  }

  if (username) {
    user.username = username;
  }

  if (password) {
    user.password = password;
  }

  await user.save();

  res.json({
    message: "Credentials updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      userType,
    },
  });
});

// Get All Users for Credential Management
export const getAllUsersForCredentials = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ isActive: true }).select(
    "name email username createdAt"
  );
  const patients = await Patient.find({ isActive: true }).select(
    "name email username createdAt"
  );

  const users = [
    ...doctors.map((doc) => ({ ...doc.toObject(), userType: "doctor" })),
    ...patients.map((pat) => ({ ...pat.toObject(), userType: "patient" })),
  ];

  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(users);
});
