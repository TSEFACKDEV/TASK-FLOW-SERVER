"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimiter = exports.paymentStatusRateLimiter = exports.forfaitRateLimiter = exports.createProductRateLimiter = exports.authRateLimiter = void 0;
const store = new Map();
function createRateLimiter(windowMs, maxRequests, message) {
    return (req, res, next) => {
        try {
            const ip = req.ip || "unknown";
            const userId = req.user?.id;
            const key = userId ? `${ip}:${userId}` : `ip:${ip}`;
            const now = Date.now();
            let userStore = store.get(key);
            if (!userStore || userStore.resetTime <= now) {
                userStore = {
                    requests: 1,
                    resetTime: now + windowMs,
                };
                store.set(key, userStore);
            }
            else {
                if (userStore.requests < maxRequests) {
                    userStore.requests++;
                }
            }
            const remaining = Math.max(0, maxRequests - userStore.requests);
            const resetSeconds = Math.ceil(userStore.resetTime / 1000);
            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", remaining);
            res.setHeader("X-RateLimit-Reset", resetSeconds);
            if (userStore.requests > maxRequests) {
                const retryAfter = Math.ceil((userStore.resetTime - now) / 1000);
                res.setHeader("Retry-After", retryAfter);
                return res.status(429).json({
                    error: message,
                    retryAfter: retryAfter,
                    remaining: 0,
                });
            }
            next();
        }
        catch (error) {
            console.error("Rate limiter error:", error);
            next();
        }
    };
}
exports.authRateLimiter = createRateLimiter(15 * 60 * 1000, 15, "Trop de tentatives de connexion depuis cette adresse IP. Attendez 15 minutes.");
exports.createProductRateLimiter = createRateLimiter(60 * 1000, 20, "Limite de création de produits atteinte. Attendez 1 minute.");
exports.forfaitRateLimiter = createRateLimiter(60 * 1000, 30, "Trop de tentatives d'assignation de forfait. Attendez quelques secondes.");
exports.paymentStatusRateLimiter = createRateLimiter(60 * 1000, 40, "Trop de vérifications de paiement. Attendez quelques secondes.");
exports.generalRateLimiter = createRateLimiter(60 * 1000, 1000, "Trop de requêtes. Attendez quelques secondes.");
setInterval(() => {
    const now = Date.now();
    for (const [key, userStore] of store.entries()) {
        if (userStore.resetTime <= now) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);
