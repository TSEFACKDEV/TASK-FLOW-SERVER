"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateForfait = exports.checkForfaitEligibility = exports.assignForfaitWithoutPayment = exports.assignForfaitWithPayment = exports.getProductForfaits = exports.getAllForfaits = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const response_js_1 = __importDefault(require("../helper/response.js"));
const forfait_service_js_1 = __importDefault(require("../services/forfait.service.js"));
const cache_service_js_1 = require("../services/cache.service.js");
const getAllForfaits = async (_req, res) => {
    try {
        const forfaits = await prisma_client_js_1.default.forfait.findMany({
            orderBy: { price: 'asc' },
            select: {
                id: true,
                type: true,
                price: true,
                duration: true,
                description: true,
            }
        });
        response_js_1.default.success(res, "Forfaits récupérés avec succès", forfaits);
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la récupération des forfaits", error.message);
    }
};
exports.getAllForfaits = getAllForfaits;
const getProductForfaits = async (req, res) => {
    const { productId } = req.params;
    try {
        const productForfaits = await prisma_client_js_1.default.productForfait.findMany({
            where: {
                productId,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
            include: {
                forfait: {
                    select: {
                        id: true,
                        type: true,
                        price: true,
                        duration: true,
                        description: true,
                    }
                }
            },
            orderBy: { activatedAt: 'desc' }
        });
        response_js_1.default.success(res, "Forfaits du produit récupérés avec succès", {
            productId,
            forfaits: productForfaits
        });
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la récupération des forfaits du produit", error.message);
    }
};
exports.getProductForfaits = getProductForfaits;
const assignForfaitWithPayment = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        const { productId, forfaitType, phoneNumber } = req.body;
        console.log('🎯 Requête assignForfaitWithPayment reçue:', {
            userId,
            productId,
            forfaitType,
            phoneNumber: phoneNumber ? phoneNumber.substring(0, 6) + '***' : 'undefined',
            bodyKeys: Object.keys(req.body)
        });
        if (!userId) {
            console.error('❌ Utilisateur non authentifié');
            return response_js_1.default.error(res, 'Utilisateur non authentifié', null, 401);
        }
        const missingFields = [];
        if (!productId)
            missingFields.push('productId');
        if (!forfaitType)
            missingFields.push('forfaitType');
        if (!phoneNumber)
            missingFields.push('phoneNumber');
        if (missingFields.length > 0) {
            console.error('❌ Champs manquants:', missingFields);
            return response_js_1.default.error(res, `Champs manquants: ${missingFields.join(', ')}`, {
                missingFields,
                received: req.body
            }, 400);
        }
        const validForfaitTypes = ['URGENT', 'TOP_ANNONCE', 'PREMIUM'];
        if (!validForfaitTypes.includes(forfaitType)) {
            console.error('❌ Type de forfait invalide:', forfaitType);
            return response_js_1.default.error(res, `Type de forfait invalide: ${forfaitType}. Types valides: ${validForfaitTypes.join(', ')}`, null, 400);
        }
        const product = await prisma_client_js_1.default.product.findFirst({
            where: { id: productId, userId }
        });
        if (!product) {
            console.error('❌ Produit non trouvé ou non autorisé', { productId, userId });
            return response_js_1.default.error(res, 'Produit non trouvé ou non autorisé', null, 404);
        }
        console.log('✅ Produit vérifié:', { id: product.id, name: product.name });
        console.log('🔍 Vérification des règles de forfait avant paiement...');
        const canAssignResult = await forfait_service_js_1.default.canAssignForfait(productId, forfaitType);
        if (!canAssignResult.canAssign) {
            console.error('❌ Forfait ne peut pas être assigné:', canAssignResult.reason);
            return response_js_1.default.error(res, canAssignResult.reason || 'Impossible d\'assigner ce forfait', {
                reason: canAssignResult.reason,
                conflictingForfaits: canAssignResult.conflictingForfaits
            }, 400);
        }
        console.log('✅ Vérification passée, forfait peut être assigné');
        const forfait = await forfait_service_js_1.default.getForfaitByType(forfaitType);
        if (!forfait) {
            console.error('❌ Forfait non trouvé:', forfaitType);
            return response_js_1.default.error(res, 'Forfait non trouvé', null, 404);
        }
        const result = await forfait_service_js_1.default.initiatePaymentForForfait({
            productId,
            userId,
            forfaitId: forfait.id,
            phoneNumber
        });
        if (!result.success) {
            console.error('❌ Erreur initialisation paiement:', result.error);
            return response_js_1.default.error(res, result.error.message, null, 400);
        }
        console.log('✅ Paiement initié avec succès:', {
            paymentId: result.payment?.id,
            campayReference: result.payment?.campayReference
        });
        response_js_1.default.success(res, 'Paiement initié avec succès', {
            payment: {
                id: result.payment.id,
                amount: result.payment.amount,
                status: result.payment.status,
                campayReference: result.payment.campayReference,
                metadata: result.payment.metadata
            },
            instructions: result.campayResponse?.ussd_code
                ? `Composez le code USSD: ${result.campayResponse.ussd_code} pour finaliser le paiement`
                : 'Suivez les instructions sur votre téléphone pour finaliser le paiement'
        });
    }
    catch (error) {
        console.error('❌ Erreur complète assignForfaitWithPayment:', {
            message: error.message,
            stack: error.stack?.substring(0, 500),
            userId: req.authUser?.id,
            body: req.body
        });
        response_js_1.default.error(res, 'Erreur lors de l\'assignation du forfait', error.message);
    }
};
exports.assignForfaitWithPayment = assignForfaitWithPayment;
const assignForfaitWithoutPayment = async (req, res) => {
    try {
        const adminId = req.authUser?.id;
        const { productId, forfaitType } = req.body;
        if (!adminId) {
            return response_js_1.default.error(res, 'Administrateur non authentifié', null, 401);
        }
        if (!productId || !forfaitType) {
            return response_js_1.default.error(res, 'Product ID et type de forfait requis', null, 400);
        }
        const result = await forfait_service_js_1.default.assignForfaitWithoutPayment(productId, forfaitType, adminId);
        cache_service_js_1.cacheService.invalidateHomepageProducts();
        response_js_1.default.success(res, '✅ Forfait assigné avec succès', result.productForfait);
    }
    catch (error) {
        response_js_1.default.error(res, 'Erreur lors de l\'assignation du forfait', error.message);
    }
};
exports.assignForfaitWithoutPayment = assignForfaitWithoutPayment;
const checkForfaitEligibility = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        const { productId, forfaitType } = req.query;
        if (!userId) {
            return response_js_1.default.error(res, 'Utilisateur non authentifié', null, 401);
        }
        if (!productId || !forfaitType) {
            return response_js_1.default.error(res, 'Product ID et type de forfait requis', null, 400);
        }
        const product = await prisma_client_js_1.default.product.findFirst({
            where: { id: productId, userId }
        });
        if (!product) {
            return response_js_1.default.error(res, 'Produit non trouvé ou non autorisé', null, 404);
        }
        const eligibility = await forfait_service_js_1.default.canAssignForfait(productId, forfaitType);
        response_js_1.default.success(res, 'Vérification effectuée', eligibility);
    }
    catch (error) {
        response_js_1.default.error(res, 'Erreur lors de la vérification', error.message);
    }
};
exports.checkForfaitEligibility = checkForfaitEligibility;
const deactivateForfait = async (req, res) => {
    const { productId, forfaitType } = req.body;
    try {
        const product = await prisma_client_js_1.default.product.findUnique({
            where: { id: productId },
            include: { user: true },
        });
        if (!product)
            return response_js_1.default.notFound(res, "Produit non trouvé", 404);
        const activeForfait = await prisma_client_js_1.default.productForfait.findFirst({
            where: {
                productId,
                forfait: { type: forfaitType },
                isActive: true,
            },
            include: { forfait: true },
        });
        if (!activeForfait) {
            return response_js_1.default.error(res, "Aucun forfait actif de ce type trouvé", null, 404);
        }
        await prisma_client_js_1.default.productForfait.update({
            where: { id: activeForfait.id },
            data: {
                isActive: false,
                deactivatedAt: new Date(),
            },
        });
        if (product.user?.id) {
            await prisma_client_js_1.default.notification.create({
                data: {
                    userId: product.user.id,
                    title: `Forfait ${forfaitType} retiré`,
                    message: `Le forfait ${forfaitType} a été retiré de votre annonce "${product.name}".`,
                    type: "PRODUCT_FORFAIT",
                    link: `/annonce/${productId}`,
                }
            });
        }
        cache_service_js_1.cacheService.invalidateHomepageProducts();
        response_js_1.default.success(res, `Forfait ${forfaitType} retiré avec succès`, null);
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de la désactivation du forfait", error.message);
    }
};
exports.deactivateForfait = deactivateForfait;
