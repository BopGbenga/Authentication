import jwt from "jsonwebtoken";
import { hashPassword } from "../utils/handler";
import { Request, Response } from "express";
import { User } from "../model/user";
import { detector } from "../config/deviceDetector";
import bcrypt from "bcrypt";

export class AuthController {
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
        email: email.trim().lowercase(),
        password: await hashPassword(password),
        trustedDevices: [],
      });
      const agent = detector.detect(userAgent);
      const { device, os, client } = agent;
      const trustedDevices = `${device.model || os.name}-${client.name}/${
        client.version
      }-${client.type}-`;
      res.status(201).json({
        status: "COMPLETE",
        message: "sign up successful",
        user: user.email,
        trustedDevices,
      });
    } catch (error: any) {
      console.log(error.message);
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
        message: "users fetchee successfully",
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
      const userId = req.params;
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
        message: "user updated succesfully",
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
          staus: false,
        });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: "password must be 6 charachters long",
          status: false,
        });
      }
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({
          message: "invalid  or expired token",
          Status: false,
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
      const user = await User.findOne({ where: { email } });
      if (user) {
        const randomNumber1 = Math.floor(Math.random() * 10).toString();
        const randomNumber4 = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(4, randomNumber1);
      }
      {
      }
    } catch (error) {}
  }
}
