import jwt from "jsonwebtoken";
import { hashPassword } from "../utils/handler";
import { Request, Response } from "express";
import { User } from "../model/user";
import { detector } from "../config/deviceDetector";
import bcrypt from "bcrypt";
import { sendPasswordResetQueue } from "../Queues/UserVerificationQueues";
import { sendEmailQueue } from "../Queues/UserVerificationQueues";
import crypto from "crypto";

export class AuthController {
  static async signup(req: Request, res: Response) {
    const { firstname, lastname, email, password } = req.body;
    const userAgent = req.headers["user-agent"] as string;

    try {
      if (!userAgent) {
        return res.status(403).json({ error: "forbidden" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          message: "User already exist",
        });
        return;
      }
      const verificationToken = crypto.randomBytes(32).toString("hex");

      const user = await User.create({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim().toLowerCase(),
        password: await hashPassword(password),
        verificationToken,
        trustedDevices: [],
      });

      const agent = detector.detect(userAgent);
      const { device, os, client } = agent;

      const trustedDevices = `${device.model || "UnknownDevice"}-${
        os.name || "UnknownOS"
      }/${client.name || "UnknownBrowser"}-${client.version || "0.0"}-${
        client.type || "UnknownType"
      }`;

      sendEmailQueue.add({
        user: {
          email: user.email,
          firstname: user.firstname,
          verificationToken: user.verificationToken,
        },
      });

      return res.status(201).json({
        status: "COMPLETE",
        message: "sign up successful",
        user: user.email,
        trustedDevices,
      });
    } catch (error: any) {
      console.log(error.message);
      return res.status(500).json({
        status: "failed",
        error: "Internal server error",
      });
    }
  }
  // In your AuthController
  static async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;

    try {
      if (!token || typeof token !== "string") {
        return res.status(400).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Invalid Token</h1>
            <p>The verification link is invalid.</p>
          </body>
        </html>
      `);
      }

      const user = await User.findOne({ verificationToken: token });

      if (!user) {
        return res.status(404).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>❌ Invalid or Expired Link</h1>
            <p>This verification link is invalid or has expired.</p>
          </body>
        </html>
      `);
      }

      if (user.isVerified) {
        return res.status(200).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ Already Verified</h1>
            <p>Your email has already been verified.</p>
            <a href="${
              process.env.FRONTEND_URL || process.env.PREFIX_URL
            }/login" 
               style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                      background-color: #4CAF50; color: white; text-decoration: none; 
                      border-radius: 5px;">
              Go to Login
            </a>
          </body>
        </html>
      `);
      }

      // Verify the user
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      return res.status(200).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Email Verified Successfully!</h1>
          <p>Your email has been verified. You can now log in to your account.</p>
          <a href="${process.env.FRONTEND_URL || process.env.PREFIX_URL}/login" 
             style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                    background-color: #4CAF50; color: white; text-decoration: none; 
                    border-radius: 5px;">
            Go to Login
          </a>
        </body>
      </html>
    `);
    } catch (error: any) {
      console.error("Verification error:", error.message);
      return res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Error</h1>
          <p>Something went wrong. Please try again later.</p>
        </body>
      </html>
    `);
    }
  }

  static async getAUser(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          status: false,
        });
      }
      return res.status(200).json({
        message: "user fetched successfully",
        status: true,
        data: user,
      });
    } catch (error) {
      return res.status(500).json({
        message: "internal server error",
        status: false,
      });
    }
  }

  static async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const users = await User.find();
      return res.status(200).json({
        message: "users fetched successfully",
        status: true,
        data: users,
      });
    } catch (error) {
      return res.status(500).json({
        message: "internal server error",
        status: false,
      });
    }
  }

  static async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });
      if (!updatedUser) {
        return res.status(404).json({
          message: "user not found",
          status: false,
        });
      }
      return res.status(200).json({
        message: "user updated successfully",
        status: true,
        data: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        message: "internal server error",
        status: false,
      });
    }
  }

  static async updatePassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, newPassword } = req.body;
      if (!token) {
        return res.status(400).json({
          message: "Reset token is required",
          status: false,
        });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: "password must be 6 characters long",
          status: false,
        });
      }
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({
          message: "invalid or expired token",
          status: false,
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      user.resetToken = null;
      user.resetTokenExpires = null;

      await user.save();

      return res.status(200).json({
        message: "password updated successfully",
        status: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "internal server error",
        status: false,
      });
    }
  }

  static async changePasswordMail(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user || !user.isVerified) {
        return res.status(200).json({
          message: "If this email exists, a reset code has been sent",
        });
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const randomNumber4 = Math.floor(1000 + Math.random() * 9000).toString();

      user.resetToken = resetToken;
      user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      await sendPasswordResetQueue.add({ user });

      return res.status(200).json({
        message: "please enter the 4 digit code sent to your mail",
        email,
        token: resetToken,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "FAILED",
        error: "Internal server error",
      });
    }
  }
}
