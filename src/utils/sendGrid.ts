import sendGrid from "@sendgrid/mail";
import { createVerificationMail } from "./createEmails/createEmailVerification";
import { createSuspiciousLoginMail } from "./createEmails/suspiciousUserLogin";
import { createResetPasswordMail } from "./createEmails/resetPassword";

sendGrid.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface User {
  firstname: string;
  lastname: string;
  email: string;
  verificationToken?: string;
  resetToken: string;
}
interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
}

class SendGridService {
  async sendResetMail(user: User) {
    const prefixUrl = process.env.PREFIX_URL || "https://yourdomain.com";

    const html = createResetPasswordMail(
      `${user.firstname} ${user.lastname}`,
      `${prefixUrl}/reset-password?token=${user.resetToken}`,
      30 // expiration in minutes
    );

    try {
      await sendGrid.send({
        to: user.email,
        from: "bellogbenga43@gmail.com", // must be verified in SendGrid
        subject: "Password Reset Request",
        html,
      });
      console.log(`Password reset email sent to ${user.email}`);
    } catch (err) {
      console.error("SendGrid error (reset):", err);
      throw err;
    }
  }
  async sendVerification(user: User) {
    const prefixUrl = process.env.PREFIX_URL || "https://yourdomain.com";

    const html = createVerificationMail(
      `${user.firstname} ${user.lastname}`,
      `${prefixUrl}/verify-email?token=${user.verificationToken}`
    );

    try {
      await sendGrid.send({
        to: user.email,
        from: "bellogbenga43@gmail.com",
        subject: "Please verify your email",
        html,
      });
      console.log(`Verification email sent to ${user.email}`);
    } catch (err) {
      console.error("SendGrid error (verification):", err);
      throw err;
    }
  }
  async sendSuspiciousLogin(user: User, ipInfo: IPInfo, actionLink: string) {
    const html = createSuspiciousLoginMail(
      `${user.firstname} ${user.lastname}`,
      ipInfo,
      new Date().toLocaleString(),
      actionLink
    );

    await sendGrid.send({
      to: user.email,
      from: "bellogbenga43@gmail.com",
      subject: "Suspicious Login Detected",
      html,
    });

    console.log(`Suspicious login email sent to ${user.email}`);
  }
}

export const SendGrid = new SendGridService();
