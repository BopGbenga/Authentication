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
const express_1 = __importDefault(require("express"));
const session = require("express-session");
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const databse_1 = require("./config/databse");
const authRoute_1 = __importDefault(require("./routes/authRoute"));
require("./config/passport");
const passport = require("passport");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const PORT = process.env.PORT || 2000;
if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required!");
}
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    },
}));
app.use(passport.initialize());
app.use(passport.session());
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, databse_1.connectDB)();
    });
}
app.use(authRoute_1.default);
app.get("/", (req, res) => {
    res.send("Hello world");
});
app
    .listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
})
    .on("error", (err) => {
    console.error("server startup error", err);
});
main().catch((error) => {
    console.log(error);
    throw error;
});
