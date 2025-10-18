import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import asyncHandler from "express-async-handler";

// Create Patient
export const createPatient = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    email,
    phone,
    patientType,
    username,
    password,
    assignedDoctor,
  } = req.body;

  // Validate required fields
  if (
    !firstName ||
    !lastName ||
    !gender ||
    !email ||
    !phone ||
    !patientType ||
    !username ||
    !password
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if patient already exists
  const patientExists = await Patient.findOne({
    $or: [{ email }, { username }],
  });

  if (patientExists) {
    return res
      .status(400)
      .json({ message: "Patient with this email or username already exists" });
  }

  // Validate assigned doctor if provided
  if (assignedDoctor) {
    const doctor = await Doctor.findById(assignedDoctor);
    if (!doctor) {
      return res.status(400).json({ message: "Assigned doctor not found" });
    }
  }

  // ✅ Create patient with correct fields
  const patient = await Patient.create({
    firstName,
    lastName,
    gender,
    email,
    phone,
    patientType,
    username,
    password,
    assignedDoctor: assignedDoctor || null,
  });

  // ✅ Add patient to doctor if assigned
  if (assignedDoctor) {
    await Doctor.findByIdAndUpdate(assignedDoctor, {
      $push: { patients: patient._id },
    });
  }

  // ✅ Send response
  res.status(201).json({
    _id: patient._id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    gender: patient.gender,
    email: patient.email,
    phone: patient.phone,
    patientType: patient.patientType,
    username: patient.username,
    assignedDoctor: patient.assignedDoctor,
    isActive: patient.isActive,
    createdAt: patient.createdAt,
  });
});

// Get All Patients
export const getPatients = asyncHandler(async (req, res) => {
  const { category, search, doctorId } = req.query;
  let filter = { isActive: true };

  // Filter by doctor if doctorId is provided
  if (doctorId) {
    filter.assignedDoctor = doctorId;
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }

  const patients = await Patient.find(filter)
    .populate("assignedDoctor", "name specialization email phone")
    .select("-password")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: patients,
    count: patients.length,
  });
});

// Get Patient by ID
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate("assignedDoctor", "name specialization email phone")
    .select("-password");

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  res.json(patient);
});

// Update Patient
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const {
    firstName,
    lastName,
    gender,
    email,
    phone,
    username,
    password,
    patientType, // <-- add this
    assignedDoctor,
  } = req.body;

  // Check if email or username is being changed and already exists
  if (email && email !== patient.email) {
    const emailExists = await Patient.findOne({
      email,
      _id: { $ne: req.params.id },
    });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists" });
    }
  }

  if (username && username !== patient.username) {
    const usernameExists = await Patient.findOne({
      username,
      _id: { $ne: req.params.id },
    });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already exists" });
    }
  }

  // Handle doctor assignment changes
  if (assignedDoctor !== undefined) {
    if (patient.assignedDoctor) {
      await Doctor.findByIdAndUpdate(patient.assignedDoctor, {
        $pull: { patients: patient._id },
      });
    }

    if (assignedDoctor) {
      const doctor = await Doctor.findById(assignedDoctor);
      if (!doctor) {
        return res.status(400).json({ message: "Assigned doctor not found" });
      }
      await Doctor.findByIdAndUpdate(assignedDoctor, {
        $push: { patients: patient._id },
      });
    }
  }

  // Update fields
  patient.firstName = firstName || patient.firstName;
  patient.lastName = lastName || patient.lastName;
  patient.gender = gender || patient.gender;
  patient.email = email || patient.email;
  patient.phone = phone || patient.phone;
  patient.username = username || patient.username;
  patient.patientType = patientType || patient.patientType; // <-- add this
  patient.assignedDoctor =
    assignedDoctor !== undefined ? assignedDoctor : patient.assignedDoctor;

  if (password) {
    patient.password = password;
  }

  const updatedPatient = await patient.save();

  res.json({
    _id: updatedPatient._id,
    firstName: updatedPatient.firstName,
    lastName: updatedPatient.lastName,
    gender: updatedPatient.gender,
    email: updatedPatient.email,
    phone: updatedPatient.phone,
    patientType: updatedPatient.patientType, // <-- return updated value
    username: updatedPatient.username,
    assignedDoctor: updatedPatient.assignedDoctor,
    isActive: updatedPatient.isActive,
    updatedAt: updatedPatient.updatedAt,
  });
});

// Delete Patient (Soft delete)
export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  // Soft delete by setting isActive to false
  patient.isActive = false;
  await patient.save();

  // Remove patient from doctor's patients array
  if (patient.assignedDoctor) {
    await Doctor.findByIdAndUpdate(patient.assignedDoctor, {
      $pull: { patients: patient._id },
    });
  }

  res.json({ message: "Patient deleted successfully" });
});

// Add Health Record
export const addHealthRecord = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const { diagnosis, treatment, notes } = req.body;

  const healthRecord = {
    date: new Date(),
    diagnosis,
    treatment,
    notes,
  };

  patient.healthRecords.push(healthRecord);
  await patient.save();

  res
    .status(201)
    .json({ message: "Health record added successfully", healthRecord });
});

// Get Patient Health Records
export const getPatientHealthRecords = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).select(
    "healthRecords name"
  );

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  res.json({
    patientName: patient.name,
    healthRecords: patient.healthRecords.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    ),
  });
});
