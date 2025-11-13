"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controller/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = express_1.default.Router();
router.post("/signup", validationMiddleware_1.validateUser, authController_1.AuthController.signup);
router.post("/login", authMiddleware_1.login);
router.post("/resetPasword", authController_1.AuthController.updatePassword);
router.post("/verify/:userID", authController_1.AuthController.changePasswordMail);
exports.default = router;
