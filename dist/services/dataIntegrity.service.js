"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataIntegrityService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
class DataIntegrityService {
    async checkPaymentIntegrity() {
        try {
            const orphanedPayments = await prisma_client_js_1.default.payment.findMany({
                where: {
                    NOT: {
                        product: {
                            id: {
                                not: undefined
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    productId: true,
                    status: true,
                    createdAt: true
                }
            });
            if (orphanedPayments.length > 0) {
                await prisma_client_js_1.default.payment.updateMany({
                    where: {
                        id: {
                            in: orphanedPayments.map(p => p.id)
                        }
                    },
                    data: {
                        status: 'FAILED',
                        failureReason: 'Données de référence invalides',
                        errorMessage: 'Le produit ou utilisateur associé n\'existe plus'
                    }
                });
            }
            const paymentsWithInvalidUsers = await prisma_client_js_1.default.payment.findMany({
                where: {
                    NOT: {
                        user: {
                            id: {
                                not: undefined
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    userId: true,
                    status: true
                }
            });
            if (paymentsWithInvalidUsers.length > 0) {
                await prisma_client_js_1.default.payment.updateMany({
                    where: {
                        id: {
                            in: paymentsWithInvalidUsers.map(p => p.id)
                        }
                    },
                    data: {
                        status: 'FAILED',
                        failureReason: 'Utilisateur associé introuvable',
                        errorMessage: 'L\'utilisateur associé à ce paiement n\'existe plus'
                    }
                });
            }
        }
        catch (error) {
        }
    }
    startIntegrityChecks() {
        node_cron_1.default.schedule('0 * * * *', async () => {
            await this.checkPaymentIntegrity();
        });
        setTimeout(async () => {
            await this.checkPaymentIntegrity();
        }, 5000);
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
}
exports.dataIntegrityService = new DataIntegrityService();
