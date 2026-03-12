"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const response_js_1 = __importDefault(require("../helper/response.js"));
const checkPermission = (permissionKey) => {
    return async (req, res, next) => {
        const userId = req.authUser?.id;
        try {
            const user = await prisma_client_js_1.default.user.findUnique({
                where: { id: userId },
                include: {
                    roles: {
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!user) {
                return response_js_1.default.error(res, 'User not found', {}, 404);
            }
            const userPermissions = user.roles.flatMap((userRole) => {
                return userRole.role.permissions.map((permission) => {
                    return permission.permission.permissionKey;
                });
            });
            if (!userPermissions.includes(permissionKey)) {
                return response_js_1.default.error(res, 'Forbidden: You do not have the required permission', {}, 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.default = checkPermission;
