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
exports.paymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_js_1 = __importDefault(require("../config/config.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const cache_service_js_1 = require("./cache.service.js");
const forfait_service_js_1 = require("./forfait.service.js");
const mailer_js_1 = require("../utils/mailer.js");
const paymentSuccessTemplate_js_1 = require("../templates/paymentSuccessTemplate.js");
const paymentFailedTemplate_js_1 = require("../templates/paymentFailedTemplate.js");
class PaymentService {
    constructor() {
        this.token = null;
        this.tokenExpires = null;
    }
    async getTemporaryToken() {
        try {
            if (this.token && this.tokenExpires && new Date() < this.tokenExpires) {
                return this.token;
            }
            console.log('🔑 Récupération d\'un nouveau token Campay temporaire...');
            const response = await axios_1.default.post(`${config_js_1.default.campay_base_url}/token/`, {
                username: config_js_1.default.campay_username,
                password: config_js_1.default.campay_password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
            this.token = response.data.token;
            this.tokenExpires = new Date(Date.now() + (response.data.expires_in * 1000));
            console.log('✅ Token Campay obtenu avec succès (expire dans', response.data.expires_in, 's)');
            return this.token;
        }
        catch (error) {
            console.error('❌ Erreur obtention token Campay:', error.message);
            throw new Error('Impossible d\'obtenir le token de paiement Campay');
        }
    }
    async getAuthHeader() {
        let authToken;
        if (config_js_1.default.campay_jeton_daccess_permanent && config_js_1.default.campay_jeton_daccess_permanent !== 'GET_YOUR_PERMANENT_TOKEN_FROM_CAMPAY_DASHBOARD') {
            authToken = config_js_1.default.campay_jeton_daccess_permanent;
            console.log('🔑 Utilisation du token permanent Campay');
        }
        else {
            authToken = await this.getTemporaryToken();
            console.log('🔑 Utilisation d\'un token temporaire Campay');
        }
        return {
            'Authorization': `Token ${authToken}`,
            'Content-Type': 'application/json'
        };
    }
    async initiatePayment(userId, productId, forfaitId, phoneNumber) {
        let payment = null;
        try {
            const forfait = await prisma_client_js_1.default.forfait.findUnique({
                where: { id: forfaitId }
            });
            if (!forfait) {
                throw new Error('Forfait non trouvé');
            }
            const phoneForDetection = phoneNumber.replace(/\s+/g, '');
            let detectedMethod = 'MOBILE_MONEY';
            if (phoneForDetection.startsWith('69') || phoneForDetection.startsWith('23769')) {
                detectedMethod = 'ORANGE_MONEY';
            }
            payment = await prisma_client_js_1.default.payment.create({
                data: {
                    userId,
                    productId,
                    forfaitId,
                    amount: forfait.price,
                    currency: 'XAF',
                    phoneNumber,
                    paymentMethod: detectedMethod,
                    status: 'PENDING',
                },
            });
            const authHeaders = await this.getAuthHeader();
            if (!authHeaders) {
                throw new Error('En-têtes d\'authentification Campay non obtenues');
            }
            const cleanPhone = phoneNumber.replace(/\s+/g, '');
            if (!forfait_service_js_1.PHONE_REGEX.test(cleanPhone)) {
                throw new Error(`Numéro de téléphone invalide: ${cleanPhone}. Format attendu: 237XXXXXXXX ou XXXXXXXX pour le Cameroun`);
            }
            let formattedPhone = cleanPhone;
            if (!formattedPhone.startsWith('237')) {
                formattedPhone = '237' + formattedPhone;
            }
            const paymentData = {
                amount: forfait.price.toString(),
                currency: 'XAF',
                from: formattedPhone,
                description: `Forfait ${forfait.type} - ${productId.substring(0, 8)}`,
                external_reference: payment.id,
            };
            console.log('💰 Initiation paiement Campay:', { amount: forfait.price, phoneNumber: formattedPhone });
            const campayResponse = await axios_1.default.post(`${config_js_1.default.campay_base_url}/collect/`, paymentData, {
                headers: authHeaders,
                timeout: 60000,
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            if (campayResponse.status !== 200) {
                console.error('❌ Erreur Campay:', {
                    status: campayResponse.status,
                    data: campayResponse.data,
                    headers: campayResponse.headers
                });
                throw new Error(`Campay error ${campayResponse.status}: ${JSON.stringify(campayResponse.data)}`);
            }
            console.log('✅ Réponse Campay reçue:', {
                reference: campayResponse.data.reference,
                status: campayResponse.data.status,
                operator: campayResponse.data.operator,
                ussdCode: campayResponse.data.ussd_code
            });
            const updatedPayment = await prisma_client_js_1.default.payment.update({
                where: { id: payment.id },
                data: {
                    campayReference: campayResponse.data.reference,
                    campayOperator: campayResponse.data.operator,
                    campayStatus: campayResponse.data.status || 'PENDING',
                    campayTransactionId: campayResponse.data.operator_reference,
                    metadata: {
                        fullCampayResponse: campayResponse.data,
                        ussdCode: campayResponse.data.ussd_code,
                        timestamp: new Date().toISOString()
                    }
                },
            });
            return {
                payment: updatedPayment,
                campayResponse: campayResponse.data,
            };
        }
        catch (error) {
            if (payment?.id) {
                try {
                    console.error('❌ Erreur lors de l\'initiation du paiement:', {
                        paymentId: payment.id,
                        error: error.message,
                        campayStatus: error.response?.status,
                        campayData: error.response?.data
                    });
                    await prisma_client_js_1.default.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'FAILED',
                            errorMessage: error.message,
                            errorDetails: JSON.stringify({
                                httpStatus: error.response?.status,
                                httpData: error.response?.data,
                                timestamp: new Date().toISOString()
                            })
                        },
                    });
                }
                catch (updateError) {
                }
            }
            const enrichedError = new Error(error.message);
            enrichedError.response = error.response;
            enrichedError.config = error.config;
            enrichedError.isAxiosError = error.isAxiosError;
            throw enrichedError;
        }
    }
    async checkPaymentStatus(paymentId) {
        try {
            if (!paymentId || !paymentId.match(/^[0-9a-f-]{36}$/i)) {
                throw new Error('ID de paiement invalide');
            }
            const cacheKey = `payment-status-${paymentId}`;
            const cachedResult = await cache_service_js_1.cacheService.get(cacheKey);
            if (cachedResult && cachedResult.status === 'PENDING') {
                const cacheAge = Date.now() - new Date(cachedResult.cachedAt).getTime();
                if (cacheAge < 15000) {
                    return cachedResult.data;
                }
            }
            const payment = await prisma_client_js_1.default.payment.findUnique({
                where: { id: paymentId },
                include: {
                    forfait: true,
                    product: {
                        select: { id: true, name: true }
                    },
                    user: {
                        select: { id: true }
                    }
                }
            });
            if (!payment) {
                throw new Error('Paiement introuvable');
            }
            if (!payment.campayReference) {
                return payment;
            }
            const authHeaders = await this.getAuthHeader();
            if (!authHeaders) {
                throw new Error('En-têtes d\'authentification Campay indisponibles');
            }
            console.log('🔍 Vérification statut paiement Campay:', payment.campayReference);
            const response = await axios_1.default.get(`${config_js_1.default.campay_base_url}/transaction/${payment.campayReference}/`, {
                headers: authHeaders,
                timeout: 30000,
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            if (response.status !== 200) {
                return payment;
            }
            const campayStatus = response.data.status;
            let newStatus = payment.status;
            switch (campayStatus) {
                case 'SUCCESSFUL':
                    newStatus = 'SUCCESS';
                    break;
                case 'FAILED':
                    newStatus = 'FAILED';
                    break;
                case 'PENDING':
                    newStatus = 'PENDING';
                    break;
                default:
                    newStatus = 'FAILED';
            }
            if (newStatus !== payment.status) {
                const updatedPayment = await prisma_client_js_1.default.payment.update({
                    where: { id: paymentId },
                    data: {
                        status: newStatus,
                        paidAt: newStatus === 'SUCCESS' ? new Date() : payment.paidAt,
                        failureReason: newStatus === 'FAILED' ? response.data.reason : null,
                        campayStatus: campayStatus,
                        metadata: {
                            ...payment.metadata,
                            lastStatusCheck: new Date().toISOString(),
                            campayResponse: response.data
                        },
                    },
                    include: { forfait: true, product: true, user: true }
                });
                if (newStatus === 'SUCCESS') {
                    await this.activateForfaitAfterPayment(updatedPayment);
                    this.sendPaymentSuccessEmail(updatedPayment).catch((error) => {
                        console.error('❌ Erreur envoi email succès:', error);
                    });
                }
                else if (newStatus === 'FAILED') {
                    this.sendPaymentFailureEmail(updatedPayment).catch((error) => {
                        console.error('❌ Erreur envoi email échec:', error);
                    });
                }
                await cache_service_js_1.cacheService.set(cacheKey, {
                    data: updatedPayment,
                    status: updatedPayment.status,
                    cachedAt: new Date().toISOString()
                }, 30);
                return updatedPayment;
            }
            await cache_service_js_1.cacheService.set(cacheKey, {
                data: payment,
                status: payment.status,
                cachedAt: new Date().toISOString()
            }, 15);
            return payment;
        }
        catch (error) {
            if (error.isAxiosError || error.message.includes('Token') || error.message.includes('timeout')) {
                try {
                    const fallbackPayment = await prisma_client_js_1.default.payment.findUnique({
                        where: { id: paymentId },
                        include: {
                            forfait: true,
                            product: { select: { id: true, name: true } },
                            user: { select: { id: true } }
                        }
                    });
                    if (fallbackPayment) {
                        return {
                            ...fallbackPayment,
                            _fallbackMode: true,
                            _lastCheck: new Date().toISOString(),
                            _errorReason: error.message
                        };
                    }
                }
                catch (fallbackError) {
                }
            }
            throw new Error('Erreur lors de la vérification du paiement');
        }
    }
    async activateForfaitAfterPayment(payment) {
        try {
            console.log('🔄 Activation du forfait après paiement:', {
                paymentId: payment.id,
                productId: payment.productId,
                forfaitType: payment.forfait.type
            });
            const ForfaitService = (await Promise.resolve().then(() => __importStar(require('./forfait.service.js')))).default;
            const result = await ForfaitService.assignForfaitSmart(payment.productId, payment.forfait.type, { userId: payment.userId, skipNotification: false });
            if (!result.success) {
                console.log('⚠️ Activation forfait:', result.error?.message);
                if (result.error?.message.includes('déjà actif')) {
                    console.log('ℹ️ Forfait déjà actif, paiement déjà traité');
                    return;
                }
                throw new Error(result.error?.message || 'Erreur activation forfait');
            }
            console.log('✅ Forfait activé avec succès:', {
                deactivatedCount: result.deactivatedCount,
                forfaitId: result.productForfait?.id
            });
            cache_service_js_1.cacheService.invalidateHomepageProducts();
        }
        catch (error) {
            console.error('❌ Erreur activateForfaitAfterPayment:', error);
            throw error;
        }
    }
    async getUserPayments(userId, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const [payments, totalCount] = await Promise.all([
                prisma_client_js_1.default.payment.findMany({
                    where: { userId },
                    skip: offset,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        forfait: {
                            select: {
                                id: true,
                                type: true,
                                price: true,
                                duration: true,
                                description: true,
                            }
                        },
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true,
                                status: true,
                            },
                        },
                    },
                }),
                prisma_client_js_1.default.payment.count({ where: { userId } })
            ]);
            const enrichedPayments = await Promise.all(payments.map(async (payment) => {
                if (payment.status === 'SUCCESS' && payment.product) {
                    const activeForfait = await prisma_client_js_1.default.productForfait.findFirst({
                        where: {
                            productId: payment.productId,
                            forfaitId: payment.forfaitId,
                            isActive: true,
                            expiresAt: { gt: new Date() }
                        },
                        select: {
                            id: true,
                            activatedAt: true,
                            expiresAt: true,
                            isActive: true,
                        }
                    });
                    return {
                        ...payment,
                        activeForfait,
                        isExpired: activeForfait ? new Date() > activeForfait.expiresAt : true,
                        remainingDays: activeForfait
                            ? Math.max(0, Math.ceil((activeForfait.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                            : 0,
                    };
                }
                return payment;
            }));
            return {
                payments: enrichedPayments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    total: totalCount,
                    perPage: limit,
                },
            };
        }
        catch (error) {
            throw new Error('Erreur lors de la récupération des paiements');
        }
    }
    async checkPaymentStatusWithFallback(paymentId) {
        try {
            return await this.checkPaymentStatus(paymentId);
        }
        catch (error) {
            try {
                const payment = await prisma_client_js_1.default.payment.findUnique({
                    where: { id: paymentId },
                    include: {
                        forfait: true,
                        product: { select: { id: true, name: true } },
                        user: { select: { id: true } }
                    }
                });
                if (!payment) {
                    throw new Error('Paiement introuvable');
                }
                return {
                    ...payment,
                    _fallbackMode: true,
                    _lastCheck: new Date().toISOString(),
                    _errorReason: error.message
                };
            }
            catch (fallbackError) {
                throw new Error('Service de paiement temporairement indisponible');
            }
        }
    }
    async checkAllPendingPayments() {
        try {
            const pendingPayments = await prisma_client_js_1.default.payment.findMany({
                where: {
                    status: 'PENDING',
                    campayReference: { not: null },
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    forfait: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            userId: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
            for (const payment of pendingPayments) {
                try {
                    if (!payment.product) {
                        await prisma_client_js_1.default.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: 'FAILED',
                                failureReason: 'Produit associé supprimé',
                                errorMessage: 'Le produit associé à ce paiement n\'existe plus'
                            }
                        });
                        continue;
                    }
                    if (!payment.user) {
                        await prisma_client_js_1.default.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: 'FAILED',
                                failureReason: 'Utilisateur associé introuvable',
                                errorMessage: 'L\'utilisateur associé à ce paiement n\'existe plus'
                            }
                        });
                        continue;
                    }
                    if (!payment.forfait) {
                        await prisma_client_js_1.default.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: 'FAILED',
                                failureReason: 'Forfait associé introuvable',
                                errorMessage: 'Le forfait associé à ce paiement n\'existe plus'
                            }
                        });
                        continue;
                    }
                    await this.checkPaymentStatus(payment.id);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                }
            }
        }
        catch (error) {
        }
    }
    async cleanupExpiredPayments() {
        try {
            await prisma_client_js_1.default.payment.updateMany({
                where: {
                    status: 'PENDING',
                    createdAt: {
                        lt: new Date(Date.now() - 48 * 60 * 60 * 1000)
                    }
                },
                data: {
                    status: 'EXPIRED',
                    failureReason: 'Paiement expiré après 48 heures'
                }
            });
        }
        catch (error) {
        }
    }
    async getPaymentStats() {
        try {
            const now = new Date();
            const sixMonthsAgo = new Date(now);
            sixMonthsAgo.setMonth(now.getMonth() - 6);
            const [totalPayments, successPayments, monthlyRevenue, semiAnnualRevenue] = await Promise.all([
                prisma_client_js_1.default.payment.count({
                    where: { status: 'SUCCESS' }
                }),
                prisma_client_js_1.default.payment.count({
                    where: { status: 'SUCCESS' }
                }),
                prisma_client_js_1.default.payment.aggregate({
                    where: {
                        status: 'SUCCESS',
                        paidAt: {
                            gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        },
                    },
                    _sum: { amount: true },
                }),
                prisma_client_js_1.default.payment.aggregate({
                    where: {
                        status: 'SUCCESS',
                        paidAt: { gte: sixMonthsAgo },
                    },
                    _sum: { amount: true },
                }),
            ]);
            const revenueByMonth = [];
            for (let i = 5; i >= 0; i--) {
                const monthStart = new Date(now);
                monthStart.setMonth(now.getMonth() - i);
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                const monthData = await prisma_client_js_1.default.payment.aggregate({
                    where: {
                        status: 'SUCCESS',
                        paidAt: {
                            gte: monthStart,
                            lt: monthEnd,
                        },
                    },
                    _sum: { amount: true },
                    _count: true,
                });
                revenueByMonth.push({
                    month: monthStart.toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: 'numeric',
                    }),
                    revenue: monthData._sum.amount || 0,
                    count: monthData._count || 0,
                });
            }
            return {
                totalPayments,
                successPayments,
                monthlyRevenue: monthlyRevenue._sum.amount || 0,
                semiAnnualRevenue: semiAnnualRevenue._sum.amount || 0,
                revenueByMonth,
                currency: 'XAF',
            };
        }
        catch (error) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }
    }
    async cleanupFailedPayments() {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const result = await prisma_client_js_1.default.payment.deleteMany({
                where: {
                    status: {
                        in: ['FAILED', 'CANCELLED', 'EXPIRED']
                    },
                    createdAt: {
                        lt: sevenDaysAgo
                    }
                }
            });
            console.log(`🧹 Nettoyage automatique: ${result.count} paiements échoués supprimés`);
        }
        catch (error) {
            console.error('❌ Erreur nettoyage paiements:', error);
        }
    }
    async sendPaymentSuccessEmail(payment) {
        try {
            const expiresAt = new Date(payment.paidAt);
            expiresAt.setDate(expiresAt.getDate() + payment.forfait.duration);
            const productLink = payment.product.slug
                ? `${config_js_1.default.frontendUrl}/produit/${payment.product.slug}`
                : `${config_js_1.default.frontendUrl}/produit/${payment.product.id}`;
            const html = (0, paymentSuccessTemplate_js_1.createPaymentSuccessTemplate)({
                firstName: payment.user.firstName,
                lastName: payment.user.lastName,
                productName: payment.product.name,
                productLink,
                forfaitType: payment.forfait.type,
                forfaitDuration: payment.forfait.duration,
                amountPaid: payment.amount,
                paidAt: payment.paidAt,
                campayReference: payment.campayReference,
                expiresAt,
            });
            const emailSent = await (0, mailer_js_1.sendEmail)(payment.user.email, '✅ Paiement Réussi - Votre Annonce est Boostée !', `Votre paiement de ${payment.amount} XAF a été confirmé. Votre annonce "${payment.product.name}" bénéficie maintenant du forfait ${payment.forfait.type} pendant ${payment.forfait.duration} jours.`, html);
            if (emailSent) {
                console.log('📧 Email de succès envoyé à:', payment.user.email);
            }
            else {
                console.warn('⚠️ Échec envoi email succès (SMTP)');
            }
        }
        catch (error) {
            console.error('❌ Erreur sendPaymentSuccessEmail:', error);
        }
    }
    async sendPaymentFailureEmail(payment) {
        try {
            const productLink = `${config_js_1.default.frontendUrl}/profil?tab=active`;
            const supportEmail = config_js_1.default.brevoFromEmail || 'noreply@buyandsale.cm';
            const html = (0, paymentFailedTemplate_js_1.createPaymentFailedTemplate)({
                firstName: payment.user.firstName,
                lastName: payment.user.lastName,
                productName: payment.product.name,
                productLink,
                forfaitType: payment.forfait.type,
                amountAttempted: payment.amount,
                failureReason: payment.failureReason,
                campayReference: payment.campayReference,
                attemptedAt: payment.createdAt,
                supportEmail,
            });
            const emailSent = await (0, mailer_js_1.sendEmail)(payment.user.email, '❌ Échec du Paiement - BuyAndSale', `Votre tentative de paiement de ${payment.amount} XAF pour le forfait ${payment.forfait.type} n'a pas abouti. Raison: ${payment.failureReason || 'Solde insuffisant ou paiement annulé'}.`, html);
            if (emailSent) {
                console.log('📧 Email d\'échec envoyé à:', payment.user.email);
            }
            else {
                console.warn('⚠️ Échec envoi email échec (SMTP)');
            }
        }
        catch (error) {
            console.error('❌ Erreur sendPaymentFailureEmail:', error);
        }
    }
}
exports.paymentService = new PaymentService();
