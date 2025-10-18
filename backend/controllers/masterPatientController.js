import MasterPatient from "../models/MasterPatient.js";
import EntPatient from "../models/EntPatient.js";
import ObstetricsPatient from "../models/ObstetricsPatient.js";
import {
  validatePatientId,
  findSimilarPatientIds,
} from "../utils/patientIdUtils.js";

class MasterPatientController {
  // POST register new patien
  async registerPatient(req, res) {
    try {
      const {
        patientId,
        fullName,
        age,
        gender,
        contact,
        category,
        entInfo,
        obstetricsInfo,
      } = req.body;

      // Basic required fields validation (removed patientId requirement)
      if (!fullName || !age || !category || (category === "ENT" && !gender)) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Generate patientId if not provided
      let finalPatientId = patientId;
      if (!finalPatientId) {
        // Generate a unique patient ID based on category and timestamp
        const categoryPrefix =
          category === "ENT"
            ? "ENT"
            : category === "Obstetrics"
            ? "OBS"
            : "GEN";
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        finalPatientId = `${categoryPrefix}${timestamp}`;

        // Ensure uniqueness (in rare case of collision)
        let counter = 1;
        while (await MasterPatient.findOne({ patientId: finalPatientId })) {
          finalPatientId = `${categoryPrefix}${timestamp}${counter}`;
          counter++;
        }
      } else {
        // If patientId is provided, ensure it's unique
        const existing = await MasterPatient.findOne({
          patientId: finalPatientId,
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "Patient ID already exists",
          });
        }
      }

      const master = new MasterPatient({
        patientId: finalPatientId,
        fullName,
        age,
        gender,
        contact,
        category,
        entInfo,
      });

      // Create category-specific record and link
      if (category === "ENT") {
        const entPatient = new EntPatient({
          patientId: finalPatientId,
          name: fullName,
          age,
          gender,
          phone: contact?.phone || "",
          email: contact?.email,
          ...(entInfo?.surgeryDate ? { surgeryDate: entInfo.surgeryDate } : {}),
          ...(entInfo?.surgeryType ? { surgeryType: entInfo.surgeryType } : {}),
        });
        await entPatient.save();
        master.entRecordId = entPatient._id;
      } else if (category === "Obstetrics") {
        const obstPatient = new ObstetricsPatient({
          patientId: finalPatientId,
          name: fullName,
          age,
          phone: contact?.phone || "",
          email: contact?.email,
          dueDate: obstetricsInfo?.estimatedDueDate,
          pregnancyNumber: obstetricsInfo?.gravidaParity
            ? Number(
                (obstetricsInfo.gravidaParity.match(/G(\d+)/i) || [])[1]
              ) || 1
            : 1,
        });
        await obstPatient.save();
        master.obstetricsRecordId = obstPatient._id;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid category" });
      }

      await master.save();
      res.status(201).json({
        success: true,
        message: "Patient registered",
        data: master,
      });
    } catch (error) {
      console.error("Error registering patient:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message,
      });
    }
  }

  // POST quick patient ID check (just existence)
  async checkPatientId(req, res) {
    try {
      const { patientId } = req.body;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: "Patient ID is required",
        });
      }

      // Validate patient ID format
      const validation = validatePatientId(patientId);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
          exists: false,
        });
      }

      const patient = await MasterPatient.findOne({
        patientId: validation.normalizedId,
      }).select("patientId fullName category");

      if (!patient) {
        // Try to find similar patient IDs for suggestions
        const allPatients = await MasterPatient.find({}).select("patientId");
        const existingIds = allPatients.map((p) => p.patientId);
        const suggestions = findSimilarPatientIds(
          validation.normalizedId,
          existingIds
        );

        return res.status(404).json({
          success: false,
          message: "Patient ID not found",
          exists: false,
          suggestions: suggestions.slice(0, 3), // Top 3 suggestions
          searchedId: validation.normalizedId,
        });
      }

      res.json({
        success: true,
        exists: true,
        patient: {
          patientId: patient.patientId,
          fullName: patient.fullName,
          category: patient.category,
        },
      });
    } catch (error) {
      console.error("Error checking patient ID:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check patient ID",
        error: error.message,
      });
    }
  }

  // GET search patients by partial ID or name
  async searchPatients(req, res) {
    try {
      const { query, limit = 10 } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters",
        });
      }

      // Search by patient ID or name
      const searchRegex = new RegExp(query, "i");
      const patients = await MasterPatient.find({
        $or: [{ patientId: searchRegex }, { fullName: searchRegex }],
      })
        .select("patientId fullName category age gender contact")
        .limit(parseInt(limit))
        .sort({ patientId: 1 });

      res.json({
        success: true,
        count: patients.length,
        data: patients,
      });
    } catch (error) {
      console.error("Error searching patients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search patients",
        error: error.message,
      });
    }
  }
}

export default MasterPatientController;
