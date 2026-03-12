"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_1 = __importDefault(require("../model/prisma.client"));
class Log {
}
_a = Log;
Log.logConnection = async (userId, ipAddress, userAgent) => {
    await prisma_client_1.default.connectionLog.create({
        data: {
            userId,
            ipAddress,
            userAgent,
        },
    });
};
Log.getConnectionLogs = async (userId) => {
    return await prisma_client_1.default.connectionLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};
exports.default = Log;
