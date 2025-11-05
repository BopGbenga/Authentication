"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const deviceDetector_1 = require("../config/deviceDetector");
const passport_1 = __importDefault(require("passport"));
const login = (req, res, next) => {
    try {
        const userAgent = req.header("x-ota-useragent");
        const ip = req.header("x-ip-address");
        if (!userAgent) {
            res.status(403).json({
                error: "forbidden",
            });
            return;
        }
        passport_1.default.authenticate("local", (err, user, info) => {
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
            const agent = deviceDetector_1.detector.detect(userAgent);
            const { device, os, client } = agent;
            const trustedDevices = `${device.model || os.name}-${client.name}/${client.version}-${client.type}`;
            if (!user.trustedDevices ||
                !user.trustedDevices.includes(`${trustedDevices}${deviceId}`)) {
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: "FAILED",
            error: "ineternal server error",
        });
    }
};
