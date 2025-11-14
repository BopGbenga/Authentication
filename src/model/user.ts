import mongoose from "mongoose";
import bcrpyt from "bcrypt";
import { required, string } from "joi";

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "please enter your first name"],
    },
    middlename: {
      type: String,
    },
    lastname: {
      type: String,
      required: [true, "please enter your last name"],
    },
    email: {
      type: String,
      required: [true, "please enter an email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "please enter a password"],
      minlength: [6, "password should be at least 6 character long"],
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    gender: {
      type: String,
      enum: ["Male", "female", "Non-binary", "other"],
    },
    phoneNumber: {
      type: String,
      maxLength: 50,
    },
    trustedDevices: {
      type: [String],
      required: true,
    },
    resetToken: {
      type: String,
      default: null,
      required: false,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
      required: false,
    },
    verificationToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.statics.login = async function login(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrpyt.compare(password, user.password);
    if (auth && user.isVerified) return user;
    if (auth && !user.isVerified) {
      throw new Error("please verfiy your account");
    }
  }
  throw new Error("incorrect mail/password");
};

export const User = mongoose.model("User", userSchema);
