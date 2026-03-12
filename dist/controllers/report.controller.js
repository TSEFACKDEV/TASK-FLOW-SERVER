"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportsStatistics = exports.processReport = exports.getReportById = exports.getAllReports = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const utils_js_1 = __importDefault(require("../helper/utils.js"));
const cache_service_js_1 = require("../services/cache.service.js");
const getAllReports = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const reason = req.query.reason;
    const search = req.query.search || "";
    try {
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (reason) {
            whereClause.reason = reason;
        }
        if (search) {
            whereClause.OR = [
                {
                    reportedUser: {
                        OR: [
                            { firstName: { contains: search, mode: "insensitive" } },
                            { lastName: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
                {
                    reportingUser: {
                        OR: [
                            { firstName: { contains: search, mode: "insensitive" } },
                            { lastName: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
                { details: { contains: search, mode: "insensitive" } },
                { reason: { contains: search, mode: "insensitive" } },
            ];
        }
        const reports = await prisma_client_js_1.default.userReport.findMany({
            skip: offset,
            take: limit,
            where: whereClause,
            include: {
                reportedUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        status: true,
                    },
                },
                reportingUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const totalReports = await prisma_client_js_1.default.userReport.count({
            where: whereClause,
        });
        const stats = await prisma_client_js_1.default.userReport.groupBy({
            by: ["reason"],
            _count: {
                _all: true,
            },
        });
        const result = {
            reports,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReports / limit),
                totalItems: totalReports,
                hasNext: page * limit < totalReports,
                hasPrev: page > 1,
            },
            statistics: {
                total: totalReports,
                byReason: stats.reduce((acc, stat) => {
                    acc[stat.reason] = stat._count._all;
                    return acc;
                }, {}),
            },
        };
        response_js_1.default.success(res, "Reports retrieved successfully", result);
    }
    catch (error) {
        console.error("Error fetching reports:", error);
        response_js_1.default.error(res, "Failed to fetch reports", error.message);
    }
};
exports.getAllReports = getAllReports;
const getReportById = async (req, res) => {
    const reportId = req.params.id;
    try {
        const report = await prisma_client_js_1.default.userReport.findUnique({
            where: { id: reportId },
            include: {
                reportedUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        status: true,
                        createdAt: true,
                        products: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                        reportsReceived: {
                            select: {
                                id: true,
                                reason: true,
                                createdAt: true,
                            },
                        },
                    },
                },
                reportingUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!report) {
            return response_js_1.default.notFound(res, "Report not found", 404);
        }
        response_js_1.default.success(res, "Report retrieved successfully", report);
    }
    catch (error) {
        console.error("Error fetching report:", error);
        response_js_1.default.error(res, "Failed to fetch report", error.message);
    }
};
exports.getReportById = getReportById;
const processReport = async (req, res) => {
    const reportId = req.params.id;
    const { action, adminNotes } = req.body;
    const adminUserId = req.authUser?.id;
    if (!action) {
        return response_js_1.default.error(res, "Action is required", 400);
    }
    try {
        const report = await prisma_client_js_1.default.userReport.findUnique({
            where: { id: reportId },
            include: {
                reportedUser: true,
            },
        });
        if (!report) {
            return response_js_1.default.notFound(res, "Report not found", 404);
        }
        const result = await prisma_client_js_1.default.$transaction(async (tx) => {
            const updatedReport = await tx.userReport.update({
                where: { id: reportId },
                data: {
                    status: action === "dismiss" ? "DISMISSED" : "PROCESSED",
                    processedAt: new Date(),
                    processedBy: adminUserId,
                    adminNotes,
                },
            });
            let userAction = null;
            let deletedProductsInfo = null;
            if (action === "suspend") {
                const userProducts = await tx.product.findMany({
                    where: { userId: report.reportedUserId },
                    select: { id: true, images: true, name: true },
                });
                if (userProducts.length > 0) {
                    const imagePromises = userProducts.flatMap((product) => {
                        const images = product.images;
                        return images.map((img) => utils_js_1.default.deleteFile(img));
                    });
                    await Promise.allSettled(imagePromises);
                    const deleteResult = await tx.product.deleteMany({
                        where: { userId: report.reportedUserId },
                    });
                    deletedProductsInfo = {
                        count: deleteResult.count,
                        products: userProducts.map((p) => p.name),
                    };
                    cache_service_js_1.cacheService.invalidateAllProducts();
                    console.log(`🗑️ [SUSPEND] Cache produits invalidé après suppression de ${deleteResult.count} produits`);
                }
                userAction = await tx.user.update({
                    where: { id: report.reportedUserId },
                    data: { status: "SUSPENDED" },
                });
            }
            else if (action === "ban") {
                const userProducts = await tx.product.findMany({
                    where: { userId: report.reportedUserId },
                    select: { id: true, images: true, name: true },
                });
                if (userProducts.length > 0) {
                    const imagePromises = userProducts.flatMap((product) => {
                        const images = product.images;
                        return images.map((img) => utils_js_1.default.deleteFile(img));
                    });
                    await Promise.allSettled(imagePromises);
                    const deleteResult = await tx.product.deleteMany({
                        where: { userId: report.reportedUserId },
                    });
                    deletedProductsInfo = {
                        count: deleteResult.count,
                        products: userProducts.map((p) => p.name),
                    };
                    cache_service_js_1.cacheService.invalidateAllProducts();
                    console.log(`🗑️ [BAN] Cache produits invalidé après suppression de ${deleteResult.count} produits`);
                }
                userAction = await tx.user.update({
                    where: { id: report.reportedUserId },
                    data: { status: "BANNED" },
                });
            }
            if (action !== "dismiss") {
                const baseMessage = `Suite à un signalement, votre compte a été ${action === "warn"
                    ? "averti"
                    : action === "suspend"
                        ? "suspendu"
                        : "banni"}.`;
                const productMessage = deletedProductsInfo
                    ? ` Vos ${deletedProductsInfo.count} produit(s) ont également été supprimés.`
                    : "";
                await tx.notification.create({
                    data: {
                        userId: report.reportedUserId,
                        title: `Votre compte a fait l'objet d'une action administrative`,
                        message: baseMessage + productMessage,
                        type: "ADMIN_ACTION",
                        data: {
                            reportId,
                            action,
                            adminNotes,
                            ...(deletedProductsInfo && {
                                deletedProducts: deletedProductsInfo,
                            }),
                        },
                    },
                });
            }
            return { updatedReport, userAction };
        });
        response_js_1.default.success(res, "Report processed successfully", result);
    }
    catch (error) {
        console.error("Error processing report:", error);
        response_js_1.default.error(res, "Failed to process report", error.message);
    }
};
exports.processReport = processReport;
const getReportsStatistics = async (_req, res) => {
    try {
        const [totalReports, pendingReports, reportsByReason, reportsByMonth, topReportedUsers,] = await Promise.all([
            prisma_client_js_1.default.userReport.count(),
            prisma_client_js_1.default.userReport.count({
                where: { status: "PENDING" },
            }),
            prisma_client_js_1.default.userReport.groupBy({
                by: ["reason"],
                _count: { _all: true },
            }),
            prisma_client_js_1.default.$queryRaw `
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          COUNT(*) as count
        FROM "UserReport" 
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month DESC
      `,
            prisma_client_js_1.default.userReport.groupBy({
                by: ["reportedUserId"],
                _count: {
                    reportedUserId: true,
                },
                orderBy: {
                    _count: {
                        reportedUserId: "desc",
                    },
                },
                take: 10,
            }),
        ]);
        const statistics = {
            overview: {
                total: totalReports,
                pending: pendingReports,
                processed: totalReports - pendingReports,
            },
            byReason: reportsByReason.reduce((acc, item) => {
                acc[item.reason] = item._count._all || 0;
                return acc;
            }, {}),
            byMonth: reportsByMonth.map((item) => ({
                month: item.month,
                count: Number(item.count),
            })),
            topReported: topReportedUsers.map((item) => ({
                userId: item.reportedUserId,
                count: item._count.reportedUserId || 0,
            })),
        };
        response_js_1.default.success(res, "Statistics retrieved successfully", statistics);
    }
    catch (error) {
        console.error("Error fetching statistics:", error);
        response_js_1.default.error(res, "Failed to fetch statistics", error.message);
    }
};
exports.getReportsStatistics = getReportsStatistics;
