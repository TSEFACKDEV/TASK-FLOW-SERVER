"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.logoutSchema = exports.refreshTokenSchema = exports.loginSchema = exports.resendOTPSchema = exports.verifyOTPSchema = exports.registerSchema = void 0;
const yup = __importStar(require("yup"));
const passwordRules = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
exports.registerSchema = yup.object({
    email: yup.string().email("Adresse email invalide").required("L'email est requis"),
    password: yup
        .string()
        .matches(passwordRules, { message: "Le mot de passe doit contenir au moins 6 caractères, une lettre minuscule, une lettre majuscule et un chiffre" })
        .required("Le mot de passe est requis")
        .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    firstName: yup.string().optional().nullable().default(null),
    lastName: yup.string().required("Le nom est requis"),
    phone: yup.string().required("Le numéro de téléphone est requis"),
});
exports.verifyOTPSchema = yup.object({
    otp: yup.string().required(),
    userId: yup.string().required(),
});
exports.resendOTPSchema = yup.object({
    userId: yup.string().required(),
});
exports.loginSchema = yup.object({
    identifiant: yup.string().required(),
    password: yup.string().required(),
});
exports.refreshTokenSchema = yup.object({
    refreshToken: yup.string().optional(),
});
exports.logoutSchema = yup.object({});
exports.forgotPasswordSchema = yup.object({
    email: yup.string().email().required(),
});
exports.resetPasswordSchema = yup.object({
    token: yup.string().required(),
    newPassword: yup
        .string()
        .matches(passwordRules, { message: "Le mot de passe doit contenir au moins 6 caractères, une lettre minuscule, une lettre majuscule et un chiffre" })
        .required()
        .min(6),
});
