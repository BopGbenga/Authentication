"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuspiciousLoginMail = createSuspiciousLoginMail;
function createSuspiciousLoginMail(userFullName, ipInfo, dateTime, actionLink) {
    // Build location string without extra commas
    const locationParts = [];
    if (ipInfo.city)
        locationParts.push(ipInfo.city);
    if (ipInfo.region)
        locationParts.push(ipInfo.region);
    if (ipInfo.country)
        locationParts.push(ipInfo.country);
    const location = locationParts.length > 0 ? locationParts.join(", ") : "Unknown";
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Suspicious Login Alert</title>
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
          background-color: #f44336;
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
        <h2>Hello ${userFullName || "User"},</h2>
        <p>We detected a login to your account that seems unusual:</p>
        <ul>
          <li><strong>IP Address:</strong> ${ipInfo.ip || "Unknown"}</li>
          <li><strong>Location:</strong> ${location}</li>
          <li><strong>Date/Time:</strong> ${dateTime}</li>
        </ul>
        <p>If this was you, no action is needed. If this wasn't you, please secure your account immediately by clicking the button below:</p>
        <a class="button" href="${actionLink}">Secure My Account</a>
        <p class="footer">If you did not attempt this login, please act immediately to protect your account.</p>
      </div>
    </body>
    </html>
  `;
}
