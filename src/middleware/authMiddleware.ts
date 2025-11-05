import { Request, Response, NextFunction } from "express";
import { detector } from "../config/deviceDetector";
import { User } from "../model/user";
import passport from "passport";

const login = (req: Request, res: Response, next: NextFunction) => {
  try {
    const userAgent = req.header("x-ota-useragent");
    const ip = req.header("x-ip-address");
    if (!userAgent) {
      res.status(403).json({
        error: "forbidden",
      });
      return;
    }
    passport.authenticate(
      "local",
      (err: Error, user: any, info: { message: string } | any) => {
        if (err) {
          console.log(err);
          res.status(500).json({
            status: "FAILED",
            error: "Internal Server Error",
          });
          return;
        }
        if (!user) {
          res.status(400).json({
            status: "FAILED",
            error: info.message,
          });
          return;
        }

        const deviceId = req.header("x-device-id");
        const agent = detector.detect(userAgent);
        const { device, os, client } = agent;

        const trustedDevices = `${device.model || os.name}-${client.name}/${
          client.version
        }-${client.type}`;
        if (
          !user.trustedDevices ||
          !user.trustedDevices.includes(`${trustedDevices}${deviceId}`)
        ) {
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "FAILED",
      error: "ineternal server error",
    });
  }
};
