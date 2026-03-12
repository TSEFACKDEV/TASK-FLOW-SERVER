"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactivateProduct = exports.getCategoryProducts = exports.getUserProducts = exports.getSellerProducts = exports.deleteProductOfSuspendedUser = exports.reviewProduct = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductBySlugOrId = exports.getProductById = exports.getUserPendingProducts = exports.getPendingProducts = exports.getValidatedProducts = exports.getAllProductsWithoutPagination = exports.getAllProducts = exports.getProductViewStats = exports.recordProductView = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const utils_js_1 = __importDefault(require("../helper/utils.js"));
const mailer_js_1 = require("../utils/mailer.js");
const reviewProductTemplate_js_1 = require("../templates/reviewProductTemplate.js");
const productCreatedTemplate_js_1 = require("../templates/productCreatedTemplate.js");
const notification_service_js_1 = require("../services/notification.service.js");
const upload_js_1 = require("../utils/upload.js");
const cache_service_js_1 = require("../services/cache.service.js");
const productTransformer_js_1 = __importDefault(require("../utils/productTransformer.js"));
const product_config_js_1 = require("../config/product.config.js");
const sanitization_utils_js_1 = require("../utils/sanitization.utils.js");
const slugHelpers_js_1 = require("../utils/slugHelpers.js");
const buildProductFilters = (options) => {
    const { search, categoryId, cityId, priceMin, priceMax, etat, status = "VALIDATED", } = options;
    const where = {
        status,
        ...(search && { name: { contains: search, mode: "insensitive" } }),
        ...(categoryId && { categoryId }),
        ...(cityId && { cityId }),
        ...(etat && ["NEUF", "OCCASION", "CORRECT"].includes(etat) && { etat }),
    };
    const priceFilter = {};
    if (priceMin !== undefined && !isNaN(priceMin))
        priceFilter.gte = priceMin;
    if (priceMax !== undefined && !isNaN(priceMax))
        priceFilter.lte = priceMax;
    if (Object.keys(priceFilter).length > 0)
        where.price = priceFilter;
    return where;
};
const buildPaginationResponse = (query, totalCount) => {
    const page = (0, sanitization_utils_js_1.sanitizeNumericParam)(query.page, 1, 1, 1000);
    const limit = (0, sanitization_utils_js_1.sanitizeNumericParam)(query.limit, 10, 1, 100);
    const totalPage = Math.ceil(totalCount / limit);
    return {
        pagination: {
            perpage: limit,
            prevPage: page > 1 ? page - 1 : null,
            currentPage: page,
            nextPage: page < totalPage ? page + 1 : null,
            totalPage,
            total: totalCount,
        },
        offset: (page - 1) * limit,
        limit,
    };
};
const recordProductView = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.authUser?.id;
        if (!userId) {
            return response_js_1.default.error(res, "Utilisateur non authentifié", null, 401);
        }
        if (!productId) {
            return response_js_1.default.error(res, "ID du produit requis", null, 400);
        }
        const product = await prisma_client_js_1.default.product.findFirst({
            where: {
                id: productId,
                status: "VALIDATED",
            },
        });
        if (!product) {
            return response_js_1.default.notFound(res, "Produit non trouvé ou non validé", 404);
        }
        const existingView = await prisma_client_js_1.default.productView.findUnique({
            where: {
                userId_productId: {
                    userId: userId,
                    productId: productId,
                },
            },
        });
        if (existingView) {
            return response_js_1.default.success(res, "Vue déjà enregistrée", {
                isNewView: false,
                viewCount: product.viewCount,
            });
        }
        const result = await prisma_client_js_1.default.$transaction(async (tx) => {
            await tx.productView.create({
                data: {
                    userId: userId,
                    productId: productId,
                },
            });
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            });
            return updatedProduct;
        });
        response_js_1.default.success(res, "Vue enregistrée avec succès", {
            isNewView: true,
            viewCount: result.viewCount,
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de l'enregistrement de la vue", error.message);
    }
};
exports.recordProductView = recordProductView;
const getProductViewStats = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) {
            return response_js_1.default.error(res, "ID du produit requis", null, 400);
        }
        const product = await prisma_client_js_1.default.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                name: true,
                viewCount: true,
                _count: {
                    select: {
                        views: true,
                    },
                },
            },
        });
        if (!product) {
            return response_js_1.default.notFound(res, "Produit non trouvé", 404);
        }
        response_js_1.default.success(res, "Statistiques de vues récupérées", {
            productId: product.id,
            productName: product.name,
            viewCount: product.viewCount,
            uniqueViews: product._count.views,
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la récupération des statistiques", error.message);
    }
};
exports.getProductViewStats = getProductViewStats;
const getAllProducts = async (req, res) => {
    const page = (0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.page, 1, 1, 1000);
    const limit = (0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.limit, 10, 1, 100);
    const offset = (page - 1) * limit;
    const search = (0, sanitization_utils_js_1.sanitizeSearchParam)(req.query.search);
    const status = req.query.status;
    const categoryId = req.query.categoryId;
    try {
        const where = {};
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }
        if (status && ["PENDING", "VALIDATED", "REJECTED"].includes(status)) {
            where.status = status;
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        const products = await prisma_client_js_1.default.product.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: "desc" },
            where,
            include: {
                category: true,
                city: true,
                user: true,
                productForfaits: {
                    include: {
                        forfait: true,
                    },
                    where: {
                        isActive: true,
                        expiresAt: {
                            gt: new Date(),
                        },
                    },
                },
            },
        });
        const userIds = products.map((p) => p.userId);
        const reviewsAggregation = await prisma_client_js_1.default.review.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _avg: { rating: true },
            _sum: { rating: true },
            _count: { rating: true },
        });
        const userStatsMap = new Map(reviewsAggregation.map((review) => [
            review.userId,
            {
                totalPoints: review._sum.rating || 0,
                averagePoints: review._avg.rating || null,
                reviewCount: review._count.rating || 0,
            },
        ]));
        const productsWithUserPoints = products.map((product) => {
            const userStats = userStatsMap.get(product.userId) || {
                totalPoints: 0,
                averagePoints: null,
                reviewCount: 0,
            };
            return {
                ...product,
                images: productTransformer_js_1.default.transformProduct(req, product).images,
                userTotalPoints: userStats.totalPoints,
                userAveragePoints: userStats.averagePoints,
            };
        });
        const total = await prisma_client_js_1.default.product.count({ where });
        response_js_1.default.success(res, "Products retrieved successfully!", {
            products: productsWithUserPoints,
            links: {
                perpage: limit,
                prevPage: page > 1 ? page - 1 : null,
                currentPage: page,
                nextPage: offset + limit < total ? page + 1 : null,
                totalPage: Math.ceil(total / limit),
                total: total,
            },
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to get all products", error.message);
    }
};
exports.getAllProducts = getAllProducts;
const getAllProductsWithoutPagination = async (_req, res) => {
    try {
        const products = await prisma_client_js_1.default.product.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                category: true,
                city: true,
                user: true,
            },
        });
        response_js_1.default.success(res, "Products retrieved successfully!", {
            products,
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to get all products", error.message);
    }
};
exports.getAllProductsWithoutPagination = getAllProductsWithoutPagination;
const getValidatedProducts = async (req, res) => {
    const search = (0, sanitization_utils_js_1.sanitizeSearchParam)(req.query.search);
    const categoryId = req.query.categoryId;
    const cityId = req.query.cityId;
    const priceMin = req.query.priceMin
        ? (0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.priceMin, 0, 0, 10000000)
        : undefined;
    const priceMax = req.query.priceMax
        ? (0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.priceMax, Number.MAX_SAFE_INTEGER, 0, 10000000)
        : undefined;
    const etat = req.query.etat;
    try {
        const where = buildProductFilters({
            search,
            categoryId,
            cityId,
            priceMin,
            priceMax,
            etat,
            status: "VALIDATED",
        });
        const allMatchingProducts = await prisma_client_js_1.default.product.findMany({
            orderBy: { createdAt: "desc" },
            where,
            include: {
                category: true,
                city: true,
                user: true,
                productForfaits: {
                    where: { isActive: true, expiresAt: { gt: new Date() } },
                    include: { forfait: true },
                },
            },
        });
        const forfaitPriority = {
            PREMIUM: 1,
            TOP_ANNONCE: 2,
            URGENT: 3,
        };
        const getPriority = (p) => {
            if (!p.productForfaits || p.productForfaits.length === 0)
                return Number.MAX_SAFE_INTEGER;
            const priorities = p.productForfaits.map((pf) => forfaitPriority[pf.forfait?.type] ?? Number.MAX_SAFE_INTEGER);
            return Math.min(...priorities);
        };
        const sortedProducts = allMatchingProducts.sort((a, b) => {
            const pa = getPriority(a);
            const pb = getPriority(b);
            if (pa !== pb)
                return pa - pb;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        const { pagination, offset, limit } = buildPaginationResponse(req.query, sortedProducts.length);
        const paginatedProducts = sortedProducts.slice(offset, offset + limit);
        const productsWithImageUrls = productTransformer_js_1.default.transformProductsWithForfaits(req, paginatedProducts);
        response_js_1.default.success(res, "Validated products retrieved successfully!", {
            products: productsWithImageUrls,
            links: pagination,
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to get validated products", error.message);
    }
};
exports.getValidatedProducts = getValidatedProducts;
const getPendingProducts = async (_req, res) => {
    try {
        const pendingProducts = await prisma_client_js_1.default.product.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
        });
        response_js_1.default.success(res, "Pending products retrieved successfully", pendingProducts);
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to retrieve pending products", error.message);
    }
};
exports.getPendingProducts = getPendingProducts;
const getUserPendingProducts = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        if (!userId) {
            return response_js_1.default.error(res, "User not authenticated", null, 401);
        }
        const userPendingProducts = await prisma_client_js_1.default.product.findMany({
            where: {
                status: "PENDING",
                userId: userId,
            },
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                city: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const userPendingProductsWithImageUrls = productTransformer_js_1.default.transformProducts(req, userPendingProducts);
        response_js_1.default.success(res, "User pending products retrieved successfully", {
            products: userPendingProductsWithImageUrls,
            links: {
                total: userPendingProductsWithImageUrls.length,
            },
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to retrieve user pending products", error.message);
    }
};
exports.getUserPendingProducts = getUserPendingProducts;
const getProductById = async (req, res) => {
    const id = req.params.id;
    try {
        if (!id) {
            return response_js_1.default.notFound(res, "id is not found", 422);
        }
        const result = await prisma_client_js_1.default.product.findFirst({
            where: {
                id,
            },
            include: {
                category: true,
                city: true,
                user: true,
            },
        });
        if (!result) {
            return response_js_1.default.notFound(res, "Product not found", 404);
        }
        const productWithImageUrls = productTransformer_js_1.default.transformProduct(req, result);
        response_js_1.default.success(res, "Product retrieved successfully", productWithImageUrls);
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to get product by ID", error.message);
    }
};
exports.getProductById = getProductById;
const getProductBySlugOrId = async (req, res) => {
    const identifier = req.params.id;
    try {
        if (!identifier) {
            return response_js_1.default.notFound(res, "Identifiant requis", 422);
        }
        let product = null;
        product = await prisma_client_js_1.default.product.findFirst({
            where: { slug: identifier },
            include: {
                category: true,
                city: true,
                user: true,
            },
        });
        if (!product) {
            product = await prisma_client_js_1.default.product.findFirst({
                where: { id: identifier },
                include: {
                    category: true,
                    city: true,
                    user: true,
                },
            });
        }
        if (!product) {
            const extractedId = (0, slugHelpers_js_1.extractIdFromSlug)(identifier);
            if (extractedId) {
                product = await prisma_client_js_1.default.product.findFirst({
                    where: {
                        id: { startsWith: extractedId },
                    },
                    include: {
                        category: true,
                        city: true,
                        user: true,
                    },
                });
            }
        }
        if (!product) {
            return response_js_1.default.notFound(res, "Produit non trouvé", 404);
        }
        const productWithImageUrls = productTransformer_js_1.default.transformProduct(req, product);
        response_js_1.default.success(res, "Product retrieved successfully", productWithImageUrls);
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to get product", error.message);
    }
};
exports.getProductBySlugOrId = getProductBySlugOrId;
const createProduct = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        if (!userId) {
            return response_js_1.default.error(res, "Utilisateur non authentifié", null, 401);
        }
        const { name, price, quantity, description, categoryId, cityId, etat, quartier, telephone, } = req.body;
        if (!name ||
            !price ||
            !quantity ||
            !description ||
            !categoryId ||
            !cityId ||
            !etat) {
            return response_js_1.default.error(res, "Tous les champs sont requis", null, 400);
        }
        if (!req.files || !req.files.images) {
            return response_js_1.default.error(res, "Au moins une image est requise", null, 400);
        }
        let savedImages;
        try {
            savedImages = await (0, upload_js_1.uploadProductImages)(req);
        }
        catch (uploadError) {
            return response_js_1.default.error(res, "Erreur lors de l'upload des images", uploadError.message || "Format ou taille d'image non valide", 400);
        }
        const [category, city] = await Promise.all([
            prisma_client_js_1.default.category.findUnique({ where: { id: categoryId } }),
            prisma_client_js_1.default.city.findUnique({ where: { id: cityId } }),
        ]);
        if (!category || !city) {
            return response_js_1.default.error(res, "Catégorie ou ville invalide", null, 400);
        }
        const product = await prisma_client_js_1.default.product.create({
            data: {
                name,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                description,
                images: savedImages,
                categoryId,
                userId,
                cityId,
                status: "PENDING",
                etat,
                quartier,
                telephone,
            },
            include: {
                category: true,
                city: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });
        const slug = (0, slugHelpers_js_1.generateProductSlug)(product.name || "produit", category.name, city.name, product.id);
        await prisma_client_js_1.default.product.update({
            where: { id: product.id },
            data: { slug },
        });
        let paymentResponse = null;
        const responseData = { product };
        if (paymentResponse) {
            responseData.payment = paymentResponse;
        }
        responseData.validityInfo = {
            validityDays: 60,
            message: "Votre annonce sera valide pendant 60 jours. Après cette période, vous pourrez la renouveler gratuitement si elle n'a pas été vendue.",
            canRenew: true,
            renewalCost: "Gratuit"
        };
        response_js_1.default.success(res, "Produit créé avec succès", responseData, 201);
        const productLink = `${process.env.FRONTEND_URL || "https://buyandsale.cm"}/produit/${product.slug || product.id}`;
        const emailHtml = (0, productCreatedTemplate_js_1.createProductCreatedTemplate)({
            firstName: product.user.firstName,
            lastName: product.user.lastName,
            productName: product.name || "Produit sans titre",
            productPrice: product.price,
            productId: product.id,
            productLink,
        });
        (0, mailer_js_1.sendEmail)(product.user.email, "🎉 Votre annonce a été créée avec succès - BuyAndSale", `Votre annonce "${name}" a été créée avec succès et est en attente de validation. Durée de validité: 60 jours. Renouvellement gratuit et illimité après expiration.`, emailHtml).catch((error) => {
            console.error("Erreur lors de l'envoi de l'email de création du produit:", error);
        });
        (0, notification_service_js_1.createNotification)(userId, "✅ Annonce créée avec succès!", `Votre annonce "${name}" a été créée et est en attente de validation. ⏰ Durée: 60 jours | 🔄 Renouvellement: Gratuit et illimité`);
    }
    catch (error) {
        console.error("Erreur lors de la création du produit:", error);
        response_js_1.default.error(res, "Erreur lors de la création du produit", error.message);
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const id = req.params.id;
    try {
        if (!id) {
            return response_js_1.default.notFound(res, "id is not found", 422);
        }
        const existingProduct = await prisma_client_js_1.default.product.findFirst({ where: { id } });
        if (!existingProduct) {
            return response_js_1.default.notFound(res, "Product not found", 404);
        }
        const { name, price, quantity, description, categoryId, userId, cityId, etat, quartier, telephone, imagesToDelete, } = req.body;
        let images = existingProduct.images;
        let imagesToDeleteArray = [];
        if (imagesToDelete) {
            if (Array.isArray(imagesToDelete)) {
                imagesToDeleteArray = imagesToDelete;
            }
            else if (typeof imagesToDelete === "string") {
                try {
                    const parsed = JSON.parse(imagesToDelete);
                    imagesToDeleteArray = Array.isArray(parsed) ? parsed : [imagesToDelete];
                }
                catch {
                    imagesToDeleteArray = [imagesToDelete];
                }
            }
        }
        if (imagesToDeleteArray.length > 0) {
            const pathsToDelete = imagesToDeleteArray.map((url) => {
                return url.replace(/^.*\/uploads\//, "uploads/");
            });
            for (const imagePath of pathsToDelete) {
                if (imagePath && imagePath.trim()) {
                    try {
                        await utils_js_1.default.deleteFile(imagePath);
                        if (process.env.NODE_ENV === "development") {
                            console.log(`Fichier supprimé: ${imagePath}`);
                        }
                    }
                    catch (error) {
                        console.error(`Erreur lors de la suppression de ${imagePath}:`, error);
                    }
                }
            }
            images = images.filter((img) => {
                const normalizedImg = img.replace(/^.*\/uploads\//, "uploads/");
                return !pathsToDelete.includes(normalizedImg);
            });
        }
        if (req.files && req.files.images) {
            const uploadedImages = await (0, upload_js_1.uploadProductImages)(req);
            images = [...images, ...uploadedImages];
        }
        const updatedProduct = await prisma_client_js_1.default.product.update({
            where: { id },
            data: {
                name: name ?? existingProduct.name,
                price: price ? parseFloat(price) : existingProduct.price,
                quantity: quantity ? parseInt(quantity) : existingProduct.quantity,
                description: description ?? existingProduct.description,
                images,
                categoryId: categoryId ?? existingProduct.categoryId,
                userId: userId ?? existingProduct.userId,
                cityId: cityId ?? existingProduct.cityId,
                etat: etat ?? existingProduct.etat,
                quartier: quartier ?? existingProduct.quartier,
                telephone: telephone ?? existingProduct.telephone,
            },
        });
        let paymentResponse = null;
        const productWithImageUrls = productTransformer_js_1.default.transformProduct(req, updatedProduct);
        cache_service_js_1.cacheService.invalidateHomepageProducts();
        response_js_1.default.success(res, "Produit mis à jour avec succès", {
            product: productWithImageUrls,
            payment: paymentResponse,
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la mise à jour du produit", error.message);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const id = req.params.id;
    try {
        if (!id) {
            return response_js_1.default.notFound(res, "id is not found", 422);
        }
        const product = await prisma_client_js_1.default.product.findUnique({ where: { id } });
        if (!product) {
            return response_js_1.default.notFound(res, "Product not found", 404);
        }
        await prisma_client_js_1.default.$transaction(async (tx) => {
            if (product.images && Array.isArray(product.images)) {
                for (const img of product.images) {
                    if (typeof img === "string") {
                        await utils_js_1.default.deleteFile(img);
                    }
                }
            }
            await tx.product.delete({
                where: { id },
            });
        });
        cache_service_js_1.cacheService.invalidateAllProducts();
        response_js_1.default.success(res, "Product and all related data deleted successfully", {
            productId: id,
            deletedData: {
                product: true,
                images: true,
                favorites: true,
                views: true,
                forfaits: true,
            },
            note: "Notifications conservées - nettoyage automatique après 5 jours",
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Failed to delete product", error.message);
    }
};
exports.deleteProduct = deleteProduct;
const reviewProduct = async (req, res) => {
    const { id } = req.params;
    const { action } = req.body;
    try {
        const [product] = await Promise.all([
            prisma_client_js_1.default.product.findUnique({
                where: { id },
                include: { user: true },
            }),
        ]);
        if (!product) {
            return response_js_1.default.notFound(res, "Product not found", 404);
        }
        let subject = "";
        let message = "";
        let isReject = false;
        if (action === "validate") {
            subject = "Votre annonce a été validée";
            message =
                "Félicitations ! Votre annonce a été validée et est désormais visible sur la plateforme.";
        }
        else if (action === "reject") {
            isReject = true;
            subject =
                "Votre annonce a été refusée - Non-conformité aux conditions d'utilisation";
            message =
                "Votre annonce ne respecte pas nos conditions d'utilisation et a été supprimée. Elle pourrait contenir du contenu inapproprié, des informations incorrectes ou ne pas respecter nos standards de qualité. Nous vous invitons à consulter nos conditions d'utilisation et à soumettre une nouvelle annonce conforme.";
        }
        else {
            return response_js_1.default.error(res, "Invalid action", null, 400);
        }
        let responseMessage = "";
        let responseData = {};
        if (isReject) {
            await prisma_client_js_1.default.$transaction(async (tx) => {
                if (product.images && Array.isArray(product.images)) {
                    for (const img of product.images) {
                        if (typeof img === "string") {
                            await utils_js_1.default.deleteFile(img);
                        }
                    }
                }
                await tx.product.delete({
                    where: { id },
                });
            });
            responseMessage = "Product rejected and deleted successfully";
            responseData = {
                action: "rejected_and_deleted",
                productId: id,
                productName: product.name,
                reason: "Non-conformité aux conditions d'utilisation",
                note: "Notifications conservées - nettoyage automatique après 5 jours",
            };
        }
        else {
            const expirationDate = (0, product_config_js_1.calculateExpirationDate)();
            await prisma_client_js_1.default.product.update({
                where: { id },
                data: {
                    status: "VALIDATED",
                    expiresAt: expirationDate,
                },
            });
            responseMessage = "Product validated successfully";
            responseData = {
                action: "validated",
                productId: id,
                productName: product.name,
                expiresAt: expirationDate,
            };
        }
        cache_service_js_1.cacheService.invalidateAllProducts();
        const response = response_js_1.default.success(res, responseMessage, responseData);
        setImmediate(async () => {
            try {
                const backgroundTasks = [];
                if (product.user?.id) {
                    const notifTitle = isReject
                        ? "Annonce refusée et supprimée"
                        : "Annonce validée";
                    const notifMessage = isReject
                        ? `Votre annonce "${product.name}" a été refusée car elle ne respecte pas nos conditions d'utilisation et a été supprimée.`
                        : `Votre annonce "${product.name}" a été validée et est maintenant visible.`;
                    backgroundTasks.push((0, notification_service_js_1.createNotification)(product.user.id, notifTitle, notifMessage, {
                        type: "PRODUCT",
                        ...(isReject ? {} : { link: `/product/${id}` }),
                    }));
                }
                if (product.user?.email) {
                    const html = (0, reviewProductTemplate_js_1.reviewProductTemplate)({
                        userName: product.user.firstName || "Utilisateur",
                        productName: product.name,
                        status: isReject ? "REJECTED" : "VALIDATED",
                        message,
                    });
                    backgroundTasks.push((0, mailer_js_1.sendEmail)(product.user.email, subject, message, html));
                }
                await Promise.allSettled(backgroundTasks);
            }
            catch (bgError) {
                console.error("Background task error in reviewProduct:", bgError);
            }
        });
        return response;
    }
    catch (error) {
        return response_js_1.default.error(res, "Failed to review product", error.message);
    }
};
exports.reviewProduct = reviewProduct;
const deleteProductOfSuspendedUser = async (req, res) => {
    const { userId } = req.body;
    try {
        if (!userId) {
            return response_js_1.default.error(res, "L'ID utilisateur est requis", null, 400);
        }
        const user = await prisma_client_js_1.default.user.findUnique({
            where: { id: userId },
            select: { status: true, firstName: true, lastName: true },
        });
        if (!user) {
            return response_js_1.default.notFound(res, "Utilisateur non trouvé", 404);
        }
        if (user.status !== "SUSPENDED") {
            return response_js_1.default.error(res, "Cette action n'est possible que pour les utilisateurs suspendus", null, 400);
        }
        const products = await prisma_client_js_1.default.product.findMany({
            where: { userId },
            select: { id: true, images: true, name: true },
        });
        if (products.length === 0) {
            return response_js_1.default.success(res, "Aucun produit trouvé pour cet utilisateur suspendu", { count: 0 });
        }
        const result = await prisma_client_js_1.default.$transaction(async (tx) => {
            const imagePromises = products.flatMap((product) => {
                const images = product.images;
                return images.map((img) => utils_js_1.default.deleteFile(img));
            });
            await Promise.allSettled(imagePromises);
            return await tx.product.deleteMany({
                where: { userId },
            });
        });
        cache_service_js_1.cacheService.invalidateAllProducts();
        const userName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : "l'utilisateur suspendu";
        return response_js_1.default.success(res, `${result.count} produits de ${userName} et toutes leurs données associées ont été supprimés avec succès`, {
            count: result.count,
            deletedData: {
                products: result.count,
                images: true,
                favorites: true,
                views: true,
                forfaits: true,
            },
            productNames: products.map((p) => p.name),
            note: "Notifications conservées - nettoyage automatique après 5 jours",
        });
    }
    catch (error) {
        return response_js_1.default.error(res, "Échec de la suppression des produits de l'utilisateur suspendu", error.message);
    }
};
exports.deleteProductOfSuspendedUser = deleteProductOfSuspendedUser;
const getSellerProducts = async (req, res) => {
    const identifier = req.params.sellerId;
    const search = (0, sanitization_utils_js_1.sanitizeSearchParam)(req.query.search);
    try {
        let seller = null;
        let actualSellerId = identifier;
        seller = await prisma_client_js_1.default.user.findFirst({
            where: { slug: identifier },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phone: true,
                email: true,
                location: true,
            },
        });
        if (!seller) {
            seller = await prisma_client_js_1.default.user.findUnique({
                where: { id: identifier },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    phone: true,
                    email: true,
                    location: true,
                },
            });
        }
        if (!seller) {
            const extractedId = (0, slugHelpers_js_1.extractIdFromSlug)(identifier);
            if (extractedId) {
                seller = await prisma_client_js_1.default.user.findFirst({
                    where: {
                        id: { startsWith: extractedId },
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                        email: true,
                        location: true,
                    },
                });
            }
        }
        if (!seller) {
            return response_js_1.default.error(res, "Vendeur non trouvé", null, 404);
        }
        actualSellerId = seller.id;
        const where = {
            status: "VALIDATED",
            userId: actualSellerId,
            ...(search && { name: { contains: search, mode: "insensitive" } }),
        };
        const totalCount = await prisma_client_js_1.default.product.count({ where });
        const { pagination, offset, limit } = buildPaginationResponse(req.query, totalCount);
        const products = await prisma_client_js_1.default.product.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: "desc" },
            where,
            include: {
                category: true,
                city: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        phone: true,
                    },
                },
            },
        });
        const productsWithImageUrls = productTransformer_js_1.default.transformProducts(req, products);
        response_js_1.default.success(res, `Produits du vendeur ${seller.firstName} ${seller.lastName} récupérés avec succès`, {
            products: productsWithImageUrls,
            links: pagination,
            seller: {
                id: seller.id,
                firstName: seller.firstName,
                lastName: seller.lastName,
                name: `${seller.firstName} ${seller.lastName}`,
                avatar: seller.avatar,
                phone: seller.phone,
                email: seller.email,
                location: seller.location,
            },
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la récupération des produits du vendeur", error.message);
    }
};
exports.getSellerProducts = getSellerProducts;
const getUserProducts = async (req, res) => {
    const identifier = req.params.userId;
    try {
        let user = null;
        let actualUserId = identifier;
        user = await prisma_client_js_1.default.user.findFirst({
            where: { slug: identifier },
            select: { id: true, firstName: true, lastName: true, avatar: true },
        });
        if (!user) {
            user = await prisma_client_js_1.default.user.findUnique({
                where: { id: identifier },
                select: { id: true, firstName: true, lastName: true, avatar: true },
            });
        }
        if (!user) {
            const extractedId = (0, slugHelpers_js_1.extractIdFromSlug)(identifier);
            if (extractedId) {
                user = await prisma_client_js_1.default.user.findFirst({
                    where: {
                        id: { startsWith: extractedId },
                    },
                    select: { id: true, firstName: true, lastName: true, avatar: true },
                });
            }
        }
        if (!user) {
            return response_js_1.default.error(res, "Utilisateur introuvable", null, 404);
        }
        actualUserId = user.id;
        const where = {
            status: { in: ["VALIDATED", "EXPIRED"] },
            userId: actualUserId,
        };
        const [totalCount, validatedCount, expiredCount] = await Promise.all([
            prisma_client_js_1.default.product.count({ where }),
            prisma_client_js_1.default.product.count({ where: { userId: actualUserId, status: "VALIDATED" } }),
            prisma_client_js_1.default.product.count({ where: { userId: actualUserId, status: "EXPIRED" } }),
        ]);
        const { pagination, offset, limit } = buildPaginationResponse(req.query, totalCount);
        const products = await prisma_client_js_1.default.product.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: "desc" },
            where,
            include: {
                category: true,
                city: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                productForfaits: {
                    where: {
                        isActive: true,
                        expiresAt: { gt: new Date() },
                    },
                    include: {
                        forfait: true,
                    },
                    orderBy: {
                        activatedAt: 'desc',
                    },
                },
            },
        });
        const productsWithImageUrls = productTransformer_js_1.default.transformProducts(req, products);
        response_js_1.default.success(res, `Produits de ${user.firstName} ${user.lastName} récupérés avec succès`, {
            products: productsWithImageUrls,
            links: {
                ...pagination,
                validatedCount,
                expiredCount,
            },
            user: {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                avatar: user.avatar,
            },
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la récupération des produits de l'utilisateur", error.message);
    }
};
exports.getUserProducts = getUserProducts;
const getCategoryProducts = async (req, res) => {
    const categoryId = req.params.categoryId;
    const search = (0, sanitization_utils_js_1.sanitizeSearchParam)(req.query.search);
    const cityId = req.query.cityId;
    const priceMin = req.query.priceMin
        ? (0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.priceMin, 0, 0, 10000000)
        : undefined;
    const priceMax = req.query.priceMax
        ? (0, sanitization_utils_js_1.sanitizeNumericParam)(req.query.priceMax, Number.MAX_SAFE_INTEGER, 0, 10000000)
        : undefined;
    const etat = req.query.etat;
    try {
        const category = await prisma_client_js_1.default.category.findUnique({
            where: { id: categoryId },
            select: { id: true, name: true, description: true },
        });
        if (!category) {
            return response_js_1.default.error(res, "Catégorie introuvable", null, 404);
        }
        const where = buildProductFilters({
            categoryId,
            search,
            cityId,
            priceMin,
            priceMax,
            etat,
            status: "VALIDATED",
        });
        const totalCount = await prisma_client_js_1.default.product.count({ where });
        const { pagination, offset, limit } = buildPaginationResponse(req.query, totalCount);
        const products = await prisma_client_js_1.default.product.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: "desc" },
            where,
            include: {
                category: true,
                city: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
        const productsWithImageUrls = productTransformer_js_1.default.transformProducts(req, products);
        response_js_1.default.success(res, `Produits de la catégorie "${category.name}" récupérés avec succès`, {
            products: productsWithImageUrls,
            links: pagination,
            category: {
                id: category.id,
                name: category.name,
                description: category.description,
            },
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la récupération des produits de la catégorie", error.message);
    }
};
exports.getCategoryProducts = getCategoryProducts;
const reactivateProduct = async (req, res) => {
    const { id } = req.params;
    const userId = req.authUser?.id;
    try {
        if (!userId) {
            return response_js_1.default.error(res, "Utilisateur non authentifié", null, 401);
        }
        const product = await prisma_client_js_1.default.product.findFirst({
            where: {
                id,
                userId,
                status: "EXPIRED",
            },
        });
        if (!product) {
            return response_js_1.default.error(res, "Annonce non trouvée, déjà active ou vous n'êtes pas le propriétaire", null, 404);
        }
        const newExpirationDate = (0, product_config_js_1.calculateExpirationDate)();
        const reactivatedProduct = await prisma_client_js_1.default.product.update({
            where: { id },
            data: {
                status: "VALIDATED",
                expiresAt: newExpirationDate,
                updatedAt: new Date(),
            },
            include: {
                category: true,
                city: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
        });
        const productWithImageUrls = productTransformer_js_1.default.transformProduct(req, reactivatedProduct);
        cache_service_js_1.cacheService.invalidateAllProducts();
        setImmediate(async () => {
            try {
                await (0, notification_service_js_1.createNotification)(userId, "✅ Annonce réactivée", `Votre annonce "${product.name}" a été réactivée pour 60 jours supplémentaires.`, {
                    type: "PRODUCT_REACTIVATION",
                    link: `/annonce/${reactivatedProduct.slug || id}`,
                });
            }
            catch (notifError) {
                console.error("Erreur notification réactivation:", notifError);
            }
        });
        return response_js_1.default.success(res, "Annonce réactivée avec succès pour 60 jours", {
            product: productWithImageUrls,
            expiresAt: newExpirationDate,
            daysRemaining: 60,
        });
    }
    catch (error) {
        console.error("Erreur lors de la réactivation:", error);
        return response_js_1.default.error(res, "Erreur lors de la réactivation de l'annonce", error.message);
    }
};
exports.reactivateProduct = reactivateProduct;
