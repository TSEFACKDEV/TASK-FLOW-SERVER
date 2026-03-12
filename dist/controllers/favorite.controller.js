"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserFavorites = exports.removeFromFavorites = exports.addToFavorites = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const productTransformer_js_1 = __importDefault(require("../utils/productTransformer.js"));
const notification_service_js_1 = require("../services/notification.service.js");
const addToFavorites = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        const { productId } = req.body;
        if (!userId || !productId) {
            return response_js_1.default.error(res, "userId et productId sont requis", null, 400);
        }
        const product = await prisma_client_js_1.default.product.findUnique({
            where: { id: productId },
            include: { user: true },
        });
        if (!product) {
            return response_js_1.default.notFound(res, "Produit introuvable", 404);
        }
        const existing = await prisma_client_js_1.default.favorite.findUnique({
            where: { userId_productId: { userId, productId } },
        });
        if (existing) {
            return response_js_1.default.error(res, "Produit déjà dans les favoris", null, 400);
        }
        const favorite = await prisma_client_js_1.default.favorite.create({
            data: { userId, productId },
            include: {
                product: {
                    include: {
                        category: true,
                        city: true,
                        user: true,
                        productForfaits: {
                            where: { isActive: true },
                            include: { forfait: true }
                        }
                    }
                },
                user: true
            },
        });
        const favoriteWithImageUrls = {
            ...favorite,
            product: favorite.product
                ? productTransformer_js_1.default.transformProduct(req, favorite.product)
                : null,
        };
        if (product.userId && product.userId !== userId) {
            const userName = favorite.user?.firstName || "Un utilisateur";
            const productName = product.name || "votre produit";
            await (0, notification_service_js_1.createNotification)(product.userId, "Nouveau favori", `${userName} a ajouté ${productName} à ses favoris`, {
                type: "favorite",
                link: `/products/${productId}`,
                data: {
                    productId,
                    userId,
                    productName: product.name,
                },
            });
        }
        response_js_1.default.success(res, "Produit ajouté aux favoris", favoriteWithImageUrls, 201);
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de l'ajout aux favoris", error.message);
    }
};
exports.addToFavorites = addToFavorites;
const removeFromFavorites = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        const { productId } = req.body;
        if (!userId || !productId) {
            return response_js_1.default.error(res, "userId et productId sont requis", null, 400);
        }
        const favorite = await prisma_client_js_1.default.favorite.findUnique({
            where: { userId_productId: { userId, productId } },
        });
        if (!favorite) {
            return response_js_1.default.notFound(res, "Produit non trouvé dans les favoris", 404);
        }
        await prisma_client_js_1.default.favorite.delete({
            where: { userId_productId: { userId, productId } },
        });
        response_js_1.default.success(res, "Produit retiré des favoris", null, 200);
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors du retrait des favoris", error.message);
    }
};
exports.removeFromFavorites = removeFromFavorites;
const getUserFavorites = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        if (!userId) {
            return response_js_1.default.error(res, "userId requis", null, 400);
        }
        const favorites = await prisma_client_js_1.default.favorite.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        category: true,
                        city: true,
                        user: true,
                        productForfaits: {
                            where: { isActive: true },
                            include: { forfait: true }
                        }
                    }
                }
            },
        });
        const favoritesWithImageUrls = favorites.map((fav) => ({
            ...fav,
            product: fav.product
                ? productTransformer_js_1.default.transformProduct(req, fav.product)
                : null,
        }));
        response_js_1.default.success(res, "Favoris récupérés avec succès", favoritesWithImageUrls, 200);
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la récupération des favoris", error.message);
    }
};
exports.getUserFavorites = getUserFavorites;
