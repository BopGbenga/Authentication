import { Request, Response, NextFunction } from "express";
import { detector } from "../config/deviceDetector";
import passport from "passport";
import { sendEmailQueue } from "../Queues/UserVerificationQueues";

export const login = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userAgent = req.headers["user-agent"] as string;

    const ip =
      req.header("x-ip-address") ||
      req.header("x-forwarded-for") ||
      req.header("x-real-ip") ||
      req.socket.remoteAddress ||
      "Unknown";

    if (!userAgent) {
      return res.status(403).json({
        error: "forbidden",
      });
    }

    passport.authenticate(
      "local",
      async (err: Error, user: any, info: { message: string } | any) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            status: "FAILED",
            error: "Internal Server Error",
          });
        }

        if (!user) {
          return res.status(400).json({
            status: "FAILED",
            error: info.message || "Authentication failed",
          });
        }

        if (!user.isVerified) {
          return res.status(403).json({
            status: "FAILED",
            error: "Please verify your email before logging in",
          });
        }

        const deviceId = req.header("x-device-id");
        const agent = detector.detect(userAgent);
        const { device, os, client } = agent;

        const trustedDevices = `${device.model || os.name}-${client.name}/${
          client.version
        }-${client.type}${deviceId || ""}`;

        let isTrustedDevice = false;
        if (
          user.trustedDevices &&
          user.trustedDevices.includes(trustedDevices)
        ) {
          isTrustedDevice = true;
        }

        if (!isTrustedDevice) {
          user.trustedDevices = user.trustedDevices || [];
          user.trustedDevices.push(trustedDevices);
          await user.save();

          sendEmailQueue.add({
            user: {
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
            },
            agent,
            date: new Date().toLocaleString(),
            ip: ip,
          });
        }

        req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res.status(500).json({
              status: "FAILED",
              error: "Login failed",
            });
          }

          return res.status(200).json({
            status: "SUCCESS",
            message: "Login successful",
            user: {
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
              isVerified: user.isVerified,
            },
            newDevice: !isTrustedDevice,
          });
        });
      }
    )(req, res, next);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: "FAILED",
      error: "Internal server error",
    });
  }
};
