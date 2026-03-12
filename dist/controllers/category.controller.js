"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getAllCategories = exports.createCategory = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const cache_service_js_1 = require("../services/cache.service.js");
const slugHelpers_js_1 = require("../utils/slugHelpers.js");
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const existingCategory = await prisma_client_js_1.default.category.findFirst({
            where: { name: { equals: name } },
        });
        if (existingCategory) {
            return response_js_1.default.notFound(res, "Category Already exist");
        }
        const slug = (0, slugHelpers_js_1.generateCategorySlug)(name);
        const category = await prisma_client_js_1.default.category.create({
            data: {
                name,
                slug,
                description,
            },
        });
        cache_service_js_1.cacheService.invalidateCategories();
        response_js_1.default.success(res, "Category create succesfully", category);
    }
    catch (error) {
        console.log(error);
        response_js_1.default.error(res, "Failled to create Category", error);
    }
};
exports.createCategory = createCategory;
const getAllCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const isSimpleRequest = !search && page === 1 && limit >= 15;
        if (isSimpleRequest) {
            const cachedCategories = cache_service_js_1.cacheService.getCategories();
            if (cachedCategories) {
                return response_js_1.default.success(res, "Categories retrieved successfully (cache)", {
                    categories: cachedCategories,
                    pagination: {
                        total: cachedCategories.length,
                        page: 1,
                        limit: cachedCategories.length,
                        totalPages: 1,
                    },
                });
            }
        }
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        const [categories, total] = await Promise.all([
            prisma_client_js_1.default.category.findMany({
                where,
                orderBy: { name: "asc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            }),
            prisma_client_js_1.default.category.count({ where }),
        ]);
        const enrichedCategories = categories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description || null,
            icon: null,
            color: "#f97316",
            isActive: true,
            productCount: category._count.products,
            parentId: null,
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString(),
        }));
        const totalPages = Math.ceil(total / limit);
        const responseData = {
            categories: enrichedCategories,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
        if (isSimpleRequest) {
            cache_service_js_1.cacheService.setCategories(enrichedCategories);
        }
        response_js_1.default.success(res, "Categories retrieved succesfully", responseData);
    }
    catch (error) {
        console.log(error);
        response_js_1.default.error(res, "Failled to fetch all categories", error);
    }
};
exports.getAllCategories = getAllCategories;
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return response_js_1.default.notFound(res, "Id is not Found");
        }
        const category = await prisma_client_js_1.default.category.findUnique({
            where: { id },
            include: {
                products: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        city: true,
                        images: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!category) {
            return response_js_1.default.notFound(res, "category not Found");
        }
        response_js_1.default.success(res, "Category retrieved succesfully", category);
    }
    catch (error) {
        console.log(error);
        response_js_1.default.error(res, "Failled to get category", error);
    }
};
exports.getCategoryById = getCategoryById;
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!id) {
            return response_js_1.default.notFound(res, "Id is not Found");
        }
        const existingCategory = await prisma_client_js_1.default.category.findUnique({
            where: { id },
        });
        if (!existingCategory) {
            return response_js_1.default.notFound(res, "Category not Found");
        }
        if (name && name.toLowerCase() !== existingCategory.name.toLowerCase()) {
            const nameExists = await prisma_client_js_1.default.category.findFirst({
                where: { name: { equals: name }, NOT: { id } },
            });
            if (nameExists) {
                return response_js_1.default.notFound(res, "category name already in use");
            }
        }
        const category = await prisma_client_js_1.default.category.update({
            where: { id },
            data: {
                name,
                description,
            },
        });
        cache_service_js_1.cacheService.invalidateCategories();
        response_js_1.default.success(res, "category update succesfully", category);
    }
    catch (error) {
        console.log("Failled to update category", error);
        response_js_1.default.error(res, "Failled to update category", error);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const existingCategory = await prisma_client_js_1.default.category.findFirst({
            where: { id },
        });
        if (!existingCategory) {
            return response_js_1.default.notFound(res, "Category not Found");
        }
        const productsCount = await prisma_client_js_1.default.product.count({
            where: { categoryId: id },
        });
        if (productsCount > 0) {
            return response_js_1.default.notFound(res, "impossible to Delete Category who have a product");
        }
        const category = await prisma_client_js_1.default.category.delete({ where: { id } });
        cache_service_js_1.cacheService.invalidateCategories();
        response_js_1.default.success(res, "category Delete succesfully", category);
    }
    catch (error) {
        console.log(error);
        response_js_1.default.error(res, "Failled to delete category", error);
    }
};
exports.deleteCategory = deleteCategory;
