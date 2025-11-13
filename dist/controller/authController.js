"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const handler_1 = require("../utils/handler");
const user_1 = require("../model/user");
const deviceDetector_1 = require("../config/deviceDetector");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserVerificationQueues_1 = require("../Queues/UserVerificationQueues");
const UserVerificationQueues_2 = require("../Queues/UserVerificationQueues");
const crypto_1 = __importDefault(require("crypto"));
const UAParser = __importStar(require("ua-parser-js"));
class AuthController {
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({
                        message: "Email and password are required",
                        status: false,
                    });
                }
                // find user using Mongoose
                const user = yield user_1.User.findOne({ email }).exec();
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                // check password
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ message: "Invalid credentials" });
                }
                // parse device info
                const rawUA = req.headers["user-agent"] || "";
                const parser = new UAParser.UAParser(rawUA);
                const uaResult = parser.getResult();
                const ipAddress = req.headers["x-forwarded-for"] ||
                    req.socket.remoteAddress ||
                    "Unknown IP";
                const deviceKey = `${(_a = uaResult.browser.name) !== null && _a !== void 0 ? _a : "Unknown"}|${(_b = uaResult.os.name) !== null && _b !== void 0 ? _b : "Unknown"}|${ipAddress}`;
                if (!Array.isArray(user.trustedDevices))
                    user.trustedDevices = [];
                const isTrusted = user.trustedDevices.includes(deviceKey);
                // if device not trusted, optionally queue suspicious login email
                if (!isTrusted) {
                    yield UserVerificationQueues_2.sendEmailQueue.add("suspicious-login", {
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
                    yield user.save();
                }
                // generate JWT
                const token = jsonwebtoken_1.default.sign({
                    id: user.id,
                    email: user.email,
                }, process.env.JWT_SECRET, { expiresIn: "2d" });
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
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({
                    message: "Internal server error",
                    status: false,
                    error: error.message,
                });
            }
        });
    }
    static signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const user = yield user_1.User.create({
                    firstname: firstname.trim(),
                    lastname: lastname.trim(),
                    email: email.trim().toLowerCase(),
                    password: yield (0, handler_1.hashPassword)(password),
                    trustedDevices: [],
                });
                const agent = deviceDetector_1.detector.detect(userAgent);
                const { device, os, client } = agent;
                const trustedDevices = `${device.model || os.name}-${client.name}/${client.version}-${client.type}-`;
                UserVerificationQueues_2.sendEmailQueue.add({ user });
                res.status(201).json({
                    status: "COMPLETE",
                    message: "sign up successful",
                    user: user.email,
                    trustedDevices,
                });
            }
            catch (error) {
                console.log(error.message);
                res.status(500).json({
                    status: "failed",
                    error: "Internal server error",
                });
            }
        });
    }
    static getAUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.params.id;
                const user = yield user_1.User.findById(userId);
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
            }
            catch (error) {
                return res.status(500).json({
                    message: "internal server error",
                    status: false,
                });
            }
        });
    }
    static getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield user_1.User.find();
                return res.status(200).json({
                    message: "users fetched successfully",
                    status: true,
                    data: users,
                });
            }
            catch (error) {
                return res.status(500).json({
                    message: "internal server error",
                    status: false,
                });
            }
        });
    }
    static updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.params.id;
                const updateData = req.body;
                const updatedUser = yield user_1.User.findByIdAndUpdate(userId, updateData, {
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
            }
            catch (error) {
                return res.status(500).json({
                    message: "internal server error",
                    status: false,
                });
            }
        });
    }
    static updatePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const user = yield user_1.User.findOne({
                    resetToken: token,
                    resetTokenExpires: { $gt: new Date() },
                });
                if (!user) {
                    return res.status(400).json({
                        message: "invalid or expired token",
                        status: false,
                    });
                }
                const salt = yield bcrypt_1.default.genSalt(10);
                user.password = yield bcrypt_1.default.hash(newPassword, salt);
                user.resetToken = null;
                user.resetTokenExpires = null;
                yield user.save();
                return res.status(200).json({
                    message: "password updated successfully",
                    status: true,
                });
            }
            catch (error) {
                console.log(error);
                return res.status(500).json({
                    message: "internal server error",
                    status: false,
                });
            }
        });
    }
    static changePasswordMail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                const user = yield user_1.User.findOne({ email });
                if (!user || !user.isVerified) {
                    return res.status(200).json({
                        message: "If this email exists, a reset code has been sent",
                    });
                }
                const resetToken = crypto_1.default.randomBytes(32).toString("hex");
                const randomNumber4 = Math.floor(1000 + Math.random() * 9000).toString();
                user.resetToken = resetToken;
                user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
                yield user.save();
                yield UserVerificationQueues_1.sendPasswordResetQueue.add({ user });
                return res.status(200).json({
                    message: "please enter the 4 digit code sent to your mail",
                    email,
                    token: resetToken,
                });
            }
            catch (error) {
                console.log(error);
                return res.status(500).json({
                    status: "FAILED",
                    error: "Internal server error",
                });
            }
        });
    }
}
exports.AuthController = AuthController;
