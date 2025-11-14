import express from "express";
import { AuthController } from "../controller/authController";
import { login } from "../middleware/authMiddleware";
import { validateUser } from "../middleware/validationMiddleware";
const router = express.Router();

router.post("/signup", validateUser, AuthController.signup);
router.post("/login", login);
router.post("/resetPasword", AuthController.updatePassword);
router.post("/verify/:userID", AuthController.changePasswordMail);
router.get("/verify-email", AuthController.verifyEmail);

export default router;
