"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detector = void 0;
const node_device_detector_1 = __importDefault(require("node-device-detector"));
exports.detector = new node_device_detector_1.default({
    clientIndexes: true,
    deviceIndexes: true,
    deviceAliasCode: false,
});
