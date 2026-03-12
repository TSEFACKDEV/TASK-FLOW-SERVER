"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const env = {
    PORT: Number(process.env.PORT) || 5000,
    HOST: process.env.HOST || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    NODE_ENV: process.env.NODE_ENV || "",
    JWT_EXPIRE: process.env.JWT_EXPIRE || "",
    BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS),
    CORS_ORIGIN: process.env.CORS_ORIGIN || ""
};
exports.default = env;
