"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const product_config_js_1 = require("../config/product.config.js");
const notification_service_js_1 = require("./notification.service.js");
class ProductExpirationService {
    static async checkAndExpireProducts() {
        try {
            const now = new Date();
            console.log('🔍 [ProductExpiration] Vérification des annonces expirées...');
            const expiredProducts = await prisma_client_js_1.default.product.findMany({
                where: {
                    status: 'VALIDATED',
                    expiresAt: {
                        lte: now,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });
            if (expiredProducts.length === 0) {
                console.log('✅ [ProductExpiration] Aucune annonce à expirer');
                return;
            }
            console.log(`⏰ [ProductExpiration] ${expiredProducts.length} annonce(s) à expirer`);
            for (const product of expiredProducts) {
                await prisma_client_js_1.default.product.update({
                    where: { id: product.id },
                    data: { status: 'EXPIRED' },
                });
                await (0, notification_service_js_1.createNotification)(product.user.id, '⏰ Annonce expirée', `Votre annonce "${product.name}" a expiré après 60 jours. Vous pouvez la réactiver depuis votre profil.`, {
                    type: 'PRODUCT_EXPIRATION',
                    link: `/profile?tab=expired`,
                });
                console.log(`✅ [ProductExpiration] Annonce expirée: ${product.name} (${product.id})`);
            }
            console.log(`✅ [ProductExpiration] ${expiredProducts.length} annonce(s) expirée(s) avec succès`);
        }
        catch (error) {
            console.error('❌ [ProductExpiration] Erreur lors de l\'expiration des annonces:', error);
        }
    }
    static async notifyExpiringProducts() {
        try {
            const now = new Date();
            const sevenDaysFromNow = new Date(now);
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + product_config_js_1.PRODUCT_CONFIG.EXPIRATION_WARNING_DAYS);
            sevenDaysFromNow.setHours(23, 59, 59, 999);
            const sevenDaysStart = new Date(sevenDaysFromNow);
            sevenDaysStart.setHours(0, 0, 0, 0);
            const oneDayFromNow = new Date(now);
            oneDayFromNow.setDate(oneDayFromNow.getDate() + product_config_js_1.PRODUCT_CONFIG.EXPIRATION_FINAL_WARNING_DAYS);
            oneDayFromNow.setHours(23, 59, 59, 999);
            const oneDayStart = new Date(oneDayFromNow);
            oneDayStart.setHours(0, 0, 0, 0);
            console.log('📢 [ProductExpiration] Vérification des annonces à notifier...');
            const expiringSoon = await prisma_client_js_1.default.product.findMany({
                where: {
                    status: 'VALIDATED',
                    expiresAt: {
                        gte: sevenDaysStart,
                        lte: sevenDaysFromNow,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                        },
                    },
                },
            });
            const expiringTomorrow = await prisma_client_js_1.default.product.findMany({
                where: {
                    status: 'VALIDATED',
                    expiresAt: {
                        gte: oneDayStart,
                        lte: oneDayFromNow,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                        },
                    },
                },
            });
            for (const product of expiringSoon) {
                await (0, notification_service_js_1.createNotification)(product.user.id, '⚠️ Annonce expire bientôt', `Votre annonce "${product.name}" expire dans 7 jours. Pensez à la renouveler !`, {
                    type: 'PRODUCT_EXPIRATION_WARNING',
                    link: `/annonce/${product.slug || product.id}`,
                });
            }
            for (const product of expiringTomorrow) {
                await (0, notification_service_js_1.createNotification)(product.user.id, '🚨 Annonce expire demain', `Votre annonce "${product.name}" expire demain ! Dernière chance pour la renouveler.`, {
                    type: 'PRODUCT_EXPIRATION_URGENT',
                    link: `/annonce/${product.slug || product.id}`,
                });
            }
            console.log(`📢 [ProductExpiration] ${expiringSoon.length} notification(s) 7 jours, ${expiringTomorrow.length} notification(s) 1 jour`);
        }
        catch (error) {
            console.error('❌ [ProductExpiration] Erreur lors de la notification:', error);
        }
    }
}
exports.default = ProductExpirationService;
