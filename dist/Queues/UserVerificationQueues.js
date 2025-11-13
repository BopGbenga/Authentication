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
exports.sendPasswordResetQueue = exports.sendEmailQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const axios_1 = __importDefault(require("axios"));
require("dotenv").config();
const sendGrid_1 = require("../utils/sendGrid");
const ipAPIAgent = axios_1.default.create({
    baseURL: "https://ipapi.co/",
    headers: {
        "User-Agent": "nodejs-ipapi-v1.02",
    },
    validateStatus: () => true,
});
const sendEmailQueue = new bull_1.default("user Verification", {
    redis: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: Number(process.env.REDIS_PORT),
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "fixed",
            delay: 5000,
        },
    },
});
exports.sendEmailQueue = sendEmailQueue;
sendEmailQueue.on("error", (error) => {
    console.log("user verification queue error");
    console.log(error);
});
sendEmailQueue.process((job, done) => __awaiter(void 0, void 0, void 0, function* () {
    const { user, agent, date, ip, actionLink } = job.data;
    try {
        if (!agent) {
            console.log(`sending user verification mail to ${user.email}`);
            yield sendGrid_1.SendGrid.sendVerification(user);
            console.log(`sent user verification mail to ${user.email}`);
        }
        else {
            console.log(`sending suspicious login mail to ${user.email}`);
            const { device, os, client } = agent;
            const ipInfo = {
                model: device.model || os.name,
                ip: ip,
                client: `${client.name} ${client.version}`,
                date: date,
            };
            try {
                const { data } = yield ipAPIAgent.get(`${ip}/json/`);
                if (data === null || data === void 0 ? void 0 : data.country_name) {
                    ipInfo.country = data.country_name;
                }
                if (data === null || data === void 0 ? void 0 : data.org) {
                    ipInfo.org = data.org;
                }
            }
            catch (error) {
                console.log("Failed to fetch IP data:", error);
            }
            const link = actionLink || `${process.env.PREFIX_URL}/security`;
            yield sendGrid_1.SendGrid.sendSuspiciousLogin(user, ipInfo, link);
            console.log(`sent suspicious login mail to ${user.email}`);
        }
        done();
    }
    catch (error) {
        console.error("Error processing email job:", error);
        done(error);
    }
}));
const sendPasswordResetQueue = new bull_1.default("password Reset", {
    redis: {
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        port: Number(process.env.REDIS_PORT),
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "fixed",
            delay: 5000,
        },
    },
});
exports.sendPasswordResetQueue = sendPasswordResetQueue;
sendPasswordResetQueue.on("error", (error) => {
    console.log("password reset queue error");
    console.log(error);
});
sendPasswordResetQueue.process((job, done) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = job.data;
    console.log(`sending password reset mail to ${user.email}`);
    try {
        yield sendGrid_1.SendGrid.sendResetMail(user);
        console.log(`sent password reset mail to ${user.email}`);
        done();
    }
    catch (error) {
        console.log(error);
        done(error);
    }
}));
