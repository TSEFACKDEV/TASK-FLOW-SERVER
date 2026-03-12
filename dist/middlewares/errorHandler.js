"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const config_js_1 = __importDefault(require("../config/config.js"));
const errorHandler = (err, req, res, _next) => {
    console.error('=== ERREUR SERVEUR ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('URL:', req.method, req.url);
    console.error('Error:', err.message);
    if (config_js_1.default.nodeEnv === 'development') {
        console.error('Stack trace:', err.stack);
    }
    console.error('=== FIN ERREUR ===');
    if (err.name === 'ValidationError') {
        return response_js_1.default.error(res, 'Données de validation invalides', null, 400);
    }
    if (err.name === 'JsonWebTokenError') {
        return response_js_1.default.error(res, 'Token invalide', null, 401);
    }
    if (err.name === 'TokenExpiredError') {
        return response_js_1.default.error(res, 'Session expirée', null, 401);
    }
    if (err.code === 'P2002') {
        return response_js_1.default.error(res, 'Cette donnée existe déjà', null, 409);
    }
    if (err.code === 'P2025') {
        return response_js_1.default.error(res, 'Ressource non trouvée', null, 404);
    }
    if (err.code && err.code.startsWith('P')) {
        return response_js_1.default.error(res, 'Erreur de base de données', null, 500);
    }
    if (err instanceof SyntaxError && 'body' in err) {
        return response_js_1.default.error(res, 'Format de données invalide', null, 400);
    }
    const isDev = config_js_1.default.nodeEnv === 'development';
    return response_js_1.default.error(res, 'Erreur interne du serveur', isDev
        ? {
            message: err.message,
            type: err.name,
        }
        : null, 500);
};
exports.errorHandler = errorHandler;
