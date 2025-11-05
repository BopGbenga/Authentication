import winston, { createLogger, format, transport, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
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
const dailyRotateFileTransport = new DailyRotateFile({
  filename: `${logDir}/%DATE%-results.log`,
  datePattern: dataPatternConfiguration.everHour,
  zippedArchive: true,
  maxSize: `${filesizeToRotate}m`,
  maxFiles: `${numberOfDaysToKeepLog}d`,
});

const logger = createLogger({
  handleExceptions: true,
  format: format.combine(
    // format.label({ label: path.basename(module.parent.filename) }),
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.printf(
      (info) =>
        `${info.timestamp}[${info.label}]${info.level}: ${JSON.stringify(
          info.message
        )}`
    )
  ),
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
