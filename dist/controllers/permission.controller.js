"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePermissionsFromRole = exports.assignPermissionsToRole = exports.destroy = exports.update = exports.create = exports.getById = exports.getAll = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const response_js_1 = __importDefault(require("../helper/response.js"));
const getAll = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search } = req.query;
    const searchString = typeof search === 'string' ? search : undefined;
    const offset = (page - 1) * limit;
    try {
        const params = {
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            where: searchString
                ? {
                    title: { contains: searchString, mode: "insensitive" },
                }
                : undefined,
        };
        const result = await prisma_client_js_1.default.permission.findMany(params);
        const total = await prisma_client_js_1.default.permission.count({
            where: params.where,
        });
        response_js_1.default.success(res, 'Permissions retrieved successfully !!!', {
            permission: result,
            links: {
                perpage: limit,
                prevPage: page - 1 ? page - 1 : null,
                currentPage: page,
                nextPage: page + 1 ? page + 1 : null,
                totalPage: limit ? Math.ceil(total / limit) : 1,
                total: total,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            response_js_1.default.error(res, 'the id doest not exist', 404);
        const result = await prisma_client_js_1.default.permission.findFirst({
            where: {
                id,
            },
        });
        response_js_1.default.success(res, 'permission retrieved successfuly', result);
    }
    catch (error) {
        response_js_1.default.error(res, 'Error retrieving permission', error);
    }
};
exports.getById = getById;
const create = async (req, res) => {
    try {
        const { permissionKey, title, description } = req.body;
        const permission = await prisma_client_js_1.default.permission.create({
            data: { permissionKey, title, description },
        });
        response_js_1.default.success(res, 'Permission created successfully', permission, 201);
    }
    catch (error) {
        response_js_1.default.error(res, 'Error creating permission', error);
    }
};
exports.create = create;
const update = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        if (!id)
            response_js_1.default.error(res, 'Id is missing', {}, 404);
        const miss = await prisma_client_js_1.default.permission.findFirst({
            where: {
                id,
            },
        });
        if (!miss)
            response_js_1.default.error(res, 'Permission is missing', {}, 404);
        const result = await prisma_client_js_1.default.permission.update({
            where: {
                id,
            },
            data,
        });
        response_js_1.default.success(res, 'Permission updated successfuly', result);
    }
    catch (error) {
        response_js_1.default.error(res, 'Error updating permission', error);
    }
};
exports.update = update;
const destroy = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            response_js_1.default.error(res, 'Id is missing !!!', {}, 422);
        const result = await prisma_client_js_1.default.permission.delete({
            where: {
                id,
            },
        });
        response_js_1.default.success(res, 'Permission deleted successfully !!!', result);
    }
    catch (error) {
        response_js_1.default.error(res, 'Error deleting permission', error);
    }
};
exports.destroy = destroy;
const assignPermissionsToRole = async (req, res) => {
    try {
        const { roleId, permissionIds } = req.body;
        const assignments = permissionIds.map((permissionId) => {
            return {
                roleId,
                permissionId,
            };
        });
        await prisma_client_js_1.default.rolePermission.createMany({
            data: assignments,
            skipDuplicates: true,
        });
        response_js_1.default.success(res, 'Permissions assigned to role successfully', {}, 201);
    }
    catch (error) {
        response_js_1.default.error(res, 'Error assigning permissions to role', error.message);
    }
};
exports.assignPermissionsToRole = assignPermissionsToRole;
const removePermissionsFromRole = async (req, res) => {
    try {
        const { roleId, permissionIds } = req.body;
        if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
            return response_js_1.default.error(res, 'roleId and permissionIds array are required', {}, 400);
        }
        await prisma_client_js_1.default.rolePermission.deleteMany({
            where: {
                roleId: roleId,
                permissionId: {
                    in: permissionIds,
                },
            },
        });
        response_js_1.default.success(res, 'Permissions removed from role successfully', {}, 200);
    }
    catch (error) {
        response_js_1.default.error(res, 'Error removing permissions from role', error.message);
    }
};
exports.removePermissionsFromRole = removePermissionsFromRole;
