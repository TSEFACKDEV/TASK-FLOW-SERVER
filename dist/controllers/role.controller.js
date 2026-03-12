"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRolesToUser = exports.destroy = exports.create = exports.update = exports.getById = exports.getAll = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const response_js_1 = __importDefault(require("../helper/response.js"));
const getAll = async (req, res) => {
    const search = req.query.search || "";
    try {
        const whereClause = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        const roles = await prisma_client_js_1.default.role.findMany({
            orderBy: {
                name: "asc",
            },
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
        response_js_1.default.success(res, "Roles retrieved successfully", roles);
    }
    catch (error) {
        response_js_1.default.error(res, "Error retrieving roles", error);
    }
};
exports.getAll = getAll;
const getById = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            response_js_1.default.error(res, "Id is missing !!!", null, 404);
        const result = await prisma_client_js_1.default.role.findFirst({
            where: {
                id,
            },
        });
        if (!result)
            response_js_1.default.error(res, "role not found!!!", null, 404);
        response_js_1.default.error(res, "role retrieved successfully !!!", result);
    }
    catch (error) {
        response_js_1.default.error(res, "Error retrieving role", error);
    }
};
exports.getById = getById;
const update = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    try {
        if (!id) {
            response_js_1.default.error(res, "Id is missing !!!", null, 422);
            return;
        }
        res.status(422).json({
            message: "Id is missing !!!",
            data: null,
        });
        const result = await prisma_client_js_1.default.role.update({
            where: {
                id,
            },
            data,
        });
        if (!result)
            response_js_1.default.error(res, "role not found !!!", {}, 404);
        response_js_1.default.error(res, "role updated successfully !!!", result ? result : null);
    }
    catch (error) {
        response_js_1.default.error(res, "Error updating role", error);
    }
};
exports.update = update;
const create = async (req, res) => {
    try {
        const { name, description } = req.body;
        const role = await prisma_client_js_1.default.role.create({ data: { name, description } });
        response_js_1.default.success(res, "Role created successfully", role, 201);
    }
    catch (error) {
        response_js_1.default.error(res, "Error creating role", error);
    }
};
exports.create = create;
const destroy = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id)
            response_js_1.default.error(res, "Id is missing !!!", {}, 422);
        const result = await prisma_client_js_1.default.role.delete({
            where: {
                id,
            },
        });
        response_js_1.default.success(res, "Role deleted successfully !!!", result);
    }
    catch (error) {
        response_js_1.default.error(res, "Error deleting role", error);
    }
};
exports.destroy = destroy;
const assignRolesToUser = async (req, res) => {
    try {
        const { userId, roleIds } = req.body;
        const assignments = roleIds.map((roleId) => {
            return {
                userId,
                roleId,
            };
        });
        await prisma_client_js_1.default.userRole.createMany({
            data: assignments,
            skipDuplicates: true,
        });
        response_js_1.default.success(res, "Roles assigned to user successfully", {}, 201);
    }
    catch (error) {
        response_js_1.default.error(res, "Error assigning roles to user", error.message);
    }
};
exports.assignRolesToUser = assignRolesToUser;
