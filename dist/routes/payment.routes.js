"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_controller_js_1 = require("../controllers/payment.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validation_js_1 = __importDefault(require("../middlewares/validation.js"));
const payment_validation_js_1 = require("../validations/payment.validation.js");
const rateLimiter_js_1 = require("../middlewares/rateLimiter.js");
const router = express_1.default.Router();
router.post('/initiate', auth_middleware_js_1.authenticate, (0, validation_js_1.default)(payment_validation_js_1.initiatePaymentSchema), payment_controller_js_1.initiatePayment);
router.get('/:paymentId/status', auth_middleware_js_1.authenticate, rateLimiter_js_1.paymentStatusRateLimiter, payment_controller_js_1.checkPaymentStatus);
router.get('/history', auth_middleware_js_1.authenticate, payment_controller_js_1.getUserPayments);
router.post('/webhook/campay', payment_controller_js_1.campayWebhook);
exports.default = router;
