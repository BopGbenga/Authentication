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
exports.validateLogin = exports.validateUser = void 0;
const joi_1 = __importDefault(require("joi"));
const validateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const schema = joi_1.default.object({
        firstname: joi_1.default.string().required().messages({
            "sting.empty": "firstname cannot be empty",
            "any.required": "lastname is required",
            "string.base": "invalid type,please provide a valid string",
        }),
        lastname: joi_1.default.string().required().messages({
            "string.empty": "lastname cannot be empty",
            "any.required": "lastname is required",
            "string.base": "invalid type,please provide a valid string",
        }),
        middlename: joi_1.default.string().messages({
            "string.base": "middlename must be a string",
        }),
        email: joi_1.default.string().required().messages({
            "string.empty": "email cannot be empty",
            "any.required": "email is required",
            "string.base": "invalid type,please provide a valid string",
        }),
        password: joi_1.default
            .string()
            .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d])[A-Za-z\\d\\S]{8,}$"))
            .required()
            .messages({
            "any.required": "Password is required.",
            "string.empty": "Password cannot be empty.",
            "string.pattern.base": "Password must be at least 8 characters long, contain uppercase letters, lowercase letters, numbers, and special characters.",
        }),
        confirmPassword: joi_1.default
            .string()
            .valid(joi_1.default.ref("password"))
            .required()
            .messages({
            "any.only": "Passwords do not match",
            "any.required": "Confirm password is required",
            "string.empty": "Confirm password cannot be empty",
        }),
    });
    try {
        yield schema.validateAsync(req.body, { abortEarly: false });
        next();
    }
    catch (error) {
        const errors = error.details.map((detail) => ({
            field: detail.context.key,
            message: detail.message,
        }));
        res.status(422).json({
            message: "validation error",
            success: false,
            errors,
        });
    }
});
exports.validateUser = validateUser;
const validateLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userSchema = joi_1.default.object({
            email: joi_1.default.string().email().required().messages({
                "string.email": "provide a valid email",
                "any.required": "email is required",
                "string.empty": "email cannot be empty",
            }),
            password: joi_1.default.string().required().messages({
                "any.required": "password is required",
                "string.emoty": "password cannot be empty",
            }),
        });
        yield userSchema.validateAsync(req.body, { abortEarly: false });
        next();
    }
    catch (error) {
        const errors = error.details.map((detail) => ({
            field: detail.context.key,
            message: detail.message,
        }));
        res.status(422).json({
            message: "validation error",
            success: false,
            errors,
        });
    }
});
exports.validateLogin = validateLogin;
