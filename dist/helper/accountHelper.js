"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAccountActive = void 0;
const response_js_1 = __importDefault(require("./response.js"));
const checkAccountActive = (status, res) => {
    if (status !== "ACTIVE") {
        const errorMessage = getAccountStatusMessage(status);
        if (res) {
            response_js_1.default.error(res, errorMessage, { code: "ACCOUNT_INACTIVE", status }, 403);
            return false;
        }
        else {
            throw new Error(errorMessage);
        }
    }
    return true;
};
exports.checkAccountActive = checkAccountActive;
const getAccountStatusMessage = (status) => {
    switch (status) {
        case "SUSPENDED":
            return "Votre compte a été suspendu. Veuillez contacter l'administrateur.";
        case "PENDING":
            return "Votre compte est en attente de validation. Veuillez vérifier votre email.";
        case "BANNED":
            return "Votre compte a été banni définitivement.";
        default:
            return `Compte ${status.toLowerCase()}. Connexion impossible.`;
    }
};
