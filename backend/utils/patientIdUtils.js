/**
 * Patient ID Validation and Generation Utilities
 */

// Common patient ID patterns
const ID_PATTERNS = {
  // Standard format: P followed by 3-4 digits (P001, P1234)
  STANDARD: /^[Pp]\d{3,4}$/,

  // Numeric only: 3-6 digits (123, 7588)
  NUMERIC: /^\d{3,6}$/,

  // Hospital format: 2 letters + 4-6 digits (AB1234, HC123456)
  HOSPITAL: /^[A-Za-z]{2}\d{4,6}$/,

  // Extended format: Department + number (ENT001, OBS123)
  DEPARTMENT: /^(ENT|OBS|GEN|PED|CAR)\d{3,4}$/i,
};

/**
 * Validate patient ID format
 * @param {string} patientId - The patient ID to validate
 * @returns {object} - Validation result with isValid and format type
 */
export const validatePatientId = (patientId) => {
  if (!patientId || typeof patientId !== "string") {
    return {
      isValid: false,
      error: "Patient ID is required",
      format: null,
    };
  }

  const trimmedId = patientId.trim();

  if (trimmedId.length < 3) {
    return {
      isValid: false,
      error: "Patient ID must be at least 3 characters",
      format: null,
    };
  }

  if (trimmedId.length > 10) {
    return {
      isValid: false,
      error: "Patient ID cannot exceed 10 characters",
      format: null,
    };
  }

  // Check against known patterns
  for (const [formatName, pattern] of Object.entries(ID_PATTERNS)) {
    if (pattern.test(trimmedId)) {
      return {
        isValid: true,
        error: null,
        format: formatName,
        normalizedId: normalizePatientId(trimmedId, formatName),
      };
    }
  }

  // If no pattern matches, check if it's alphanumeric
  if (/^[A-Za-z0-9]+$/.test(trimmedId)) {
    return {
      isValid: true,
      error: null,
      format: "CUSTOM",
      normalizedId: trimmedId.toUpperCase(),
    };
  }

  return {
    isValid: false,
    error:
      "Patient ID contains invalid characters. Use only letters and numbers.",
    format: null,
  };
};

/**
 * Normalize patient ID based on format
 * @param {string} patientId - The patient ID to normalize
 * @param {string} format - The detected format
 * @returns {string} - Normalized patient ID
 */
export const normalizePatientId = (patientId, format) => {
  const trimmed = patientId.trim();

  switch (format) {
    case "STANDARD":
      // Ensure P is uppercase
      return "P" + trimmed.substring(1);

    case "NUMERIC":
      // Keep as is, but ensure it's a string
      return trimmed;

    case "HOSPITAL":
    case "DEPARTMENT":
      // Convert to uppercase
      return trimmed.toUpperCase();

    default:
      return trimmed.toUpperCase();
  }
};

/**
 * Generate patient ID suggestions based on existing IDs
 * @param {string} category - Patient category (ENT, Obstetrics, etc.)
 * @param {Array} existingIds - Array of existing patient IDs
 * @returns {Array} - Array of suggested IDs
 */
export const generatePatientIdSuggestions = (
  category = "GEN",
  existingIds = []
) => {
  const suggestions = [];
  const categoryCode = category.substring(0, 3).toUpperCase();

  // Generate department-based IDs
  for (let i = 1; i <= 5; i++) {
    const id = `${categoryCode}${String(i).padStart(3, "0")}`;
    if (!existingIds.includes(id)) {
      suggestions.push(id);
    }
  }

  // Generate standard P-format IDs
  for (let i = 1; i <= 5; i++) {
    const id = `P${String(Math.floor(Math.random() * 9000) + 1000)}`;
    if (!existingIds.includes(id)) {
      suggestions.push(id);
    }
  }

  // Generate numeric IDs
  for (let i = 1; i <= 3; i++) {
    const id = String(Math.floor(Math.random() * 90000) + 10000);
    if (!existingIds.includes(id)) {
      suggestions.push(id);
    }
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
};

/**
 * Check if patient ID might be a typo of an existing ID
 * @param {string} inputId - The input patient ID
 * @param {Array} existingIds - Array of existing patient IDs
 * @returns {Array} - Array of possible matches
 */
export const findSimilarPatientIds = (inputId, existingIds) => {
  if (!inputId || !Array.isArray(existingIds)) return [];

  const input = inputId.toLowerCase();
  const suggestions = [];

  existingIds.forEach((existingId) => {
    const existing = existingId.toLowerCase();

    // Exact match (case insensitive)
    if (input === existing) {
      suggestions.push({
        id: existingId,
        similarity: 1.0,
        reason: "exact_match",
      });
      return;
    }

    // Length difference check
    const lengthDiff = Math.abs(input.length - existing.length);
    if (lengthDiff > 2) return; // Skip if too different

    // Calculate similarity score
    let matches = 0;
    const minLength = Math.min(input.length, existing.length);

    for (let i = 0; i < minLength; i++) {
      if (input[i] === existing[i]) matches++;
    }

    const similarity = matches / Math.max(input.length, existing.length);

    // Include if similarity is high enough
    if (similarity >= 0.7) {
      let reason = "similar";
      if (lengthDiff === 1) reason = "typo";
      if (similarity >= 0.9) reason = "very_similar";

      suggestions.push({
        id: existingId,
        similarity,
        reason,
      });
    }
  });

  // Sort by similarity score
  return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
};

/**
 * Validate patient ID with database check
 * @param {string} patientId - The patient ID to validate
 * @param {Function} checkExistence - Function to check if ID exists in database
 * @returns {object} - Comprehensive validation result
 *
 */

import asyncHandler from "express-async-handler";

export const validatePatientIdWithDB = asyncHandler(
  async (patientId, checkExistence) => {
    // First, validate format
    const formatValidation = validatePatientId(patientId);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    try {
      // Check if ID exists in database
      const exists = await checkExistence(formatValidation.normalizedId);

      return {
        ...formatValidation,
        exists,
        message: exists
          ? "Patient ID found"
          : "Patient ID not found in database",
      };
    } catch (error) {
      return {
        ...formatValidation,
        exists: false,
        error: "Database check failed",
        message: "Unable to verify patient ID existence",
      };
    }
  }
);
