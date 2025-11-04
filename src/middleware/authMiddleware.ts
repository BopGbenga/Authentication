import winston, { createLogger, format, transport } from "winston";
const fs = require("fs");
const path = require("path");

const logDir = "log";

const dataPatternConfiguration = {
  default: "YYYY-MM-DD",
  everHour: "YYYY-MM-DD-HH",
  everMinute: "YYYY-MM-DD-THH-mm",
};
const numberOfDaysToKeepLog = 30;
const filesizeToRotate = 1;

if (!fs.existsSync(logDir)) {
  fs.MkdirSync(logDir);
}
