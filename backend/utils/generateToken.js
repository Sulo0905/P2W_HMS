import jwt from "jsonwebtoken";

export const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET, // Make sure you have this in your .env
    { expiresIn: "1d" } // token valid for 1 day
  );
};
