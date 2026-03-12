"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controllers/stats.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const checkPermission_1 = __importDefault(require("../middlewares/checkPermission"));
const router = (0, express_1.Router)();
router.get('/platform', stats_controller_1.getPlatformStats);
router.get('/payments', auth_middleware_1.authenticate, (0, checkPermission_1.default)('MANAGE_PAYMENTS'), stats_controller_1.getPaymentStats);
router.get('/payments/all', auth_middleware_1.authenticate, (0, checkPermission_1.default)('MANAGE_PAYMENTS'), stats_controller_1.getAllPaymentsAdmin);
exports.default = router;
