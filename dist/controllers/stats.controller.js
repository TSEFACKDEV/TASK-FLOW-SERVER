"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPaymentsAdmin = exports.getPaymentStats = exports.getPlatformStats = void 0;
const client_1 = require("@prisma/client");
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const response_js_1 = __importDefault(require("../helper/response.js"));
const getPlatformStats = async (_req, res) => {
    try {
        const [totalUsers, activeUsers, totalProducts, activeProducts, totalCities] = await Promise.all([
            prisma_client_js_1.default.user.count(),
            prisma_client_js_1.default.user.count({
                where: {
                    status: client_1.AccountStatus.ACTIVE,
                },
            }),
            prisma_client_js_1.default.product.count(),
            prisma_client_js_1.default.product.count({
                where: {
                    status: client_1.ProductStatus.VALIDATED,
                },
            }),
            prisma_client_js_1.default.city.count(),
        ]);
        const successRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0';
        return res.status(200).json({
            success: true,
            data: {
                users: totalUsers,
                activeUsers,
                products: totalProducts,
                activeProducts,
                cities: totalCities,
                successRate: parseFloat(successRate),
            },
        });
    }
    catch (error) {
        console.error('Error fetching platform stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
        });
    }
};
exports.getPlatformStats = getPlatformStats;
const getPaymentStats = async (_req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const [totalPayments, successPayments, failedPayments, pendingPayments, cancelledPayments] = await Promise.all([
            prisma_client_js_1.default.payment.count(),
            prisma_client_js_1.default.payment.count({ where: { status: client_1.PaymentStatus.SUCCESS } }),
            prisma_client_js_1.default.payment.count({ where: { status: client_1.PaymentStatus.FAILED } }),
            prisma_client_js_1.default.payment.count({ where: { status: client_1.PaymentStatus.PENDING } }),
            prisma_client_js_1.default.payment.count({ where: { status: client_1.PaymentStatus.CANCELLED } }),
        ]);
        const monthlyPayments = await prisma_client_js_1.default.payment.findMany({
            where: {
                status: client_1.PaymentStatus.SUCCESS,
                paidAt: { gte: startOfMonth }
            },
            select: { amount: true }
        });
        const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const semiAnnualPayments = await prisma_client_js_1.default.payment.findMany({
            where: {
                status: client_1.PaymentStatus.SUCCESS,
                paidAt: { gte: sixMonthsAgo }
            },
            select: { amount: true }
        });
        const semiAnnualRevenue = semiAnnualPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const revenueByMonth = await Promise.all(Array.from({ length: 6 }, async (_, i) => {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0);
            const payments = await prisma_client_js_1.default.payment.findMany({
                where: {
                    status: client_1.PaymentStatus.SUCCESS,
                    paidAt: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                },
                select: { amount: true }
            });
            const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
            return {
                month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
                revenue,
                count: payments.length
            };
        }));
        const successRate = totalPayments > 0
            ? ((successPayments / totalPayments) * 100).toFixed(1)
            : '0.0';
        return response_js_1.default.success(res, 'Statistiques de paiement récupérées', {
            totalPayments,
            successPayments,
            failedPayments,
            pendingPayments,
            cancelledPayments,
            successRate: parseFloat(successRate),
            monthlyRevenue,
            semiAnnualRevenue,
            revenueByMonth,
            currency: 'XAF'
        });
    }
    catch (error) {
        console.error('Error fetching payment stats:', error);
        return response_js_1.default.error(res, 'Erreur lors de la récupération des statistiques de paiement', error.message);
    }
};
exports.getPaymentStats = getPaymentStats;
const getAllPaymentsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const search = req.query.search;
        const showAll = req.query.showAll === 'true';
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        else if (!showAll) {
            where.status = client_1.PaymentStatus.SUCCESS;
        }
        if (search) {
            where.OR = [
                { campayReference: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { product: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const [payments, total] = await Promise.all([
            prisma_client_js_1.default.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { paidAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            price: true
                        }
                    },
                    forfait: {
                        select: {
                            id: true,
                            type: true,
                            price: true,
                            duration: true
                        }
                    }
                }
            }),
            prisma_client_js_1.default.payment.count({ where })
        ]);
        const totalPages = Math.ceil(total / limit);
        const formattedPayments = payments.map(payment => ({
            ...payment,
            user: {
                ...payment.user,
                name: `${payment.user.firstName} ${payment.user.lastName}`
            }
        }));
        return response_js_1.default.success(res, 'Paiements récupérés avec succès', {
            payments: formattedPayments,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit
            }
        });
    }
    catch (error) {
        console.error('Error fetching payments:', error);
        return response_js_1.default.error(res, 'Erreur lors de la récupération des paiements', error.message);
    }
};
exports.getAllPaymentsAdmin = getAllPaymentsAdmin;
