// Helper: Sri Lanka Standard Time (UTC+5:30)
export const toIST = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  return new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
};

// Format date to ISO string in IST
export const toISTString = (dateInput) => {
  return toIST(dateInput).toISOString();
};

// Get current timestamp in IST
export const getCurrentISTTimestamp = () => {
  return toIST().getTime();
};

// Check if date is in the future
export const isFutureDate = (dateInput) => {
  const inputDate = new Date(dateInput);
  const now = toIST();
  return inputDate > now;
};

// Check if date is in the past
export const isPastDate = (dateInput) => {
  const inputDate = new Date(dateInput);
  const now = toIST();
  return inputDate < now;
};

// Calculate difference in days between two dates
export const daysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calculate difference in weeks between two dates
export const weeksDifference = (date1, date2) => {
  const days = daysDifference(date1, date2);
  return Math.ceil(days / 7);
};

// Format date for display (DD/MM/YYYY)
export const formatDateForDisplay = (dateInput) => {
  const date = new Date(dateInput);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format datetime for display (DD/MM/YYYY HH:MM)
export const formatDateTimeForDisplay = (dateInput) => {
  const date = new Date(dateInput);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
