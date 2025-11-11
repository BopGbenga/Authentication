"use strict";
// utils/mailTemplates.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVerificationMail = createVerificationMail;
function createVerificationMail(userFullName, verificationLink) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f7f7f7;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          margin-top: 20px;
          background-color: #4CAF50;
          color: #fff;
          text-decoration: none;
          border-radius: 5px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Hello ${userFullName},</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a class="button" href="${verificationLink}">Verify Email</a>
        <p class="footer">If you did not sign up for this account, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
}
