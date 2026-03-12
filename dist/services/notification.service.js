"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationStats = exports.createCustomNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getUserNotifications = exports.createNotification = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const socket_js_1 = require("../utils/socket.js");
const createNotification = async (userId, title, message, options) => {
    try {
        const notification = await prisma_client_js_1.default.notification.create({
            data: {
                userId,
                title,
                message,
                data: options?.data ?? null,
                link: options?.link ?? null,
                type: options?.type ?? null,
            },
        });
        setImmediate(() => {
            try {
                const io = (0, socket_js_1.getIO)();
                io.to(userId).emit('notification', notification);
            }
            catch (socketError) {
            }
        });
        return notification;
    }
    catch (error) {
        throw error;
    }
};
exports.createNotification = createNotification;
const getUserNotifications = async (userId) => {
    return prisma_client_js_1.default.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getUserNotifications = getUserNotifications;
const markNotificationRead = async (notificationId) => {
    return prisma_client_js_1.default.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
};
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = async (userId) => {
    return prisma_client_js_1.default.notification.updateMany({
        where: {
            userId,
            read: false,
        },
        data: { read: true },
    });
};
exports.markAllNotificationsRead = markAllNotificationsRead;
const createCustomNotification = async (data) => {
    try {
        if (data.userIds && data.userIds.length > 0) {
            const notifications = await prisma_client_js_1.default.notification.createMany({
                data: data.userIds.map(userId => ({
                    userId,
                    title: data.title,
                    message: data.message,
                    type: data.type || 'ADMIN',
                    link: data.link || null,
                    data: data.data || null,
                }))
            });
            setImmediate(() => {
                try {
                    const io = (0, socket_js_1.getIO)();
                    data.userIds?.forEach(userId => {
                        io.to(userId).emit('notification', {
                            userId,
                            title: data.title,
                            message: data.message,
                            type: data.type || 'ADMIN',
                            link: data.link,
                            data: data.data,
                        });
                    });
                }
                catch (socketError) {
                }
            });
            return notifications;
        }
        const allUsers = await prisma_client_js_1.default.user.findMany({
            where: { isVerified: true },
            select: { id: true }
        });
        const notifications = await prisma_client_js_1.default.notification.createMany({
            data: allUsers.map(user => ({
                userId: user.id,
                title: data.title,
                message: data.message,
                type: data.type || 'ADMIN',
                link: data.link || null,
                data: data.data || null,
            }))
        });
        setImmediate(() => {
            try {
                const io = (0, socket_js_1.getIO)();
                io.emit('notification', {
                    title: data.title,
                    message: data.message,
                    type: data.type || 'ADMIN',
                    link: data.link,
                    data: data.data,
                });
            }
            catch (socketError) {
            }
        });
        return notifications;
    }
    catch (error) {
        throw error;
    }
};
exports.createCustomNotification = createCustomNotification;
const getNotificationStats = async () => {
    try {
        const [total, read, unread, byType, recent] = await Promise.all([
            prisma_client_js_1.default.notification.count(),
            prisma_client_js_1.default.notification.count({ where: { read: true } }),
            prisma_client_js_1.default.notification.count({ where: { read: false } }),
            prisma_client_js_1.default.notification.groupBy({
                by: ['type'],
                _count: true,
            }),
            prisma_client_js_1.default.notification.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    read: true,
                    createdAt: true,
                },
            }),
        ]);
        const notificationsByType = {};
        byType.forEach((item) => {
            const type = item.type || 'SYSTEM';
            notificationsByType[type] = item._count;
        });
        return {
            totalNotifications: total,
            readNotifications: read,
            unreadNotifications: unread,
            notificationsByType,
            recentNotifications: recent,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.getNotificationStats = getNotificationStats;
