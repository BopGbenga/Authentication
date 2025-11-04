import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const hashPassword = async (password: any) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
