import ObstetricsPatient from "../models/ObstetricsPatient.js";
import fileService from "../services/fileService.js";
import { toIST } from "../utils/dateUtils.js";

class ObstetricsController {
  async getAllPatients(req, res) {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const filter = includeDeleted ? {} : { deleted: { $ne: true } };

      const patients = await ObstetricsPatient.find(filter).sort({
        createdAt: -1,
      });
      res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      console.error("Error fetching obstetrics patients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patients",
        error: error.message,
      });
    }
  }

  // GET single obstetrics patient by MongoDB _id
  async getPatientById(req, res) {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const filter = { _id: req.params.id };
      if (!includeDeleted) {
        filter.deleted = { $ne: true };
      }

      const patient = await ObstetricsPatient.findOne(filter);
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
      console.error("Error fetching obstetrics patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patient",
        error: error.message,
      });
    }
  }

  // GET single obstetrics patient by patientId
  async getPatientByPatientId(req, res) {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const filter = { patientId: req.params.patientId };
      if (!includeDeleted) {
        filter.deleted = { $ne: true };
      }

      const patient = await ObstetricsPatient.findOne(filter);
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
      console.error("Error fetching obstetrics patient by patientId:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch patient",
        error: error.message,
      });
    }
  }

  // POST create new obstetrics patient
  async createPatient(req, res) {
    try {
      const { name, age, phone, email, dueDate, pregnancyNumber, patientId } =
        req.body;

      if (!name || !age || !phone || !patientId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, age, phone, patientId",
        });
      }

      // Check if patientId already exists
      const existingPatient = await ObstetricsPatient.findOne({ patientId });
      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: "Patient ID already exists",
        });
      }

      const patient = new ObstetricsPatient({
        name,
        age,
        phone,
        email,
        dueDate,
        pregnancyNumber: pregnancyNumber || 1,
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
      console.error("Error creating obstetrics patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create patient",
        error: error.message,
      });
    }
  }

  // PUT update obstetrics patient
  async updatePatient(req, res) {
    try {
      const { name, age, phone, email, dueDate, pregnancyNumber } = req.body;

      const patient = await ObstetricsPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Update fields
      if (name !== undefined) patient.name = name;
      if (age !== undefined) patient.age = age;
      if (phone !== undefined) patient.phone = phone;
      if (email !== undefined) patient.email = email;
      if (dueDate !== undefined) patient.dueDate = dueDate;
      if (pregnancyNumber !== undefined)
        patient.pregnancyNumber = pregnancyNumber;

      patient.updatedAt = toIST();
      await patient.save();

      res.json({
        success: true,
        message: "Patient updated successfully",
        data: patient,
      });
    } catch (error) {
      console.error("Error updating obstetrics patient:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update patient",
        error: error.message,
      });
    }
  }

  // DELETE obstetrics patient (soft delete)
  async deletePatient(req, res) {
    try {
      const patient = await ObstetricsPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Use findByIdAndUpdate to bypass validation for soft delete
      await ObstetricsPatient.findByIdAndUpdate(
        req.params.id,
        {
          deleted: true,
          deletedAt: toIST(),
        },
        { runValidators: false }
      );

      res.json({
        success: true,
        message: "Patient deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting obstetrics patient:", error);
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
      const patient = await ObstetricsPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const {
        logType,
        from,
        to,
        loggedBy,
        trimester,
        page = 1,
        limit = 50,
        includeDeleted = "false",
      } = req.query;
      let logs = patient.logs || [];

      // Filter out deleted logs by default (unless includeDeleted=true)
      if (includeDeleted !== "true") {
        logs = logs.filter((log) => !log.deleted);
      }

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

      // Filter by trimester
      if (trimester) {
        logs = logs.filter((log) => log.trimester === parseInt(trimester));
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
      const patient = await ObstetricsPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const { logType, loggedBy, notes, attachments, ...logData } = req.body;

      if (!logType || !loggedBy) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: logType, loggedBy",
        });
      }

      const loggedAtDate = toIST();

      // Validate log data based on type
      if (logType === "prenatal_checkup") {
        const { week, bloodPressure, weight, fetalHeartRate } = logData;
        if (!week) {
          return res.status(400).json({
            success: false,
            message: "Week is required for prenatal checkup",
          });
        }

        if (week < 1 || week > 42) {
          return res.status(400).json({
            success: false,
            message: "Week must be between 1 and 42",
          });
        }
      }

      // Handle attachments
      let attachmentPaths = [];
      if (attachments && Array.isArray(attachments)) {
        attachmentPaths = await fileService.saveBase64AttachmentsToDisk(
          attachments,
          "ob"
        );
      }

      const newLog = {
        logType,
        loggedBy,
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
      const patient = await ObstetricsPatient.findById(req.params.id);
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
          "ob"
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

  // DELETE health log (soft delete)
  async deleteHealthLog(req, res) {
    try {
      const patient = await ObstetricsPatient.findById(req.params.id);
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

      patient.logs[logIndex].deleted = true;
      patient.logs[logIndex].deletedAt = toIST();
      patient.updatedAt = toIST();
      await patient.save();

      res.json({
        success: true,
        message: "Health log deleted successfully",
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
      const patient = await ObstetricsPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const { logType } = req.params;
      const logs = patient.logs.filter(
        (log) => log.logType === logType && !log.deleted
      );

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

  // GET pregnancy timeline
  async getTimeline(req, res) {
    try {
      const patient = await ObstetricsPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const logs = (patient.logs || []).filter((log) => !log.deleted);

      // Sort by loggedAt ascending for timeline
      logs.sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));

      // Group by week if available
      const timeline = logs.reduce((acc, log) => {
        const week = log.week || "Unknown";
        if (!acc[week]) {
          acc[week] = [];
        }
        acc[week].push(log);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          patient: {
            name: patient.name,
            dueDate: patient.dueDate,
            pregnancyNumber: patient.pregnancyNumber,
          },
          timeline,
        },
      });
    } catch (error) {
      console.error("Error fetching timeline:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch timeline",
        error: error.message,
      });
    }
  }

  // GET pregnancy progress
  async getProgress(req, res) {
    try {
      const patient = await ObstetricsPatient.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const logs = (patient.logs || []).filter((log) => !log.deleted);

      // Calculate progress metrics
      const totalLogs = logs.length;
      const logsByType = logs.reduce((acc, log) => {
        acc[log.logType] = (acc[log.logType] || 0) + 1;
        return acc;
      }, {});

      // Calculate current week if due date is available
      let currentWeek = null;
      if (patient.dueDate) {
        const dueDate = new Date(patient.dueDate);
        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        currentWeek = Math.max(1, 40 - diffWeeks); // Assuming 40 weeks pregnancy
      }

      // Get recent vital signs
      const recentVitals = logs
        .filter((log) => log.logType === "prenatal_checkup")
        .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
        .slice(0, 5);

      res.json({
        success: true,
        data: {
          patient: {
            name: patient.name,
            dueDate: patient.dueDate,
            pregnancyNumber: patient.pregnancyNumber,
          },
          progress: {
            currentWeek,
            totalLogs,
            logsByType,
            recentVitals,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch progress",
        error: error.message,
      });
    }
  }
}

export default ObstetricsController;
