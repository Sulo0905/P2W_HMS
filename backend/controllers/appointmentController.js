import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Public
export const createAppointment = async (req, res) => {
  try {
    const {
      doctor,
      patient,
      patientName,
      patientAge,
      appointmentDate,
      appointmentTime,
      reason,
    } = req.body;

    const doctorUser = await Doctor.findById(doctor);
    if (!doctorUser) {
      return res.status(400).json({ message: "Doctor not found" });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const appointmentsToday = await Appointment.countDocuments({
      createdAt: {
        $gte: new Date(todayStr),
        $lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const queueNumber = `Q${today.getFullYear()}${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}-${(
      appointmentsToday + 1
    )
      .toString()
      .padStart(3, "0")}`;

    const appointment = new Appointment({
      doctor,
      patient: patient || "659631b7bace152d00f8b6a0",
      patientName: patientName || "Patient",
      patientAge: patientAge || 30,
      queueNumber,
      appointmentDate,
      appointmentTime: appointmentTime || null,
      reason,
      status: "pending",
    });

    const savedAppointment = await appointment.save();
    res.status(201).json(savedAppointment);
  } catch (error) {
    console.error("Appointment creation error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Public
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate("doctor", "firstName lastName email specialization")
      .populate("patient", "name email");

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get user appointments
// @route   GET /api/appointments/myappointments
// @access  Private
export const getMyAppointments = async (req, res) => {
  try {
    let appointments;

    if (req.user.role === "doctor") {
      appointments = await Appointment.find({ doctor: req.user._id }).populate(
        "patient",
        "name email"
      );
    } else {
      appointments = await Appointment.find({ patient: req.user._id }).populate(
        "doctor",
        "firstName lastName email"
      );
    }

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Public
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctor", "firstName lastName email specialization")
      .populate("patient", "name email");

    if (appointment) {
      res.json(appointment);
    } else {
      res.status(404).json({ message: "Appointment not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Public
export const updateAppointment = async (req, res) => {
  try {
    console.log("Updating appointment ID:", req.params.id);
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (req.body.status) appointment.status = req.body.status;
    if (req.body.reason) appointment.reason = req.body.reason;
    if (req.body.doctorNotes) appointment.doctorNotes = req.body.doctorNotes;
    if (req.body.appointmentDate)
      appointment.appointmentDate = req.body.appointmentDate;
    if (req.body.appointmentTime !== undefined)
      appointment.appointmentTime = req.body.appointmentTime;

    const updatedAppointment = await appointment.save();

    const populatedAppointment = await Appointment.findById(
      updatedAppointment._id
    )
      .populate("doctor", "name specialization")
      .populate("patient", "name");

    res.json(populatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      message: "Server error updating appointment",
      error: error.message,
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Public
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await appointment.deleteOne();

    res.json({
      message: "Appointment removed successfully",
      appointmentId: req.params.id,
    });
  } catch (error) {
    console.error("Error in deleteAppointment:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/patient/:id
// @access  Public
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.params.id;

    const appointments = await Appointment.find({ patient: patientId })
      .populate("doctor", "name specialization")
      .sort({ appointmentDate: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Error in getPatientAppointments:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
