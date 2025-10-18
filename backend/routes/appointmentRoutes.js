import express from "express";
import mongoose from "mongoose";

import {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getPatientAppointments,
} from "../controllers/appointmentController.js";

import {
  createEmergencyAppointment,
  getEmergencyAppointments,
  getDoctorEmergencyAppointments,
  getAvailableEmergencyDoctors,
} from "../controllers/emergencyAppointmentController.js";

import Appointment from "../models/Appointment.js";
import User from "../models/User.js"; // Assuming your doctor is also stored in the User model

const router = express.Router();

// --------------------- EMERGENCY APPOINTMENT ROUTES ---------------------
router.post("/emergency", createEmergencyAppointment);
router.get("/emergency", getEmergencyAppointments);
router.get("/emergency/available-doctors", getAvailableEmergencyDoctors);
router.get("/emergency/doctor/:doctorId", getDoctorEmergencyAppointments);

// --------------------- GENERAL APPOINTMENT ROUTES ---------------------

// Get all appointments for admin dashboard
router.get("/all", async (req, res) => {
  try {
    console.log("Fetching all appointments for admin dashboard");

    const appointments = await Appointment.find()
      .populate({
        path: "doctor",
        model: "Doctor",
        select: "name specialization",
      })
      .sort({ appointmentDate: -1 });

    console.log(`Found ${appointments.length} total appointments`);
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.toString(),
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }
});

// Public route for creating appointments
router.post("/", createAppointment);

// --------------------- PATIENT APPOINTMENTS ---------------------
router.get("/patient/:id", async (req, res) => {
  try {
    const patientId = req.params.id;
    console.log("Fetching appointments for patient ID:", patientId);

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID format" });
    }

    const appointments = await Appointment.find({ patient: patientId })
      .populate({
        path: "doctor",
        model: "Doctor",
        select: "name specialization",
      })
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.toString(),
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }
});

// --------------------- DOCTOR APPOINTMENTS ---------------------
router.get("/doctor/:id", async (req, res) => {
  try {
    const doctorId = req.params.id;
    console.log(`Fetching appointments for doctor: ${doctorId}`);

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID format" });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ message: `Doctor with ID ${doctorId} not found` });
    }

    const appointments = await Appointment.find({ doctor: doctorId })
      .populate("patient", "name")
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ message: "Server Error", error: error.toString() });
  }
});

// --------------------- SPECIFIC APPOINTMENT BY ID ---------------------
router.get("/:id", getAppointmentById);

// --------------------- UPDATE APPOINTMENT ---------------------
router.put("/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    console.log("Update appointment request received for ID:", appointmentId);

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only update allowed fields
    if (req.body.reason) appointment.reason = req.body.reason;
    if (req.body.status) appointment.status = req.body.status;
    if (req.body.doctorNotes) appointment.doctorNotes = req.body.doctorNotes;

    const updatedAppointment = await appointment.save();

    const populatedAppointment = await Appointment.findById(
      updatedAppointment._id
    )
      .populate("doctor", "name specialization")
      .populate("patient", "name");

    res.json(populatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// --------------------- DELETE APPOINTMENT ---------------------
router.delete("/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    console.log("DELETE request for appointment ID:", appointmentId);

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const db = mongoose.connection.db;
    const result = await db
      .collection("appointments")
      .deleteOne({ _id: new mongoose.Types.ObjectId(appointmentId) });

    if (result.deletedCount === 1) {
      return res.status(200).json({
        success: true,
        message: "Appointment successfully deleted",
        appointmentId: appointmentId,
      });
    } else {
      return res.status(500).json({
        message: "Failed to delete appointment - no documents affected",
        result,
      });
    }
  } catch (error) {
    console.error("Error in appointment delete route:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.toString(),
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }
});

export default router;
