import EntPatient from "../models/EntPatient.js";
import fileService from "../services/fileService.js";
import { toIST } from "../utils/dateUtils.js";

class EntController {
  async getAllPatients(req, res) {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const filter = includeDeleted ? {} : { deleted: { $ne: true } };

      const patients = await EntPatient.find(filter).sort({ createdAt: -1 });
      res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      console.error("Error fetching ENT patients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patients",
        error: error.message,
      });
    }
  }

  // GET single ENT patient by MongoDB _id
  async getPatientById(req, res) {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const filter = { _id: req.params.id };
      if (!includeDeleted) {
        filter.deleted = { $ne: true };
      }

      const patient = await EntPatient.findOne(filter);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error("Error fetching ENT patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patient",
        error: error.message,
      });
    }
  }

  // GET single ENT patient by patientId
  async getPatientByPatientId(req, res) {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const filter = { patientId: req.params.patientId };
      if (!includeDeleted) {
        filter.deleted = { $ne: true };
      }

      const patient = await EntPatient.findOne(filter);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error("Error fetching ENT patient by patientId:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patient",
        error: error.message,
      });
    }
  }

  // POST create new ENT patient
  async createPatient(req, res) {
    try {
      const {
        name,
        age,
        gender,
        phone,
        email,
        surgeryDate,
        surgeryType,
        patientId,
      } = req.body;

      if (!name || !age || !gender || !phone || !patientId) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: name, age, gender, phone, patientId",
        });
      }

      // Check if patientId already exists
      const existingPatient = await EntPatient.findOne({ patientId });
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: "Patient ID already exists",
        });
      }

      const patient = new EntPatient({
        name,
        age,
        gender,
        phone,
        email,
        surgeryDate,
        surgeryType,
        patientId,
        createdAt: toIST(),
        updatedAt: toIST(),
      });

      await patient.save();
      res.status(201).json({
        success: true,
        message: "Patient created successfully",
        data: patient,
      });
    } catch (error) {
      console.error("Error creating ENT patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create patient",
        error: error.message,
      });
    }
  }

  // PUT update ENT patient
  async updatePatient(req, res) {
    try {
      const { name, age, gender, phone, email, surgeryDate, surgeryType } =
        req.body;

      const patient = await EntPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Update fields
      if (name !== undefined) patient.name = name;
      if (age !== undefined) patient.age = age;
      if (gender !== undefined) patient.gender = gender;
      if (phone !== undefined) patient.phone = phone;
      if (email !== undefined) patient.email = email;
      if (surgeryDate !== undefined) patient.surgeryDate = surgeryDate;
      if (surgeryType !== undefined) patient.surgeryType = surgeryType;

      patient.updatedAt = toIST();
      await patient.save();

      res.json({
        success: true,
        message: "Patient updated successfully",
        data: patient,
      });
    } catch (error) {
      console.error("Error updating ENT patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update patient",
        error: error.message,
      });
    }
  }

  // DELETE ENT patient (hard delete)
  async deletePatient(req, res) {
    try {
      console.log("HARD DELETE PATIENT REQUEST:", {
        patientId: req.params.id,
        method: req.method,
        url: req.url,
      });

      const result = await EntPatient.findByIdAndDelete(req.params.id);

      if (!result) {
        console.log("Patient not found for deletion:", req.params.id);
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      console.log("Patient permanently deleted:", req.params.id);
      res.json({
        success: true,
        message:
          "Patient and all associated data permanently deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting ENT patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete patient",
        error: error.message,
      });
    }
  }

  // GET health logs for a patient
  async getHealthLogs(req, res) {
    try {
      const patient = await EntPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const { logType, from, to, loggedBy, page = 1, limit = 50 } = req.query;
      let logs = patient.logs || [];

      // Filter by logType
      if (logType) {
        logs = logs.filter((log) => log.logType === logType);
      }

      // Filter by date range
      if (from || to) {
        logs = logs.filter((log) => {
          const logDate = new Date(log.loggedAt);
          if (from && logDate < new Date(from)) return false;
          if (to && logDate > new Date(to)) return false;
          return true;
        });
      }

      // Filter by loggedBy
      if (loggedBy) {
        logs = logs.filter(
          (log) =>
            log.loggedBy &&
            log.loggedBy.toLowerCase().includes(loggedBy.toLowerCase())
        );
      }

      // Sort by loggedAt descending
      logs.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedLogs = logs.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          logs: paginatedLogs,
          totalCount: logs.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(logs.length / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching health logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch health logs",
        error: error.message,
      });
    }
  }

  // POST add health log
  async addHealthLog(req, res) {
    try {
      console.log("ADD HEALTH LOG REQUEST:", {
        patientId: req.params.id,
        body: req.body,
        method: req.method,
        url: req.url,
      });

      const patient = await EntPatient.findById(req.params.id);
      if (!patient) {
        console.log("Patient not found:", req.params.id);
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const { logType, loggedBy, notes, attachments, ...logData } = req.body;

      console.log("Extracted fields:", { logType, loggedBy, notes, logData });

      if (!logType) {
        console.log("Validation failed - Missing logType");
        return res.status(400).json({
          success: false,
          message: "Log type is required",
        });
      }

      // Use provided loggedBy or empty string if not provided
      const loggedByValue = loggedBy || "";

      const loggedAtDate = toIST();

      // Use the loggedBy value (either provided or default)

      // No validation for medication - all fields are optional

      // Handle attachments
      let attachmentPaths = [];
      if (attachments && Array.isArray(attachments)) {
        attachmentPaths = await fileService.saveBase64AttachmentsToDisk(
          attachments,
          "ent"
        );
      }

      const newLog = {
        logType,
        loggedBy: loggedByValue,
        loggedAt: loggedAtDate,
        notes,
        attachments: attachmentPaths,
        ...logData,
      };

      patient.logs.push(newLog);
      patient.updatedAt = toIST();
      await patient.save();

      res.status(201).json({
        success: true,
        message: "Health log added successfully",
        data: newLog,
      });
    } catch (error) {
      console.error("Error adding health log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add health log",
        error: error.message,
      });
    }
  }

  // PUT update health log
  async updateHealthLog(req, res) {
    try {
      const patient = await EntPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const logIndex = patient.logs.findIndex(
        (log) => log._id.toString() === req.params.logId
      );
      if (logIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Health log not found",
        });
      }

      const { attachments, ...updateData } = req.body;

      // Handle attachments if provided
      if (attachments && Array.isArray(attachments)) {
        const attachmentPaths = await fileService.saveBase64AttachmentsToDisk(
          attachments,
          "ent"
        );
        updateData.attachments = attachmentPaths;
      }

      // Update log fields
      Object.assign(patient.logs[logIndex], updateData);
      patient.updatedAt = toIST();
      await patient.save();

      res.json({
        success: true,
        message: "Health log updated successfully",
        data: patient.logs[logIndex],
      });
    } catch (error) {
      console.error("Error updating health log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update health log",
        error: error.message,
      });
    }
  }

  // DELETE health log (hard delete)
  async deleteHealthLog(req, res) {
    try {
      console.log("HARD DELETE LOG REQUEST:", {
        patientId: req.params.id,
        logId: req.params.logId,
        method: req.method,
        url: req.url,
      });

      const result = await EntPatient.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { logs: { _id: req.params.logId } },
          $set: { updatedAt: toIST() },
        },
        { new: true }
      );

      if (!result) {
        console.log("Patient not found:", req.params.id);
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Check if the log was actually removed
      const logWasRemoved = !result.logs.some(
        (log) => log._id.toString() === req.params.logId
      );

      if (!logWasRemoved) {
        console.log("Health log not found. Log ID:", req.params.logId);
        return res.status(404).json({
          success: false,
          message: "Health log not found",
        });
      }

      console.log("Log permanently deleted successfully");
      res.json({
        success: true,
        message: "Health log permanently deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting health log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete health log",
        error: error.message,
      });
    }
  }

  // GET logs by type
  async getLogsByType(req, res) {
    try {
      const patient = await EntPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const { logType } = req.params;
      const logs = patient.logs.filter((log) => log.logType === logType);

      // Sort by loggedAt descending
      logs.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error("Error fetching logs by type:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch logs",
        error: error.message,
      });
    }
  }
}

export default EntController;
