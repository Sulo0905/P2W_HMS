import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

// @desc    Create emergency/quick appointment with auto doctor assignment
// @route   POST /api/appointments/emergency
// @access  Public
export const createEmergencyAppointment = async (req, res) => {
  try {
    const {
      patientName,
      patientAge,
      reason,
      patient,
      specialization,
      ambulanceRequested,
      pickupLocation,
    } = req.body;

    // Validation
    if (!patientName || !patientAge || !reason) {
      return res.status(400).json({
        message: "Please provide patient name, age, and reason",
      });
    }

    // Find available doctors
    let query = { isActive: true };

    // If specialization provided, filter by it
    if (specialization && specialization !== "any") {
      query.specialization = specialization;
    }

    const availableDoctors = await Doctor.find(query).select("-password");

    if (availableDoctors.length === 0) {
      return res.status(404).json({
        message:
          "No doctors available at the moment. Please try regular appointment booking.",
      });
    }

    // Get today's appointments for each doctor to find the least busy one
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const doctorAppointmentCounts = await Promise.all(
      availableDoctors.map(async (doctor) => {
        const count = await Appointment.countDocuments({
          doctor: doctor._id,
          appointmentDate: { $gte: today, $lt: tomorrow },
          status: { $ne: "cancelled" },
        });
        return { doctor, appointmentCount: count };
      })
    );

    // Sort by appointment count (ascending) to get least busy doctor
    doctorAppointmentCounts.sort(
      (a, b) => a.appointmentCount - b.appointmentCount
    );
    const selectedDoctor = doctorAppointmentCounts[0].doctor;

    // Generate queue number with EMERGENCY prefix
    const todayStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const emergencyAppointmentsToday = await Appointment.countDocuments({
      isEmergency: true,
      createdAt: { $gte: today, $lt: tomorrow },
    });
    const queueNumber = `EMG-${todayStr}-${(emergencyAppointmentsToday + 1)
      .toString()
      .padStart(3, "0")}`;

    // Calculate next available time slot (current time + 30 minutes)
    const appointmentDateTime = new Date();
    appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + 30);

    const appointmentTime = `${appointmentDateTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${appointmentDateTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // Generate ambulance number if requested
    let ambulanceNumber = null;
    let ambulanceStatus = "not-requested";

    if (ambulanceRequested) {
      ambulanceNumber = `AMB-${todayStr}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;
      ambulanceStatus = "dispatched";
    }

    // Create emergency appointment
    const appointment = new Appointment({
      doctor: selectedDoctor._id,
      patient: patient || "659631b7bace152d00f8b6a0", // Default patient ID
      patientName,
      patientAge,
      queueNumber,
      appointmentDate: today,
      appointmentTime,
      reason,
      status: "confirmed", // Auto-confirm emergency appointments
      isEmergency: true,
      priority: "emergency",
      emergencyReason: reason,
      autoAssigned: true,
      ambulanceRequested: ambulanceRequested || false,
      ambulanceStatus: ambulanceStatus,
      pickupLocation: pickupLocation || null,
      ambulanceNumber: ambulanceNumber,
    });

    const savedAppointment = await appointment.save();

    // Populate doctor details
    await savedAppointment.populate("doctor", "-password");

    const response = {
      success: true,
      message: "Emergency appointment created successfully!",
      appointment: savedAppointment,
      doctor: {
        name: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        phoneNumber: selectedDoctor.phoneNumber,
      },
      estimatedTime: appointmentDateTime,
      queueNumber: queueNumber,
    };

    // Add ambulance info if requested
    if (ambulanceRequested) {
      response.ambulance = {
        requested: true,
        status: "dispatched",
        ambulanceNumber: ambulanceNumber,
        pickupLocation: pickupLocation,
        estimatedArrival: "10-15 minutes",
        emergencyHotline: "911",
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Emergency appointment creation error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get all emergency appointments
// @route   GET /api/appointments/emergency
// @access  Private (Admin/Doctor)
export const getEmergencyAppointments = async (req, res) => {
  try {
    const emergencyAppointments = await Appointment.find({ isEmergency: true })
      .populate("doctor", "name specialization phoneNumber")
      .populate("patient", "name email phoneNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: emergencyAppointments.length,
      appointments: emergencyAppointments,
    });
  } catch (error) {
    console.error("Get emergency appointments error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get emergency appointments for a specific doctor
// @route   GET /api/appointments/emergency/doctor/:doctorId
// @access  Private (Doctor)
export const getDoctorEmergencyAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const emergencyAppointments = await Appointment.find({
      doctor: doctorId,
      isEmergency: true,
      status: { $ne: "cancelled" },
    })
      .populate("patient", "name email phoneNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: emergencyAppointments.length,
      appointments: emergencyAppointments,
    });
  } catch (error) {
    console.error("Get doctor emergency appointments error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get available doctors for emergency
// @route   GET /api/appointments/emergency/available-doctors
// @access  Public
export const getAvailableEmergencyDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    let query = { isAvailable: true };
    if (specialization && specialization !== "any") {
      query.specialization = specialization;
    }

    const doctors = await Doctor.find(query).select("-password");

    // Get current appointment counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const doctorsWithLoad = await Promise.all(
      doctors.map(async (doctor) => {
        const appointmentCount = await Appointment.countDocuments({
          doctor: doctor._id,
          appointmentDate: { $gte: today, $lt: tomorrow },
          status: { $ne: "cancelled" },
        });

        return {
          ...doctor.toObject(),
          currentLoad: appointmentCount,
          availability: appointmentCount < 10 ? "available" : "busy",
        };
      })
    );

    // Sort by current load
    doctorsWithLoad.sort((a, b) => a.currentLoad - b.currentLoad);

    res.json({
      success: true,
      count: doctorsWithLoad.length,
      doctors: doctorsWithLoad,
    });
  } catch (error) {
    console.error("Get available emergency doctors error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
