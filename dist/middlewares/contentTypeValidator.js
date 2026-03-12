"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = validateContentType;
const response_js_1 = __importDefault(require("../helper/response.js"));
const DANGEROUS_CONTENT_TYPES = [
    "text/html",
    "text/javascript",
    "application/javascript",
    "application/x-javascript",
    "text/x-javascript",
    "application/x-shockwave-flash",
    "application/x-msdownload",
    "text/x-script",
    "text/scriptlet",
    "application/x-executable",
    "application/x-msdownload",
    "application/x-msdos-program",
];
const ALLOWED_CONTENT_TYPES = [
    "application/json",
    "multipart/form-data",
    "application/x-www-form-urlencoded",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
];
function validateContentType() {
    return (req, res, next) => {
        if (["GET", "HEAD", "DELETE", "OPTIONS"].includes(req.method)) {
            return next();
        }
        const contentType = req.get("Content-Type") || "";
        const baseContentType = contentType.split(";")[0].trim().toLowerCase();
        if (!contentType) {
            return next();
        }
        if (DANGEROUS_CONTENT_TYPES.some((dangerous) => baseContentType.includes(dangerous))) {
            console.warn(`🚫 Content-Type dangereux bloqué: ${baseContentType}`, {
                ip: req.ip,
                endpoint: req.path,
                userAgent: req.get("User-Agent"),
            });
            return response_js_1.default.error(res, "Type de contenu non autorisé", {
                code: "INVALID_CONTENT_TYPE",
                message: "Ce type de contenu peut présenter un risque de sécurité",
            }, 415);
        }
        const isKnownType = ALLOWED_CONTENT_TYPES.some((allowed) => baseContentType === allowed ||
            baseContentType.startsWith("multipart/form-data"));
        if (!isKnownType) {
            console.warn(`⚠️ Content-Type inhabituel détecté: ${baseContentType}`, {
                endpoint: req.path,
                method: req.method,
                ip: req.ip,
            });
        }
        next();
    };
}
exports.default = validateContentType;
