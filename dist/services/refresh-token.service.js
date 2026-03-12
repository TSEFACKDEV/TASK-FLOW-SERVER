"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenService = void 0;
const prisma_client_1 = __importDefault(require("../model/prisma.client"));
class RefreshTokenService {
    static async cleanupOldTokens(userId) {
        try {
            const userTokens = await prisma_client_1.default.refreshToken.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (userTokens.length > 5) {
                const tokensToDelete = userTokens.slice(5);
                const idsToDelete = tokensToDelete.map((t) => t.id);
                await prisma_client_1.default.refreshToken.deleteMany({
                    where: {
                        id: { in: idsToDelete },
                    },
                });
                console.log(`🧹 [RefreshToken] Supprimé ${idsToDelete.length} anciennes sessions pour l'utilisateur ${userId}`);
            }
        }
        catch (error) {
            console.error('❌ [RefreshToken] Erreur lors du nettoyage:', error);
        }
    }
    static async cleanupExpiredTokens() {
        try {
            const deleted = await prisma_client_1.default.refreshToken.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });
            return deleted.count;
        }
        catch (error) {
            console.error('❌ [RefreshToken] Erreur lors du nettoyage des tokens expirés:', error);
            return 0;
        }
    }
    static async getActiveSessionsCount(userId) {
        try {
            return await prisma_client_1.default.refreshToken.count({
                where: {
                    userId,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });
        }
        catch (error) {
            console.error('❌ [RefreshToken] Erreur lors du comptage des sessions:', error);
            return 0;
        }
    }
    static async revokeAllUserTokens(userId) {
        try {
            const deleted = await prisma_client_1.default.refreshToken.deleteMany({
                where: { userId },
            });
            console.log(`🔒 [RefreshToken] Toutes les sessions révoquées pour l'utilisateur ${userId}`);
            return deleted.count;
        }
        catch (error) {
            console.error('❌ [RefreshToken] Erreur lors de la révocation globale:', error);
            return 0;
        }
    }
}
exports.RefreshTokenService = RefreshTokenService;
