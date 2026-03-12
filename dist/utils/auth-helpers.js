"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRefreshToken = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const token_js_1 = require("./token.js");
const refresh_token_service_js_1 = require("../services/refresh-token.service.js");
const config_js_1 = __importDefault(require("../config/config.js"));
const setupRefreshToken = async (userId, email, res) => {
    const refreshToken = (0, token_js_1.generateRefreshToken)({
        id: userId,
        email,
    });
    await prisma_client_js_1.default.refreshToken.create({
        data: {
            token: refreshToken,
            userId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
    await refresh_token_service_js_1.RefreshTokenService.cleanupOldTokens(userId);
    await prisma_client_js_1.default.user.update({
        where: { id: userId },
        data: {
            lastConnexion: new Date(),
        },
    });
    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: config_js_1.default.nodeEnv === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return refreshToken;
};
exports.setupRefreshToken = setupRefreshToken;
