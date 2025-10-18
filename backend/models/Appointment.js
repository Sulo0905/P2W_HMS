import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor", // Updated to reference Doctor model
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor", // Updated to reference Doctor model (which is a User as well)
      required: true,
    },
    patientName: {
      type: String,
      required: false, // Optional now as we have patient reference
    },
    patientAge: {
      type: Number,
      required: false, // Optional now as we can calculate from patient data if needed
    },
    queueNumber: {
      type: String,
      required: true,
      // Remove unique constraint if it's causing issues or implement auto-generation
      unique: false,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: false, // Time in HH:MM format (e.g., "14:30")
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show"],
      default: "pending",
    },
    doctorNotes: {
      type: String,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["normal", "urgent", "emergency"],
      default: "normal",
    },
    emergencyReason: {
      type: String,
    },
    autoAssigned: {
      type: Boolean,
      default: false,
    },
    ambulanceRequested: {
      type: Boolean,
      default: false,
    },
    ambulanceStatus: {
      type: String,
      enum: [
        "not-requested",
        "requested",
        "dispatched",
        "arrived",
        "completed",
      ],
      default: "not-requested",
    },
    pickupLocation: {
      type: String,
    },
    ambulanceNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add pre-save hook to ensure document validity
appointmentSchema.pre("save", function (next) {
  // Ensure required fields are present
  if (!this.doctor || !this.patient || !this.appointmentDate || !this.reason) {
    return next(new Error("Missing required fields for appointment"));
  }

  // Generate queue number if not provided
  if (!this.queueNumber) {
    // Format: YYYYMMDD-DOCID-COUNT
    const date = new Date(this.appointmentDate);
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, "");
    const docId = this.doctor.toString().slice(-4);
    this.queueNumber = `${dateString}-${docId}-${Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0")}`;
  }

  next();
});

// Add more robust deletion methods
appointmentSchema.statics.safeDelete = async function (id) {
  try {
    console.log("Attempting safe delete of appointment:", id);

    // First validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid appointment ID format");
    }

    // First check if the document exists
    const appointment = await this.findById(id);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Try different deletion methods
    try {
      // Method 1: Using deleteOne on the model
      const result1 = await this.deleteOne({ _id: id });
      if (result1.deletedCount > 0) {
        console.log("Delete succeeded with method 1:", result1);
        return { success: true, method: 1, result: result1 };
      }

      // Method 2: Using findByIdAndDelete
      const result2 = await this.findByIdAndDelete(id);
      if (result2) {
        console.log("Delete succeeded with method 2:", result2);
        return { success: true, method: 2, result: result2 };
      }

      // Method 3: Using direct MongoDB driver
      const db = mongoose.connection.db;
      const result3 = await db
        .collection("appointments")
        .deleteOne({ _id: new mongoose.Types.ObjectId(id) });
      if (result3.deletedCount > 0) {
        console.log("Delete succeeded with method 3:", result3);
        return { success: true, method: 3, result: result3 };
      }

      // If we get here, all methods failed
      return { success: false, message: "All deletion methods failed" };
    } catch (deleteError) {
      console.error("Error during deletion attempt:", deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error("Error in safeDelete method:", error);
    throw error;
  }
};

// Create index to improve query performance
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ patient: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
