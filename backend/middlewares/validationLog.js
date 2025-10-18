import {
  validatePatientData,
  validateHealthLogData,
} from "../utils/validationUtils.js";

// Middleware to validate patient data
export const validatePatient = (category) => {
  return (req, res, next) => {
    const errors = validatePatientData(req.body, category);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

// Middleware to validate health log data
export const validateHealthLog = (req, res, next) => {
  console.log("VALIDATION MIDDLEWARE - Request body:", req.body);
  const errors = validateHealthLogData(req.body);
  console.log("VALIDATION MIDDLEWARE - Errors:", errors);

  if (errors.length > 0) {
    console.log("VALIDATION FAILED - Returning 400 error");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  console.log("VALIDATION PASSED - Proceeding to controller");
  next();
};

// Middleware to validate MongoDB ObjectId
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!objectIdRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    next();
  };
};

// Middleware to validate pagination parameters
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive number",
    });
  }

  if (
    limit &&
    (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 1000)
  ) {
    return res.status(400).json({
      success: false,
      message: "Limit must be between 1 and 1000",
    });
  }

  next();
};

// Middleware to validate date range parameters
export const validateDateRange = (req, res, next) => {
  const { from, to } = req.query;

  if (from && isNaN(Date.parse(from))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "from" date format',
    });
  }

  if (to && isNaN(Date.parse(to))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid "to" date format',
    });
  }

  if (from && to && new Date(from) > new Date(to)) {
    return res.status(400).json({
      success: false,
      message: '"from" date cannot be after "to" date',
    });
  }

  next();
};
