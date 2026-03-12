"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateValidator = exports.createValidator = exports.readValidator = exports.strictValidator = void 0;
const sanitization_utils_js_1 = require("../utils/sanitization.utils.js");
const strictValidator = (req, _res, next) => {
    try {
        if (req.query.search) {
            req.query.search = (0, sanitization_utils_js_1.sanitizeSearchParam)(req.query.search);
        }
        if (req.query.page) {
            req.query.page = String((0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.page, 1));
        }
        if (req.query.limit) {
            req.query.limit = String((0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.limit, 10));
        }
        if (req.body) {
            cleanBody(req.body);
        }
        next();
    }
    catch (error) {
        console.error("Erreur de validation:", error);
        next();
    }
};
exports.strictValidator = strictValidator;
function cleanBody(body) {
    if (typeof body === "object" && body !== null) {
        for (const key in body) {
            if (typeof body[key] === "string") {
                body[key] = (0, sanitization_utils_js_1.sanitizeXSS)(body[key]);
            }
            else if (typeof body[key] === "object") {
                cleanBody(body[key]);
            }
        }
    }
}
exports.default = exports.strictValidator;
exports.readValidator = exports.strictValidator;
exports.createValidator = exports.strictValidator;
exports.updateValidator = exports.strictValidator;
