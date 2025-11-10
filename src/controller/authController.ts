import jwt from "jsonwebtoken";
import { hashPassword } from "../utils/handler";
import { Request, Response } from "express";
import { User } from "../model/user";
import { detector } from "../config/deviceDetector";

class AuthController {
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
}
