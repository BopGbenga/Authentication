"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(express_1.default.json());
const PORT = process.env.PORT || 2000;
app
    .listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
})
    .on("error", (err) => {
    console.error("server startup error", err);
});
