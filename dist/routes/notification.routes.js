"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const checkPermission_js_1 = __importDefault(require("../middlewares/checkPermission.js"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_js_1.authenticate, notification_controller_js_1.listNotifications);
router.patch('/:id/read', auth_middleware_js_1.authenticate, notification_controller_js_1.markRead);
router.patch('/mark-all-read', auth_middleware_js_1.authenticate, notification_controller_js_1.markAllAsRead);
router.post('/admin/create', auth_middleware_js_1.authenticate, (0, checkPermission_js_1.default)('MANAGE_NOTIFICATIONS'), notification_controller_js_1.adminCreateNotification);
router.get('/admin/stats', auth_middleware_js_1.authenticate, (0, checkPermission_js_1.default)('MANAGE_NOTIFICATIONS'), notification_controller_js_1.adminGetNotificationStats);
exports.default = router;
