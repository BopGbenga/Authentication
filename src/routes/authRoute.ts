import express from "express";
const router = express.Router();
import { AuthController } from "../controller/authController";

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/resetPasword", AuthController.updatePassword);
router.post("/verify/:userID", AuthController.changePasswordMail);

export default router;
