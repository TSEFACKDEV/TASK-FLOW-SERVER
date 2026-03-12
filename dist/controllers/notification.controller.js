"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetNotificationStats = exports.adminCreateNotification = exports.markAllAsRead = exports.markRead = exports.listNotifications = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const notification_service_js_1 = require("../services/notification.service.js");
const listNotifications = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        if (!userId)
            return response_js_1.default.error(res, 'Unauthorized', null, 401);
        const notifs = await (0, notification_service_js_1.getUserNotifications)(userId);
        return response_js_1.default.success(res, 'Notifications fetched', notifs, 200);
    }
    catch (e) {
        return response_js_1.default.error(res, 'Failed to fetch notifications', e.message, 500);
    }
};
exports.listNotifications = listNotifications;
const markRead = async (req, res) => {
    try {
        const id = req.params.id;
        const notif = await (0, notification_service_js_1.markNotificationRead)(id);
        return response_js_1.default.success(res, 'Notification marked read', notif, 200);
    }
    catch (e) {
        return response_js_1.default.error(res, 'Failed to mark notification read', e.message, 500);
    }
};
exports.markRead = markRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        if (!userId)
            return response_js_1.default.error(res, 'Unauthorized', null, 401);
        await (0, notification_service_js_1.markAllNotificationsRead)(userId);
        return response_js_1.default.success(res, 'All notifications marked as read', null, 200);
    }
    catch (e) {
        return response_js_1.default.error(res, 'Failed to mark all notifications as read', e.message, 500);
    }
};
exports.markAllAsRead = markAllAsRead;
const adminCreateNotification = async (req, res) => {
    try {
        const { userIds, title, message, type, link, data } = req.body;
        if (!title || !message) {
            return response_js_1.default.error(res, 'Title and message are required', null, 400);
        }
        const result = await (0, notification_service_js_1.createCustomNotification)({
            userIds,
            title,
            message,
            type,
            link,
            data
        });
        return response_js_1.default.success(res, 'Notification sent successfully', result, 201);
    }
    catch (e) {
        return response_js_1.default.error(res, 'Failed to create notification', e.message, 500);
    }
};
exports.adminCreateNotification = adminCreateNotification;
const adminGetNotificationStats = async (_req, res) => {
    try {
        const stats = await (0, notification_service_js_1.getNotificationStats)();
        return response_js_1.default.success(res, 'Notification stats retrieved', stats, 200);
    }
    catch (e) {
        return response_js_1.default.error(res, 'Failed to get notification stats', e.message, 500);
    }
};
exports.adminGetNotificationStats = adminGetNotificationStats;
