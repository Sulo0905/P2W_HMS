import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Unified findUserByCredentials
const findUserByCredentials = async (loginField) => {
  const models = [
    { model: Admin, collection: "users" },
    { model: Patient, collection: "patients" },
    { model: Doctor, collection: "doctors" },
    { model: User, collection: "users" }, // legacy support
  ];

  for (const { model, collection } of models) {
    const user = await model.findOne({
      $or: [{ email: loginField }, { username: loginField }],
      isActive: { $ne: false },
    });

    if (user) return { user, collection };
  }

  return { user: null, collection: null };
};

// Unified loginUser
export const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginField = username || email;

    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/email and password are required",
      });
    }

    const { user, collection } = await findUserByCredentials(loginField);

    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // Check password using schema method
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Redirect based on role
    let redirect = "/";
    switch (user.role.toLowerCase()) {
      case "admin":
        redirect = "/admin-dashboard";
        break;
      case "doctor":
        redirect = "/doctor-dashboard";
        break;
      case "patient":
        redirect = "/patient-dashboard";
        break;
    }

    res.status(200).json({
      success: true,
      token,
      role: user.role,
      redirect,
      collection,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mustChangePassword: user.mustChangePassword || false,
        doctorType: user.doctorType || null, // if doctor
        patientType: user.patientType || null, // if patient
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// @desc    Register user (collection-specific)
// @route   POST /api/auth/register
// @access  Public (or Admin-only depending on requirements)
export const registerUser = async (req, res) => {
  try {
    console.log(
      "📝 Registration attempt:",
      JSON.stringify(
        {
          username: req.body.username,
          email: req.body.email,
          role: req.body.role,
        },
        null,
        2
      )
    );

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      patientType,
      doctorType,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: username, email, password, firstName, lastName, role",
      });
    }

    // Check if user already exists across all collections
    const { user: existingUser } = await findUserByCredentials(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const { user: existingEmailUser } = await findUserByCredentials(email);
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Create user in appropriate collection
    let newUser;
    let collection;

    if (role === "patient") {
      if (!patientType) {
        return res.status(400).json({
          success: false,
          message: "Patient type is required for patients",
        });
      }

      collection = "patients";
      newUser = await Patient.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        patientType,
        mustChangePassword: true,
      });
    } else if (role === "doctor") {
      if (!doctorType) {
        return res.status(400).json({
          success: false,
          message: "Doctor type is required for doctors",
        });
      }

      collection = "doctors";
      newUser = await Doctor.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        doctorType,
        specialization: doctorType,
        mustChangePassword: true,
      });
    } else if (role === "admin") {
      collection = "users";
      newUser = await Admin.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        mustChangePassword: false,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    console.log(
      `✅ User registered successfully in ${collection}:`,
      newUser._id
    );

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      success: true,
      token,
      collection,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      message: `User registered successfully in ${collection} collection`,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(400).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const userId = req.user.id;

    // Find user across all collections
    let user = null;
    let collection = null;

    // Check all collections
    const models = [
      { model: Admin, name: "users" },
      { model: Patient, name: "patients" },
      { model: Doctor, name: "doctors" },
      { model: User, name: "users" }, // Legacy
    ];

    for (const { model, name } of models) {
      user = await model.findById(userId).select("-password");
      if (user) {
        collection = name;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { ...user.toObject(), collection },
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export { generateToken };
export default { loginUser, registerUser, getMe };
