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
}
