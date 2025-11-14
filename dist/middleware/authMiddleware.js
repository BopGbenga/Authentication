"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const deviceDetector_1 = require("../config/deviceDetector");
const passport_1 = __importDefault(require("passport"));
const UserVerificationQueues_1 = require("../Queues/UserVerificationQueues");
const login = (req, res, next) => {
    try {
        const userAgent = req.headers["user-agent"];
        const ip = req.header("x-ip-address") ||
            req.header("x-forwarded-for") ||
            req.header("x-real-ip") ||
            req.socket.remoteAddress ||
            "Unknown";
        if (!userAgent) {
            return res.status(403).json({
                error: "forbidden",
            });
        }
        passport_1.default.authenticate("local", (err, user, info) => __awaiter(void 0, void 0, void 0, function* () {
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
            const agent = deviceDetector_1.detector.detect(userAgent);
            const { device, os, client } = agent;
            const trustedDevices = `${device.model || os.name}-${client.name}/${client.version}-${client.type}${deviceId || ""}`;
            let isTrustedDevice = false;
            if (user.trustedDevices &&
                user.trustedDevices.includes(trustedDevices)) {
                isTrustedDevice = true;
            }
            if (!isTrustedDevice) {
                user.trustedDevices = user.trustedDevices || [];
                user.trustedDevices.push(trustedDevices);
                yield user.save();
                UserVerificationQueues_1.sendEmailQueue.add({
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
        }))(req, res, next);
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            status: "FAILED",
            error: "Internal server error",
        });
    }
};
exports.login = login;
