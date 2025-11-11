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
exports.SendGrid = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const createEmailVerification_1 = require("./createEmails/createEmailVerification");
const suspiciousUserLogin_1 = require("./createEmails/suspiciousUserLogin");
const resetPassword_1 = require("./createEmails/resetPassword");
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
class SendGridService {
    sendResetMail(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const prefixUrl = process.env.PREFIX_URL || "https://yourdomain.com";
            const html = (0, resetPassword_1.createResetPasswordMail)(`${user.firstname} ${user.lastname}`, `${prefixUrl}/reset-password?token=${user.resetToken}`, 30 // expiration in minutes
            );
            try {
                yield mail_1.default.send({
                    to: user.email,
                    from: "bellogbenga43@gmail.com", // must be verified in SendGrid
                    subject: "Password Reset Request",
                    html,
                });
                console.log(`Password reset email sent to ${user.email}`);
            }
            catch (err) {
                console.error("SendGrid error (reset):", err);
                throw err;
            }
        });
    }
    sendVerification(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const prefixUrl = process.env.PREFIX_URL || "https://yourdomain.com";
            const html = (0, createEmailVerification_1.createVerificationMail)(`${user.firstname} ${user.lastname}`, `${prefixUrl}/verify-email?token=${user.verificationToken}`);
            try {
                yield mail_1.default.send({
                    to: user.email,
                    from: "bellogbenga43@gmail.com",
                    subject: "Please verify your email",
                    html,
                });
                console.log(`Verification email sent to ${user.email}`);
            }
            catch (err) {
                console.error("SendGrid error (verification):", err);
                throw err;
            }
        });
    }
    sendSuspiciousLogin(user, ipInfo, actionLink) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = (0, suspiciousUserLogin_1.createSuspiciousLoginMail)(`${user.firstname} ${user.lastname}`, ipInfo, new Date().toLocaleString(), actionLink);
            yield mail_1.default.send({
                to: user.email,
                from: "bellogbenga43@gmail.com",
                subject: "Suspicious Login Detected",
                html,
            });
            console.log(`Suspicious login email sent to ${user.email}`);
        });
    }
}
exports.SendGrid = new SendGridService();
