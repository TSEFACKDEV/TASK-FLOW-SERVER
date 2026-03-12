"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.campayWebhook = exports.getUserPayments = exports.checkPaymentStatus = exports.initiatePayment = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const payment_service_js_1 = require("../services/payment.service.js");
const cache_service_js_1 = require("../services/cache.service.js");
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const forfait_service_js_1 = require("../services/forfait.service.js");
const initiatePayment = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        const { productId, forfaitId, phoneNumber } = req.body;
        if (!userId) {
            return response_js_1.default.error(res, 'Utilisateur non authentifié', null, 401);
        }
        if (!productId || !forfaitId || !phoneNumber) {
            return response_js_1.default.error(res, 'Tous les champs sont requis', null, 400);
        }
        const cleanPhone = phoneNumber.replace(/\s+/g, '');
        if (!forfait_service_js_1.PHONE_REGEX.test(cleanPhone)) {
            return response_js_1.default.error(res, 'Numéro de téléphone invalide (format: 237XXXXXXXX ou XXXXXXXX)', null, 400);
        }
        const result = await payment_service_js_1.paymentService.initiatePayment(userId, productId, forfaitId, cleanPhone);
        response_js_1.default.success(res, 'Paiement initié avec succès', {
            paymentId: result.payment.id,
            amount: result.payment.amount,
            status: result.payment.status,
            campayReference: result.payment.campayReference,
            ussdCode: result.campayResponse?.ussd_code,
            instructions: 'Composez le code USSD pour finaliser le paiement',
        });
    }
    catch (error) {
        response_js_1.default.error(res, 'Erreur lors de l\'initiation du paiement', error.message);
    }
};
exports.initiatePayment = initiatePayment;
const checkPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.authUser?.id;
        if (!userId) {
            return response_js_1.default.error(res, 'Utilisateur non authentifié', null, 401);
        }
        const payment = await payment_service_js_1.paymentService.checkPaymentStatusWithFallback(paymentId);
        if (payment.userId !== userId) {
            return response_js_1.default.error(res, 'Accès non autorisé', null, 403);
        }
        if (payment.status === 'SUCCESS') {
            cache_service_js_1.cacheService.invalidateHomepageProducts();
        }
        let forfaitActivated = false;
        if (payment.status === 'SUCCESS') {
            const activeForfait = await prisma_client_js_1.default.productForfait.findFirst({
                where: {
                    productId: payment.productId,
                    forfaitId: payment.forfaitId,
                    isActive: true,
                    expiresAt: { gt: new Date() }
                }
            });
            forfaitActivated = !!activeForfait;
        }
        response_js_1.default.success(res, 'Statut du paiement récupéré', {
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            paidAt: payment.paidAt,
            forfaitActivated,
            forfait: payment.forfait,
            product: {
                id: payment.product.id,
                name: payment.product.name,
            },
            _fallbackMode: payment._fallbackMode || false,
            _lastCheck: payment._lastCheck,
            _errorReason: payment._errorReason
        });
    }
    catch (error) {
        response_js_1.default.error(res, 'Erreur lors de la vérification du paiement', error.message);
    }
};
exports.checkPaymentStatus = checkPaymentStatus;
const getUserPayments = async (req, res) => {
    try {
        const userId = req.authUser?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (!userId) {
            return response_js_1.default.error(res, 'Utilisateur non authentifié', null, 401);
        }
        const result = await payment_service_js_1.paymentService.getUserPayments(userId, page, limit);
        response_js_1.default.success(res, 'Historique des paiements récupéré', result);
    }
    catch (error) {
        response_js_1.default.error(res, 'Erreur lors de la récupération des paiements', error.message);
    }
};
exports.getUserPayments = getUserPayments;
const campayWebhook = async (req, res) => {
    try {
        console.log('🔔 Webhook Campay reçu:', req.body);
        const { external_reference } = req.body;
        if (!external_reference) {
            return response_js_1.default.error(res, 'Référence externe manquante', null, 400);
        }
        const payment = await payment_service_js_1.paymentService.checkPaymentStatus(external_reference);
        console.log(`✅ Webhook traité - Payment ${external_reference} status: ${payment.status}`);
        response_js_1.default.success(res, 'Webhook traité avec succès', {
            paymentId: external_reference,
            status: payment.status
        });
    }
    catch (error) {
        console.error('❌ Erreur webhook Campay:', error);
        response_js_1.default.error(res, 'Erreur lors du traitement du webhook', error.message);
    }
};
exports.campayWebhook = campayWebhook;
