import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    unique: true,
  },
  code: String,
  expiresAt: {
    type: Date,
    index: true,
  },
});

export const passwordReset = mongoose.model(
  "paswordReset",
  passwordResetSchema
);
