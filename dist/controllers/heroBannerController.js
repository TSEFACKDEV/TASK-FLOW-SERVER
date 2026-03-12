"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderHeroBanners = exports.deleteHeroBanner = exports.updateHeroBanner = exports.createHeroBanner = exports.getHeroBannerById = exports.getActiveHeroBanners = exports.getAllHeroBanners = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const heroBanner_validation_1 = require("../validations/heroBanner.validation");
const getAllHeroBanners = async (req, res) => {
    try {
        const query = await heroBanner_validation_1.heroBannerQuerySchema.validate(req.query, { stripUnknown: true });
        const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined;
        const limit = query.limit ? Number(query.limit) : undefined;
        const offset = query.offset ? Number(query.offset) : undefined;
        const where = isActive !== undefined ? { isActive } : {};
        const banners = await prisma_client_js_1.default.heroBanner.findMany({
            where,
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            ...(limit && { take: limit }),
            ...(offset && { skip: offset }),
        });
        return res.status(200).json({
            meta: {
                status: 200,
                message: 'Bannières récupérées avec succès',
            },
            data: banners,
        });
    }
    catch (error) {
        console.error('Error fetching hero banners:', error);
        return res.status(500).json({
            meta: {
                status: 500,
                message: 'Erreur lors de la récupération des bannières',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAllHeroBanners = getAllHeroBanners;
const getActiveHeroBanners = async (_req, res) => {
    try {
        const banners = await prisma_client_js_1.default.heroBanner.findMany({
            where: { isActive: true },
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });
        return res.status(200).json({
            meta: {
                status: 200,
                message: 'Bannières actives récupérées avec succès',
            },
            data: banners,
        });
    }
    catch (error) {
        console.error('Error fetching active hero banners:', error);
        return res.status(500).json({
            meta: {
                status: 500,
                message: 'Erreur lors de la récupération des bannières actives',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getActiveHeroBanners = getActiveHeroBanners;
const getHeroBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await prisma_client_js_1.default.heroBanner.findUnique({
            where: { id },
        });
        if (!banner) {
            return res.status(404).json({
                meta: {
                    status: 404,
                    message: 'Bannière non trouvée',
                },
            });
        }
        return res.status(200).json({
            meta: {
                status: 200,
                message: 'Bannière récupérée avec succès',
            },
            data: banner,
        });
    }
    catch (error) {
        console.error('Error fetching hero banner:', error);
        return res.status(500).json({
            meta: {
                status: 500,
                message: 'Erreur lors de la récupération de la bannière',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getHeroBannerById = getHeroBannerById;
const createHeroBanner = async (req, res) => {
    try {
        const validatedData = await heroBanner_validation_1.createHeroBannerSchema.validate(req.body, { stripUnknown: true });
        const banner = await prisma_client_js_1.default.heroBanner.create({
            data: validatedData,
        });
        return res.status(201).json({
            meta: {
                status: 201,
                message: 'Bannière créée avec succès',
            },
            data: banner,
        });
    }
    catch (error) {
        console.error('Error creating hero banner:', error);
        return res.status(400).json({
            meta: {
                status: 400,
                message: 'Erreur lors de la création de la bannière',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.createHeroBanner = createHeroBanner;
const updateHeroBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = await heroBanner_validation_1.updateHeroBannerSchema.validate(req.body, { stripUnknown: true });
        const existingBanner = await prisma_client_js_1.default.heroBanner.findUnique({
            where: { id },
        });
        if (!existingBanner) {
            return res.status(404).json({
                meta: {
                    status: 404,
                    message: 'Bannière non trouvée',
                },
            });
        }
        const banner = await prisma_client_js_1.default.heroBanner.update({
            where: { id },
            data: validatedData,
        });
        return res.status(200).json({
            meta: {
                status: 200,
                message: 'Bannière mise à jour avec succès',
            },
            data: banner,
        });
    }
    catch (error) {
        console.error('Error updating hero banner:', error);
        return res.status(400).json({
            meta: {
                status: 400,
                message: 'Erreur lors de la mise à jour de la bannière',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updateHeroBanner = updateHeroBanner;
const deleteHeroBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const existingBanner = await prisma_client_js_1.default.heroBanner.findUnique({
            where: { id },
        });
        if (!existingBanner) {
            return res.status(404).json({
                meta: {
                    status: 404,
                    message: 'Bannière non trouvée',
                },
            });
        }
        await prisma_client_js_1.default.heroBanner.delete({
            where: { id },
        });
        return res.status(200).json({
            meta: {
                status: 200,
                message: 'Bannière supprimée avec succès',
            },
        });
    }
    catch (error) {
        console.error('Error deleting hero banner:', error);
        return res.status(500).json({
            meta: {
                status: 500,
                message: 'Erreur lors de la suppression de la bannière',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.deleteHeroBanner = deleteHeroBanner;
const reorderHeroBanners = async (req, res) => {
    try {
        const { bannerOrders } = req.body;
        if (!Array.isArray(bannerOrders)) {
            return res.status(400).json({
                meta: {
                    status: 400,
                    message: 'Format de données invalide',
                },
            });
        }
        await Promise.all(bannerOrders.map((item) => prisma_client_js_1.default.heroBanner.update({
            where: { id: item.id },
            data: { order: item.order },
        })));
        const updatedBanners = await prisma_client_js_1.default.heroBanner.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });
        return res.status(200).json({
            meta: {
                status: 200,
                message: 'Ordre des bannières mis à jour avec succès',
            },
            data: updatedBanners,
        });
    }
    catch (error) {
        console.error('Error reordering hero banners:', error);
        return res.status(500).json({
            meta: {
                status: 500,
                message: 'Erreur lors de la réorganisation des bannières',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.reorderHeroBanners = reorderHeroBanners;
