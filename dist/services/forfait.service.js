"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHONE_REGEX = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const forfaits_config_js_1 = require("../config/forfaits.config.js");
exports.PHONE_REGEX = /^(237)?[67][0-9]{8}$/;
class ForfaitService {
    static async getForfaitByType(type) {
        return await prisma_client_js_1.default.forfait.findFirst({ where: { type: type } });
    }
    static validatePaymentData(phoneNumber) {
        const cleanPhone = phoneNumber.replace(/\s+/g, '');
        console.log('📱 Numéro nettoyé:', cleanPhone.substring(0, 6) + '***');
        if (!exports.PHONE_REGEX.test(cleanPhone)) {
            return {
                isValid: false,
                error: 'Numéro de téléphone invalide',
            };
        }
        return {
            isValid: true,
            phoneNumber: cleanPhone.substring(0, 6) + '***',
            cleanPhone: cleanPhone.substring(0, 6) + '***',
        };
    }
    static async initiatePaymentForForfait(data) {
        try {
            const { productId, userId, forfaitId, phoneNumber } = data;
            console.log('🎯 initiatePaymentForForfait appelé avec:', {
                productId,
                userId,
                forfaitId,
                phoneNumber: phoneNumber.substring(0, 6) + '***',
            });
            const validation = this.validatePaymentData(phoneNumber);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: {
                        error: true,
                        message: validation.error || 'Validation échouée',
                    },
                };
            }
            const product = await prisma_client_js_1.default.product.findUnique({
                where: { id: productId },
                include: { user: true },
            });
            if (!product) {
                return {
                    success: false,
                    error: {
                        error: true,
                        message: 'Produit non trouvé',
                    },
                };
            }
            if (product.userId !== userId) {
                return {
                    success: false,
                    error: {
                        error: true,
                        message: 'Accès non autorisé',
                    },
                };
            }
            const { paymentService } = await Promise.resolve().then(() => __importStar(require('./payment.service.js')));
            const result = await paymentService.initiatePayment(userId, productId, forfaitId, phoneNumber);
            console.log('✅ Paiement initié avec succès:', {
                paymentId: result.payment.id,
                campayReference: result.payment.campayReference
            });
            return {
                success: true,
                payment: result.payment,
                campayResponse: result.campayResponse,
            };
        }
        catch (error) {
            console.error('❌ Erreur initiatePaymentForForfait:', error);
            return {
                success: false,
                error: {
                    error: true,
                    message: error.message || 'Erreur lors de l\'initialisation du paiement',
                },
            };
        }
    }
    static async assignForfaitSmart(productId, forfaitType, options) {
        try {
            console.log('🎯 assignForfaitSmart appelé:', { productId, forfaitType, options });
            const forfait = await this.getForfaitByType(forfaitType);
            if (!forfait) {
                return {
                    success: false,
                    error: {
                        error: true,
                        message: 'Forfait non trouvé',
                    },
                };
            }
            const newForfaitConfig = forfaits_config_js_1.FORFAIT_CONFIG[forfaitType];
            if (!newForfaitConfig) {
                return {
                    success: false,
                    error: {
                        error: true,
                        message: 'Configuration du forfait non trouvée',
                    },
                };
            }
            const product = await prisma_client_js_1.default.product.findUnique({
                where: { id: productId },
                include: {
                    user: true,
                    productForfaits: {
                        where: {
                            isActive: true,
                            expiresAt: { gt: new Date() }
                        },
                        include: { forfait: true }
                    }
                },
            });
            if (!product) {
                return {
                    success: false,
                    error: {
                        error: true,
                        message: 'Produit non trouvé',
                    },
                };
            }
            const existingSameForfait = product.productForfaits.find(pf => pf.forfait.type === forfaitType);
            if (existingSameForfait) {
                console.log('⚠️ Forfait déjà actif:', forfaitType);
                return {
                    success: false,
                    error: {
                        error: true,
                        message: `Le forfait ${forfaitType} est déjà actif sur ce produit jusqu'au ${new Date(existingSameForfait.expiresAt).toLocaleDateString('fr-FR')}`,
                    },
                    existingForfait: existingSameForfait,
                };
            }
            const forfaitsToDeactivate = [];
            for (const pf of product.productForfaits) {
                const existingConfig = forfaits_config_js_1.FORFAIT_CONFIG[pf.forfait.type];
                if (existingConfig) {
                    if (newForfaitConfig.priority < existingConfig.priority) {
                        forfaitsToDeactivate.push(pf.id);
                        console.log(`🔄 Remplacement: ${pf.forfait.type} (priorité ${existingConfig.priority}) sera remplacé par ${forfaitType} (priorité ${newForfaitConfig.priority} - plus haute)`);
                    }
                    else if (newForfaitConfig.priority === existingConfig.priority) {
                        console.log('⚠️ Même priorité détectée');
                        return {
                            success: false,
                            error: {
                                error: true,
                                message: `Un forfait de même priorité (${pf.forfait.type}) est déjà actif`,
                            },
                        };
                    }
                    else {
                        console.log(`❌ Refusé: ${forfaitType} (priorité ${newForfaitConfig.priority}) a une priorité inférieure à ${pf.forfait.type} (priorité ${existingConfig.priority})`);
                        return {
                            success: false,
                            error: {
                                error: true,
                                message: `Impossible d'assigner le forfait ${forfaitType} (priorité ${newForfaitConfig.priority}). Un forfait de priorité supérieure ${pf.forfait.type} (priorité ${existingConfig.priority}) est déjà actif sur ce produit jusqu'au ${new Date(pf.expiresAt).toLocaleDateString('fr-FR')}.`,
                            },
                        };
                    }
                }
            }
            const now = new Date();
            const expiresAt = new Date(now.getTime() + forfait.duration * 24 * 60 * 60 * 1000);
            const result = await prisma_client_js_1.default.$transaction(async (tx) => {
                if (forfaitsToDeactivate.length > 0) {
                    await tx.productForfait.updateMany({
                        where: { id: { in: forfaitsToDeactivate } },
                        data: {
                            isActive: false,
                            deactivatedAt: now
                        },
                    });
                    console.log(`✅ ${forfaitsToDeactivate.length} forfait(s) désactivé(s)`);
                }
                const productForfait = await tx.productForfait.create({
                    data: {
                        productId,
                        forfaitId: forfait.id,
                        isActive: true,
                        expiresAt,
                    },
                    include: {
                        forfait: true,
                        product: { include: { user: true } },
                    },
                });
                if (!options?.skipNotification) {
                    const notificationTitle = options?.adminId
                        ? `✨ Nouveau forfait: ${forfait.type}`
                        : `✅ Forfait ${forfait.type} activé`;
                    const notificationMessage = options?.adminId
                        ? `Votre produit "${product.name}" a reçu le forfait ${forfait.type} par l'administrateur.`
                        : `Votre forfait ${forfait.type} a été activé avec succès sur "${product.name}". Il expire le ${expiresAt.toLocaleDateString('fr-FR')}.`;
                    await tx.notification.create({
                        data: {
                            userId: product.userId,
                            title: notificationTitle,
                            message: notificationMessage,
                            type: 'PRODUCT_FORFAIT',
                            link: `/annonce/${productId}`,
                        },
                    });
                }
                return productForfait;
            });
            console.log('✅ Forfait assigné avec succès:', result);
            return {
                success: true,
                productForfait: result,
                deactivatedCount: forfaitsToDeactivate.length,
            };
        }
        catch (error) {
            console.error('❌ Erreur assignForfaitSmart:', error);
            return {
                success: false,
                error: {
                    error: true,
                    message: error.message || 'Erreur lors de l\'assignation',
                },
            };
        }
    }
    static async assignForfaitWithoutPayment(productId, forfaitType, adminId) {
        try {
            const admin = await prisma_client_js_1.default.user.findUnique({ where: { id: adminId } });
            if (!admin) {
                return {
                    success: false,
                    error: {
                        error: true,
                        message: 'Admin non trouvé',
                    },
                };
            }
            return await this.assignForfaitSmart(productId, forfaitType, { adminId });
        }
        catch (error) {
            console.error('❌ Erreur assignForfaitWithoutPayment:', error);
            return {
                success: false,
                error: {
                    error: true,
                    message: error.message || 'Erreur lors de l\'assignation',
                },
            };
        }
    }
    static async canAssignForfait(productId, forfaitType) {
        try {
            const newForfaitConfig = forfaits_config_js_1.FORFAIT_CONFIG[forfaitType];
            if (!newForfaitConfig) {
                return {
                    canAssign: false,
                    reason: 'Type de forfait invalide',
                };
            }
            const activeForfaits = await prisma_client_js_1.default.productForfait.findMany({
                where: {
                    productId,
                    isActive: true,
                    expiresAt: { gt: new Date() }
                },
                include: { forfait: true }
            });
            const sameForfait = activeForfaits.find(pf => pf.forfait.type === forfaitType);
            if (sameForfait) {
                return {
                    canAssign: false,
                    reason: `Le forfait ${forfaitType} est déjà actif sur ce produit`,
                    conflictingForfaits: [{
                            type: sameForfait.forfait.type,
                            priority: forfaits_config_js_1.FORFAIT_CONFIG[sameForfait.forfait.type]?.priority || 999,
                            expiresAt: sameForfait.expiresAt
                        }]
                };
            }
            const conflictingForfaits = activeForfaits
                .map(pf => {
                const config = forfaits_config_js_1.FORFAIT_CONFIG[pf.forfait.type];
                return {
                    type: pf.forfait.type,
                    priority: config?.priority || 999,
                    expiresAt: pf.expiresAt
                };
            });
            const higherPriorityForfaits = conflictingForfaits.filter(f => f.priority < newForfaitConfig.priority);
            if (higherPriorityForfaits.length > 0) {
                return {
                    canAssign: false,
                    reason: `Un forfait de priorité supérieure (${higherPriorityForfaits[0].type}) est déjà actif`,
                    conflictingForfaits: higherPriorityForfaits
                };
            }
            const forfaitsToReplace = conflictingForfaits.filter(f => f.priority > newForfaitConfig.priority);
            return {
                canAssign: true,
                conflictingForfaits: forfaitsToReplace.length > 0 ? forfaitsToReplace : undefined
            };
        }
        catch (error) {
            console.error('❌ Erreur canAssignForfait:', error);
            return {
                canAssign: false,
                reason: 'Erreur lors de la vérification'
            };
        }
    }
    static async checkAndManageExpiringForfaits() {
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            console.log('🔍 Vérification des forfaits expirants...');
            await this.notifyExpiringForfaits(now, tomorrow);
            await this.deactivateExpiredForfaits(now);
        }
        catch (error) {
            console.error('❌ Erreur checkAndManageExpiringForfaits:', error);
        }
    }
    static async notifyExpiringForfaits(now, tomorrow) {
        const expiringSoon = await prisma_client_js_1.default.productForfait.findMany({
            where: {
                isActive: true,
                expiresAt: { gte: now, lte: tomorrow },
            },
            include: {
                forfait: true,
                product: { include: { user: true } },
            },
        });
        console.log(`📢 ${expiringSoon.length} forfait(s) expirent dans 24h`);
        for (const pf of expiringSoon) {
            await prisma_client_js_1.default.notification.create({
                data: {
                    userId: pf.product.user.id,
                    title: "⏰ Forfait expire bientôt",
                    message: `Votre forfait ${pf.forfait.type} pour "${pf.product.name}" expire demain.`,
                    type: "PRODUCT_FORFAIT",
                    link: `/annonce/${pf.productId}`,
                },
            });
        }
    }
    static async deactivateExpiredForfaits(now) {
        const expired = await prisma_client_js_1.default.productForfait.findMany({
            where: {
                isActive: true,
                expiresAt: { lte: now },
            },
            include: {
                forfait: true,
                product: { include: { user: true } },
            },
        });
        console.log(`🔄 ${expired.length} forfait(s) expirés à désactiver`);
        for (const pf of expired) {
            await prisma_client_js_1.default.productForfait.update({
                where: { id: pf.id },
                data: { isActive: false, deactivatedAt: now },
            });
            await prisma_client_js_1.default.notification.create({
                data: {
                    userId: pf.product.user.id,
                    title: "⚠️ Forfait expiré",
                    message: `Votre forfait ${pf.forfait.type} pour "${pf.product.name}" a expiré.`,
                    type: "PRODUCT_FORFAIT",
                    link: `/annonce/${pf.productId}`,
                },
            });
        }
    }
}
exports.default = ForfaitService;
