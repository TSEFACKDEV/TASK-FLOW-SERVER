"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateExpirationDate = exports.PRODUCT_CONFIG = void 0;
exports.PRODUCT_CONFIG = {
    DEFAULT_DURATION_DAYS: 60,
    EXPIRATION_WARNING_DAYS: 7,
    EXPIRATION_FINAL_WARNING_DAYS: 1,
};
const calculateExpirationDate = (activationDate = new Date()) => {
    const expirationDate = new Date(activationDate);
    expirationDate.setDate(expirationDate.getDate() + exports.PRODUCT_CONFIG.DEFAULT_DURATION_DAYS);
    return expirationDate;
};
exports.calculateExpirationDate = calculateExpirationDate;
