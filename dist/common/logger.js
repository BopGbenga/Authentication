"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
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
const dailyRotateFileTransport = new winston_daily_rotate_file_1.default({
    filename: `${logDir}/%DATE%-results.log`,
    datePattern: dataPatternConfiguration.everHour,
    zippedArchive: true,
    maxSize: `${filesizeToRotate}m`,
    maxFiles: `${numberOfDaysToKeepLog}d`,
});
const logger = (0, winston_1.createLogger)({
    handleExceptions: true,
    format: winston_1.format.combine(
    // format.label({ label: path.basename(module.parent.filename) }),
    winston_1.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }), winston_1.format.printf((info) => `${info.timestamp}[${info.label}]${info.level}: ${JSON.stringify(info.message)}`)),
    // transports: [
    //   new transports.Console({
    //     level: "info",
    //     handleExceptions: true,
    //     format: format.combine(
    //       format.label({ label: path.basename(module.parent.filename) }),
    //       format.colorize(),
    //       format.printf(
    //         (info) =>
    //           `${info.timestamp}[${info.label}]${info.level}:${info.message}`
    //       )
    //     ),
    //   }),
    //   dailyRotateFileTransport,
    // ],
});
// logger.stream = {
//   write: (message) => {
//     logger.info(message);
//   },
// };
