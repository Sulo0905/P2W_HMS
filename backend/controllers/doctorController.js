import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import asyncHandler from "express-async-handler";

// Create Doctor
export const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, phone, specialization, username, password } = req.body;

  if (!name || !email || !phone || !specialization || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Split name into first and last name
  const [firstName, ...lastParts] = name.trim().split(" ");
  const lastName = lastParts.join(" ") || "";

  // Check duplicates
  const doctorExists = await Doctor.findOne({
    $or: [{ email }, { username }],
  });

  if (doctorExists) {
    return res
      .status(400)
      .json({ message: "Doctor with this email or username already exists" });
  }

  const doctor = await Doctor.create({
    username,
    password,
    email,
    phone,
    firstName,
    lastName,
    doctorType: specialization, // map to required field
    specialization,
  });

  res.status(201).json({
    _id: doctor._id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    email: doctor.email,
    phone: doctor.phone,
    specialization: doctor.specialization,
    doctorType: doctor.doctorType,
    username: doctor.username,
    isActive: doctor.isActive,
    createdAt: doctor.createdAt,
  });
});

// Get All Doctors
export const getDoctors = asyncHandler(async (req, res) => {
  try {
    const { specialization, search } = req.query;
    let filter = { isActive: true };

    if (specialization) {
      filter.specialization = specialization;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Remove populate temporarily to test
    const doctors = await Doctor.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    const formattedDoctors = doctors.map((doc) => ({
      ...doc._doc,
      name: `${doc.firstName} ${doc.lastName}`.trim(),
    }));

    res.json(formattedDoctors);
  } catch (error) {
    console.error(" Error fetching doctors:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch doctors", error: error.message });
  }
});

// Get Doctor by ID
export const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate("patients", "name email phone category age gender")
    .select("-password");

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  res.json(doctor);
});

// Update Doctor
export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const { name, email, phone, specialization, username, password } = req.body;
  if (email && email !== doctor.email) {
    const emailExists = await Doctor.findOne({
      email,
      _id: { $ne: req.params.id },
    });
    if (emailExists)
      return res.status(400).json({ message: "Email already exists" });
  }
  if (username && username !== doctor.username) {
    const usernameExists = await Doctor.findOne({
      username,
      _id: { $ne: req.params.id },
    });
    if (usernameExists)
      return res.status(400).json({ message: "Username already exists" });
  }

  if (name) {
    const [firstName, ...lastParts] = name.trim().split(" ");
    doctor.firstName = firstName;
    doctor.lastName = lastParts.join(" ") || "";
  }

  doctor.email = email || doctor.email;
  doctor.phone = phone || doctor.phone;
  doctor.specialization = specialization || doctor.specialization;
  doctor.doctorType = specialization || doctor.doctorType;
  doctor.username = username || doctor.username;
  if (password) doctor.password = password;

  const updatedDoctor = await doctor.save();

  res.json({
    _id: updatedDoctor._id,
    firstName: updatedDoctor.firstName,
    lastName: updatedDoctor.lastName,
    email: updatedDoctor.email,
    phone: updatedDoctor.phone,
    specialization: updatedDoctor.specialization,
    doctorType: updatedDoctor.doctorType,
    username: updatedDoctor.username,
    isActive: updatedDoctor.isActive,
    updatedAt: updatedDoctor.updatedAt,
  });
});

// Delete Doctor (Hard Delete)
export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  // Delete the doctor completely from DB
  await Doctor.findByIdAndDelete(req.params.id);

  // Remove doctor assignment from patients
  await Patient.updateMany(
    { assignedDoctor: doctor._id },
    { $unset: { assignedDoctor: 1 } }
  );

  res.status(200).json({ message: "Doctor permanently deleted" });
});
