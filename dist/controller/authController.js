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
exports.AuthController = void 0;
const handler_1 = require("../utils/handler");
const user_1 = require("../model/user");
const deviceDetector_1 = require("../config/deviceDetector");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserVerificationQueues_1 = require("../Queues/UserVerificationQueues");
const UserVerificationQueues_2 = require("../Queues/UserVerificationQueues");
const crypto_1 = __importDefault(require("crypto"));
class AuthController {
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
