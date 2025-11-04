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
Object.defineProperty(exports, "__esModule", { value: true });
const handler_1 = require("../utils/handler");
const user_1 = require("../model/user");
const deviceDetector_1 = require("../config/deviceDetector");
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
                    email: email.trim().lowercase(),
                    password: yield (0, handler_1.hashPassword)(password),
                    trustedDevices: [],
                });
                const agent = deviceDetector_1.detector.detect(userAgent);
                const { device, os, client } = agent;
                const trustedDevices = `${device.model || os.name}-${client.name}/${client.version}-${client.type}-`;
                res.status(201).json({
                    status: "COMPLETE",
                    message: "sign up successful",
                    user: user.email,
                    trustedDevices,
                });
            }
            catch (error) {
                console.log(error.message);
            }
        });
    }
}
