"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCity = exports.updateCity = exports.getCityById = exports.getAllCities = exports.createCity = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const cache_service_js_1 = require("../services/cache.service.js");
const slugHelpers_js_1 = require("../utils/slugHelpers.js");
const createCity = async (req, res) => {
    try {
        const { name } = req.body;
        const existingCity = await prisma_client_js_1.default.city.findFirst({
            where: { name: { equals: name } },
        });
        if (existingCity) {
            return response_js_1.default.error(res, "City Already exist", null, 409);
        }
        const slug = (0, slugHelpers_js_1.generateCitySlug)(name);
        const city = await prisma_client_js_1.default.city.create({
            data: {
                name,
                slug,
            },
        });
        const enrichedCity = {
            id: city.id,
            name: city.name,
            userCount: 0,
            productCount: 0,
            createdAt: city.createdAt.toISOString(),
            updatedAt: city.updatedAt.toISOString(),
        };
        cache_service_js_1.cacheService.invalidateCities();
        response_js_1.default.success(res, "City create succesfully", enrichedCity);
    }
    catch (error) {
        console.log(error);
        response_js_1.default.error(res, "Failled to create City", error);
    }
};
exports.createCity = createCity;
const getAllCities = async (req, res) => {
    const search = req.query.search || "";
    try {
        if (search && search.trim().length < 1) {
            return response_js_1.default.error(res, "Terme de recherche trop court", null, 400);
        }
        if (!search) {
            const cachedCities = cache_service_js_1.cacheService.getCities();
            if (cachedCities) {
                return response_js_1.default.success(res, "Cities retrieved successfully (cache)", cachedCities);
            }
        }
        const whereClause = {};
        if (search && search.trim()) {
            const searchTerm = search.trim();
            whereClause.name = {
                contains: searchTerm,
                mode: "insensitive",
            };
        }
        const cities = await prisma_client_js_1.default.city.findMany({
            orderBy: { name: "asc" },
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });
        const enrichedCities = await Promise.all(cities.map(async (city) => {
            const userCount = await prisma_client_js_1.default.user.count({
                where: {
                    products: {
                        some: {
                            cityId: city.id,
                        },
                    },
                },
            });
            return {
                id: city.id,
                name: city.name,
                userCount,
                productCount: city._count.products,
                createdAt: city.createdAt.toISOString(),
                updatedAt: city.updatedAt.toISOString(),
            };
        }));
        if (!search) {
            cache_service_js_1.cacheService.setCities(enrichedCities);
        }
        response_js_1.default.success(res, "Cities retrieved successfully", enrichedCities);
    }
    catch (error) {
        console.error("❌ Erreur dans getAllCities:", error);
        if (error instanceof Error) {
            if (error.message.includes("Prisma")) {
                response_js_1.default.error(res, "Erreur de base de données lors de la récupération des villes", error.message, 500);
            }
            else {
                response_js_1.default.error(res, "Erreur lors de la récupération des villes", error.message, 500);
            }
        }
        else {
            response_js_1.default.error(res, "Erreur inconnue lors de la récupération des villes", "Une erreur inattendue s'est produite", 500);
        }
    }
};
exports.getAllCities = getAllCities;
const getCityById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return response_js_1.default.notFound(res, "Id is not Found");
        }
        const city = await prisma_client_js_1.default.city.findUnique({
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
        if (!city) {
            return response_js_1.default.notFound(res, "city not Found");
        }
        response_js_1.default.success(res, "City retrieved succesfully", city);
    }
    catch (error) {
        console.log(error);
        response_js_1.default.error(res, "Failled to get city", error);
    }
};
exports.getCityById = getCityById;
const updateCity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!id) {
            return response_js_1.default.notFound(res, "Id is not Found");
        }
        const existingCity = await prisma_client_js_1.default.city.findUnique({
            where: { id },
        });
        if (!existingCity) {
            return response_js_1.default.notFound(res, "City not Found");
        }
        if (name && name.toLowerCase() !== existingCity.name.toLowerCase()) {
            const nameExists = await prisma_client_js_1.default.city.findFirst({
                where: { name: { equals: name }, NOT: { id } },
            });
            if (nameExists) {
                return response_js_1.default.error(res, "city name already in use", null);
            }
        }
        const updatedCity = await prisma_client_js_1.default.city.update({
            where: { id },
            data: {
                name,
            },
        });
        const userCount = await prisma_client_js_1.default.user.count({
            where: {
                products: {
                    some: {
                        cityId: updatedCity.id,
                    },
                },
            },
        });
        const productCount = await prisma_client_js_1.default.product.count({
            where: {
                cityId: updatedCity.id,
            },
        });
        const enrichedCity = {
            id: updatedCity.id,
            name: updatedCity.name,
            userCount,
            productCount,
            createdAt: updatedCity.createdAt.toISOString(),
            updatedAt: updatedCity.updatedAt.toISOString(),
        };
        cache_service_js_1.cacheService.invalidateCities();
        response_js_1.default.success(res, "city update succesfully", enrichedCity);
    }
    catch (error) {
        console.log("Failled to update city", error);
        response_js_1.default.error(res, "Failled to update city", error);
    }
};
exports.updateCity = updateCity;
const deleteCity = async (req, res) => {
    try {
        const { id } = req.params;
        const existingCity = await prisma_client_js_1.default.city.findFirst({
            where: { id },
        });
        if (!existingCity) {
            return response_js_1.default.notFound(res, "City not Found");
        }
        const productsCount = await prisma_client_js_1.default.product.count({
            where: { cityId: id },
        });
        if (productsCount > 0) {
            return response_js_1.default.error(res, "Impossible to delete city that contains products", `This city has ${productsCount} product(s)`, 409);
        }
        const city = await prisma_client_js_1.default.city.delete({ where: { id } });
        cache_service_js_1.cacheService.invalidateCities();
        response_js_1.default.success(res, "city Delete succesfully", city);
    }
    catch (error) {
        console.log(error);
        response_js_1.default.error(res, "Failled to delete city", error);
    }
};
exports.deleteCity = deleteCity;
