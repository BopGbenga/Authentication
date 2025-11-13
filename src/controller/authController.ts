import jwt from "jsonwebtoken";
import { hashPassword } from "../utils/handler";
import { Request, Response } from "express";
import { User } from "../model/user";
import { detector } from "../config/deviceDetector";
import bcrypt from "bcrypt";
import { sendPasswordResetQueue } from "../Queues/UserVerificationQueues";
import { sendEmailQueue } from "../Queues/UserVerificationQueues";
import crypto from "crypto";
import * as UAParser from "ua-parser-js";

export class AuthController {
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
          status: false,
        });
      }

      // find user using Mongoose
      const user = await User.findOne({ email }).exec();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // parse device info
      const rawUA = (req.headers["user-agent"] as string) || "";
      const parser = new UAParser.UAParser(rawUA);
      const uaResult = parser.getResult();

      const ipAddress =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "Unknown IP";

      const deviceKey = `${uaResult.browser.name ?? "Unknown"}|${
        uaResult.os.name ?? "Unknown"
      }|${ipAddress}`;

      if (!Array.isArray(user.trustedDevices)) user.trustedDevices = [];
      const isTrusted = user.trustedDevices.includes(deviceKey);

      // if device not trusted, optionally queue suspicious login email
      if (!isTrusted) {
        await sendEmailQueue.add("suspicious-login", {
          user: {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
          },
          agent: {
            device: {
              model: uaResult.device.model,
              type: uaResult.device.type,
            },
            os: { name: uaResult.os.name, version: uaResult.os.version },
            client: {
              name: uaResult.browser.name,
              version: uaResult.browser.version,
            },
          },
          date: new Date().toISOString(),
          ip: ipAddress,
        });

        // add device to trusted devices for next login
        user.trustedDevices.push(deviceKey);
        await user.save();
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "2d" }
      );
      return res.status(200).json({
        message: "Login successful",
        status: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
        },
        device: {
          browser: uaResult.browser.name || "Unknown browser",
          os: uaResult.os.name || "Unknown OS",
          device: uaResult.device.model || uaResult.device.type || "Desktop",
          ip: ipAddress,
        },
        isTrusted,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error",
        status: false,
        error: (error as Error).message,
      });
    }
  }

  static async signup(req: Request, res: Response) {
    const { firstname, lastname, email, password } = req.body;
    const userAgent = req.header("x-ota-useragent");
    try {
      if (!userAgent) {
        res.status(403).json({ error: "forbidden" });
        return;
      }
      if (!firstname || typeof firstname !== "string") {
        res.status(400).json({
          status: "failed",
          error: "please enter your first name",
        });
        return;
      }
      const user = await User.create({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim().toLowerCase(),
        password: await hashPassword(password),
        trustedDevices: [],
      });
      const agent = detector.detect(userAgent);
      const { device, os, client } = agent;
      const trustedDevices = `${device.model || os.name}-${client.name}/${
        client.version
      }-${client.type}-`;
      sendEmailQueue.add({ user });
      res.status(201).json({
        status: "COMPLETE",
        message: "sign up successful",
        user: user.email,
        trustedDevices,
      });
    } catch (error: any) {
      console.log(error.message);
      res.status(500).json({
        status: "failed",
        error: "Internal server error",
      });
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
