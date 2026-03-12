"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportUser = exports.updateUser = exports.createUser = exports.getUserBySlugOrId = exports.getUserById = exports.getAllUsers = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const client_1 = require("@prisma/client");
const bcrypt_js_1 = require("../utils/bcrypt.js");
const utils_js_1 = __importDefault(require("../helper/utils.js"));
const cache_service_js_1 = require("../services/cache.service.js");
const slugHelpers_js_1 = require("../utils/slugHelpers.js");
const buildUserWhereClause = (search, status, role, isPublicSellers) => {
    const where = {};
    if (isPublicSellers) {
        where.status = "ACTIVE";
        where.products = { some: { status: client_1.ProductStatus.VALIDATED } };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
            ];
        }
    }
    else {
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        if (status && ["ACTIVE", "PENDING", "SUSPENDED"].includes(status)) {
            where.status = status;
        }
        if (role && ["USER", "SUPER_ADMIN"].includes(role)) {
            where.roles = { some: { role: { name: role } } };
        }
    }
    return Object.keys(where).length > 0 ? where : undefined;
};
const getUserSelectFields = (isPublicSellers) => isPublicSellers
    ? {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        avatar: true,
        location: true,
        isVerified: true,
        createdAt: true,
        status: true,
        roles: { include: { role: true } },
        _count: {
            select: {
                products: { where: { status: client_1.ProductStatus.VALIDATED } },
                reviewsReceived: true,
            },
        },
        reviewsReceived: { select: { rating: true } },
        products: {
            take: 3,
            where: { status: client_1.ProductStatus.VALIDATED },
            orderBy: { createdAt: "desc" },
            select: { id: true, name: true, images: true, price: true },
        },
    }
    : {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        phone: true,
        location: true,
        isVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastConnexion: true,
        roles: { include: { role: true } },
        _count: { select: { products: true, reviewsReceived: true } },
        reviewsReceived: { select: { rating: true } },
    };
