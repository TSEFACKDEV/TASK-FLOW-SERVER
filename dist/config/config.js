"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
const env = {
    port: process.env.PORT || "3001",
    host: process.env.HOST || "localhost",
    nodeEnv: process.env.NODE_ENV || "development",
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    jwtResetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m",
    brevoApiKey: process.env.BREVO_API_KEY || "",
    brevoFromEmail: process.env.BREVO_FROM_EMAIL || "noreply@buyandsale.cm",
    brevoFromName: process.env.BREVO_FROM_NAME || "BuyandSale",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    refreshTokenSecretKey: process.env.REFRESH_TOKEN_SECRET_KEY,
    sessionSecret: process.env.SESSION_SECRET,
    localIp: process.env.LOCAL_IP || "192.168.1.28",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL ||
        `http://192.168.1.28.nip.io:3001/api/buyandsale/auth/google/callback`,
    campay_base_url: process.env.campay_base_url || "https://www.campay.net/api",
    campay_username: process.env.campay_username || "",
    campay_password: process.env.campay_password || "",
    campay_app_id: process.env.campay_app_id || "",
    campay_jeton_daccess_permanent: process.env.campay_jeton_daccess_permanent || "",
    campay_webhook_de_lapplication: process.env.campay_webhook_de_lapplication || "",
    techsoftApiToken: process.env.API_TOKEN || "",
    techsoftSenderId: process.env.SMS_SENDER_ID || "Buyandsale",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
    CLOUDINARY_URL: process.env.CLOUDINARY_URL || "",
    NODE_ENV: process.env.NODE_ENV || "development",
};
function validateConfig() {
    const criticalVars = [
        { key: "JWT_SECRET", value: env.jwtSecret, minLength: 64 },
        {
            key: "REFRESH_TOKEN_SECRET_KEY",
            value: env.refreshTokenSecretKey,
            minLength: 64,
        },
        { key: "SESSION_SECRET", value: env.sessionSecret, minLength: 32 },
    ];
    const errors = [];
    criticalVars.forEach(({ key, value, minLength }) => {
        if (!value || value === "undefined") {
            errors.push(`❌ ${key} est manquant ou non défini`);
        }
        else if (value.length < minLength) {
            errors.push(`⚠️ ${key} est trop court (${value.length} caractères, minimum: ${minLength})`);
        }
    });
    if (errors.length > 0) {
        const errorMessage = `\n${"=".repeat(80)}\n🔒 ERREUR DE CONFIGURATION SÉCURITÉ\n${"=".repeat(80)}\n${errors.join("\n")}\n${"=".repeat(80)}\n`;
        console.error(errorMessage);
        logger_1.logger.security.error("Configuration de sécurité invalide", undefined, {
            errors,
        });
        if (env.NODE_ENV === "production") {
            throw new Error("❌ ARRÊT: Configuration de sécurité invalide en production");
        }
        else {
            console.warn("⚠️ ATTENTION: Secrets invalides détectés en développement!");
            console.warn("📝 Veuillez configurer des secrets sécurisés dans le fichier .env");
        }
    }
    else {
        logger_1.logger.security.info("✅ Configuration de sécurité validée avec succès");
    }
}
validateConfig();
if (env.NODE_ENV === "development") {
    logger_1.logger.info("Configuration Campay chargée", {
        campay_base_url: env.campay_base_url,
        campay_username: env.campay_username
            ? `Défini (${env.campay_username.length} chars)`
            : "❌ MANQUANT",
        campay_password: env.campay_password
            ? `Défini (${env.campay_password.length} chars)`
            : "❌ MANQUANT",
        campay_app_id: env.campay_app_id
            ? `Défini (${env.campay_app_id.length} chars)`
            : "❌ MANQUANT",
    });
}
exports.default = env;
