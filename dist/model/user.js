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
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.default.Schema({
    firstname: {
        type: String,
        required: [true, "please enter your first name"],
    },
    middlename: {
        type: String,
    },
    lastname: {
        type: String,
        required: [true, "please enter your last name"],
    },
    email: {
        type: String,
        required: [true, "please enter an email"],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "please enter a password"],
        minlength: [6, "password should be at least 6 character long"],
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true,
    },
    gender: {
        type: String,
        enum: ["Male", "female", "Non-binary", "other"],
    },
    phoneNumber: {
        type: String,
        maxLength: 50,
    },
    trustedDevices: {
        type: [String],
        required: true,
    },
}, { timestamps: true });
userSchema.statics.login = function login(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield this.findOne({ email });
        if (user) {
            const auth = yield bcrypt_1.default.compare(password, user.password);
            if (auth && user.isVerified)
                return user;
            if (auth && !user.isVerified) {
                throw new Error("please verfiy your account");
            }
        }
        throw new Error("incorrect mail/password");
    });
};
exports.User = mongoose_1.default.model("User", userSchema);
