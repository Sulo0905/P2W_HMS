import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import userCrudRoutes from "./routes/userCrudRoutes.js";
import userManagementRoutes from "./routes/userManagementRoutes.js";
import entRoutes from "./routes/entRoutes.js";
import obstetricsRoutes from "./routes/obstetricsRoutes.js";
import entLogRoutes from "./routes/entLogRoutes.js";
import obstetricsLogRoutes from "./routes/obstetricsLogRoutes.js";
import masterPatientRoutes from "./routes/masterPatientRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import aiInsightRoutes from "./routes/aiInsight.js";
dotenv.config();

// Connect to MongoDB Atlas (profileManagementDB)
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Profile Management API is running ✅",
    database: "profileManagementDB",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    database: "profileManagementDB",
  });
});

// Routes
app.use("/api/users", userManagementRoutes); // New multi-collection user management
app.use("/api/users-legacy", userCrudRoutes); // Legacy CRUD routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/entcare", entRoutes);
app.use("/api/obstetricscare", obstetricsRoutes);

// Routes
app.use("/api/ent", entLogRoutes);
app.use("/api/obstetrics", obstetricsLogRoutes);
app.use("/api/patients", masterPatientRoutes);
app.use("/api/reports", reportsRoutes);

app.use("/api/ai-insight", aiInsightRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