const getUserStats = async () => {
    const [total, active, pending, suspended] = await Promise.all([
        prisma_client_js_1.default.user.count(),
        prisma_client_js_1.default.user.count({ where: { status: "ACTIVE" } }),
        prisma_client_js_1.default.user.count({ where: { status: "PENDING" } }),
        prisma_client_js_1.default.user.count({ where: { status: "SUSPENDED" } }),
    ]);
    return { total, active, pending, suspended };
};
const handleUserError = (res, error, context) => {
    console.error(`🚨 ${context}:`, {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
    });
    if (error.code === "P2025") {
        return response_js_1.default.notFound(res, "User not found", 404);
    }
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        return response_js_1.default.error(res, "Service temporarily unavailable", "Database connection error", 503);
    }
    if (error.name === "PrismaClientValidationError") {
        return response_js_1.default.error(res, "Invalid query parameters", "Validation failed", 400);
    }
    return response_js_1.default.error(res, context, process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error", 500);
};
const buildUserUpdateData = async (req, existingUser, fields) => {
    const data = { ...fields };
    if (req.files?.avatar) {
        if (existingUser.avatar)
            await utils_js_1.default.deleteFile(existingUser.avatar);
        data.avatar = await utils_js_1.default.saveFile(req.files.avatar, "users");
    }
    if (fields.password) {
        data.password = await (0, bcrypt_js_1.hashPassword)(fields.password);
    }
    return data;
};
const handleUserSuspension = async (userId, status) => {
    if (status !== "SUSPENDED" && status !== "BANNED")
        return null;
    const userProducts = await prisma_client_js_1.default.product.findMany({
        where: { userId },
        select: { id: true, images: true, name: true },
    });
    if (userProducts.length === 0)
        return null;
    const imagePromises = userProducts.flatMap((product) => product.images.map((img) => utils_js_1.default.deleteFile(img)));
    await Promise.allSettled(imagePromises);
    const deleteResult = await prisma_client_js_1.default.product.deleteMany({ where: { userId } });
    cache_service_js_1.cacheService.invalidateAllProducts();
    return {
        count: deleteResult.count,
        products: userProducts.map((p) => p.name),
    };
};
const updateUserRole = async (userId, roleId) => {
    await prisma_client_js_1.default.userRole.deleteMany({ where: { userId } });
    return prisma_client_js_1.default.userRole.create({ data: { userId, roleId } });
};
const getAllUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    const { status, role } = req.query;
    const isPublicSellers = req.route?.path === "/public-sellers";
    try {
        const whereClause = buildUserWhereClause(search, status, role, isPublicSellers);
        const offset = (page - 1) * limit;
        const [users, total] = await Promise.all([
            isPublicSellers
                ? prisma_client_js_1.default.user.findMany({
                    skip: offset,
                    take: limit,
                    where: whereClause,
                    select: getUserSelectFields(true),
                    orderBy: [
                        { reviewsReceived: { _count: "desc" } },
                        { createdAt: "desc" },
                    ],
                })
                : prisma_client_js_1.default.user.findMany({
                    skip: offset,
                    take: limit,
                    where: whereClause,
                    select: getUserSelectFields(false),
                    orderBy: { createdAt: "desc" },
                }),
            prisma_client_js_1.default.user.count({ where: whereClause }),
        ]);
        const userStats = isPublicSellers
            ? { total, active: total, pending: 0, suspended: 0 }
            : await getUserStats();
        const totalPages = Math.ceil(total / limit);
        const pagination = {
            perpage: limit,
            prevPage: page > 1 ? page - 1 : null,
            currentPage: page,
            nextPage: page < totalPages ? page + 1 : null,
            totalPage: totalPages,
            total,
        };
        response_js_1.default.success(res, "Users retrieved successfully!", {
            users,
            pagination,
            stats: userStats,
        });
    }
    catch (error) {
        return handleUserError(res, error, "Failed to retrieve users");
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    const id = req.params.id;
    try {
        if (!id) {
            return response_js_1.default.notFound(res, "id is not found", 422);
        }
        const result = await prisma_client_js_1.default.user.findFirst({
            where: {
                id,
            },
        });
        if (!result)
            return response_js_1.default.notFound(res, "User Is not Found");
        response_js_1.default.success(res, "user retrieved succesfully", result);
    }
    catch (error) {
        console.error("🚨 Error retrieving user by ID:", {
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            userId: id,
        });
        if (error.code === "P2025") {
            return response_js_1.default.notFound(res, `User with ID ${id} not found`, 404);
        }
        if (error.name === "PrismaClientValidationError") {
            return response_js_1.default.error(res, "Invalid user ID format", "User ID validation failed", 400);
        }
        return response_js_1.default.error(res, "Échec de récupération de l'utilisateur", process.env.NODE_ENV === "development"
            ? error.message
            : "Erreur serveur interne", 500);
    }
};
exports.getUserById = getUserById;
const getUserBySlugOrId = async (req, res) => {
    const identifier = req.params.id;
    try {
        if (!identifier) {
            return response_js_1.default.notFound(res, "Identifiant requis", 422);
        }
        let user = null;
        user = await prisma_client_js_1.default.user.findFirst({
            where: { slug: identifier },
            include: {
                products: {
                    where: { status: client_1.ProductStatus.VALIDATED },
                    take: 10,
                    orderBy: { createdAt: "desc" },
                },
                reviewsReceived: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!user) {
            user = await prisma_client_js_1.default.user.findFirst({
                where: { id: identifier },
                include: {
                    products: {
                        where: { status: client_1.ProductStatus.VALIDATED },
                        take: 10,
                        orderBy: { createdAt: "desc" },
                    },
                    reviewsReceived: {
                        take: 5,
                        orderBy: { createdAt: "desc" },
                    },
                },
            });
        }
        if (!user) {
            const extractedId = (0, slugHelpers_js_1.extractIdFromSlug)(identifier);
            if (extractedId) {
                user = await prisma_client_js_1.default.user.findFirst({
                    where: {
                        id: { startsWith: extractedId },
                    },
                    include: {
                        products: {
                            where: { status: client_1.ProductStatus.VALIDATED },
                            take: 10,
                            orderBy: { createdAt: "desc" },
                        },
                        reviewsReceived: {
                            take: 5,
                            orderBy: { createdAt: "desc" },
                        },
                    },
                });
            }
        }
        if (!user) {
            return response_js_1.default.notFound(res, "Utilisateur non trouvé", 404);
        }
        response_js_1.default.success(res, "Utilisateur récupéré avec succès", user);
    }
    catch (error) {
        console.error("🚨 Erreur getUserBySlugOrId:", error);
        return response_js_1.default.error(res, "Échec de récupération de l'utilisateur", process.env.NODE_ENV === "development" ? error.message : "Erreur serveur", 500);
    }
};
exports.getUserBySlugOrId = getUserBySlugOrId;
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, roleId } = req.body;
        if (!lastName || !email || !password) {
            return response_js_1.default.error(res, "Missing required fields (lastName, email, password)", 400);
        }
        const existingUser = await prisma_client_js_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return response_js_1.default.error(res, "User already exists", 400);
        }
        let avatar = null;
        if (req.files && req.files.avatar) {
            const avatarFile = req.files.avatar;
            avatar = await utils_js_1.default.saveFile(avatarFile, "users");
        }
        const hashed = await (0, bcrypt_js_1.hashPassword)(password);
        const newUser = await prisma_client_js_1.default.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashed,
                phone,
                avatar: avatar,
                status: "ACTIVE",
            },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        const slug = (0, slugHelpers_js_1.generateUserSlug)(firstName, lastName, newUser.id);
        await prisma_client_js_1.default.user.update({
            where: { id: newUser.id },
            data: { slug },
        });
        if (roleId) {
            await prisma_client_js_1.default.userRole.create({
                data: {
                    userId: newUser.id,
                    roleId: roleId,
                },
            });
            const userWithRoles = await prisma_client_js_1.default.user.findUnique({
                where: { id: newUser.id },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });
            cache_service_js_1.cacheService.invalidateUserStats();
            response_js_1.default.success(res, "User created successfully!", userWithRoles);
        }
        else {
            cache_service_js_1.cacheService.invalidateUserStats();
            response_js_1.default.success(res, "User created successfully!", newUser);
        }
    }
    catch (error) {
        console.error("🚨 Error creating user:", {
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            email: req.body.email,
        });
        if (error.code === "P2002") {
            return response_js_1.default.error(res, "Échec de création utilisateur - email en double", "Un utilisateur avec cet email existe déjà", 409);
        }
        if (error.code === "P2003") {
            return response_js_1.default.error(res, "Attribution de rôle invalide", "Le rôle spécifié n'existe pas", 400);
        }
        if (error.name === "ValidationError") {
            return response_js_1.default.error(res, "Échec de validation des données utilisateur", error.message, 400);
        }
        if (error.message.includes("File upload")) {
            return response_js_1.default.error(res, "Échec du téléchargement de l'avatar", "Erreur lors du téléchargement du fichier", 413);
        }
        return response_js_1.default.error(res, "Échec de création d'utilisateur", process.env.NODE_ENV === "development"
            ? error.message
            : "Erreur serveur interne", 500);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    const { id } = req.params;
    if (!id)
        return response_js_1.default.notFound(res, "ID is required", 422);
    try {
        const existingUser = await prisma_client_js_1.default.user.findUnique({
            where: { id },
            include: { roles: true },
        });
        if (!existingUser)
            return response_js_1.default.notFound(res, "User not found", 404);
        const { firstName, lastName, email, password, phone, location, roleId, status } = req.body;
        const updateData = await buildUserUpdateData(req, existingUser, {
            firstName,
            lastName,
            email,
            password,
            phone,
            location,
            status,
        });
        const deletedProductsInfo = await handleUserSuspension(id, status);
        await Promise.all([
            prisma_client_js_1.default.user.update({ where: { id }, data: updateData }),
            roleId ? updateUserRole(id, roleId) : Promise.resolve(),
        ]);
        const userWithRoles = await prisma_client_js_1.default.user.findUnique({
            where: { id },
            include: { roles: { include: { role: true } } },
        });
        cache_service_js_1.cacheService.invalidateUserStats();
        const responseMessage = deletedProductsInfo
            ? `User updated successfully. ${deletedProductsInfo.count} product(s) deleted automatically.`
            : "User updated successfully!";
        const responseData = {
            user: userWithRoles,
            ...(deletedProductsInfo && {
                deletedProducts: {
                    count: deletedProductsInfo.count,
                    message: `${deletedProductsInfo.count} product(s) deleted due to suspension`,
                },
            }),
        };
        response_js_1.default.success(res, responseMessage, responseData);
    }
    catch (error) {
        return handleUserError(res, error, "Failed to update user");
    }
};
exports.updateUser = updateUser;
const reportUser = async (req, res) => {
    const reportedUserId = req.params.id;
    const { reason, details } = req.body;
    if (!req.authUser?.id) {
        return response_js_1.default.error(res, "User not authenticated", null, 401);
    }
    const reportingUserId = req.authUser?.id;
    if (!reportedUserId || !reason) {
        return response_js_1.default.error(res, "Missing required fields", 400);
    }
    try {
        if (reportedUserId === reportingUserId) {
            return response_js_1.default.error(res, "You cannot report yourself", 400);
        }
        const reportedUser = await prisma_client_js_1.default.user.findUnique({
            where: { id: reportedUserId },
        });
        if (!reportedUser) {
            return response_js_1.default.notFound(res, "Reported user not found", 404);
        }
        const existingReport = await prisma_client_js_1.default.userReport.findFirst({
            where: {
                reportedUserId,
                reportingUserId,
            },
        });
        if (existingReport) {
            return response_js_1.default.error(res, "You have already reported this user", 400);
        }
        const report = await prisma_client_js_1.default.userReport.create({
            data: {
                reportedUserId,
                reportingUserId,
                reason,
                details,
            },
        });
        response_js_1.default.success(res, "User reported successfully!", report);
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to report user", error.message);
    }
};
exports.reportUser = reportUser;
