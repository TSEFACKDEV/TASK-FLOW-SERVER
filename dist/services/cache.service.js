"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
class CacheService {
    constructor() {
        this.TTL = {
            CATEGORIES: 300,
            CITIES: 600,
            USER_STATS: 120,
            HOMEPAGE_PRODUCTS: 180,
        };
        this.KEYS = {
            CATEGORIES: "categories",
            CITIES: "cities",
            USER_STATS: "user_stats",
            HOMEPAGE_PRODUCTS: "homepage_products",
        };
        this.cache = new node_cache_1.default({
            stdTTL: this.TTL.HOMEPAGE_PRODUCTS,
            checkperiod: 60,
            useClones: false,
            deleteOnExpire: true,
        });
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl || this.TTL.HOMEPAGE_PRODUCTS);
    }
    del(key) {
        return this.cache.del(key);
    }
    flush() {
        this.cache.flushAll();
    }
    getCategories() {
        return this.get(this.KEYS.CATEGORIES);
    }
    setCategories(categories) {
        return this.set(this.KEYS.CATEGORIES, categories, this.TTL.CATEGORIES);
    }
    invalidateCategories() {
        this.del(this.KEYS.CATEGORIES);
    }
    getCities() {
        return this.get(this.KEYS.CITIES);
    }
    setCities(cities) {
        return this.set(this.KEYS.CITIES, cities, this.TTL.CITIES);
    }
    invalidateCities() {
        this.del(this.KEYS.CITIES);
    }
    getUserStats() {
        return this.get(this.KEYS.USER_STATS);
    }
    setUserStats(stats) {
        return this.set(this.KEYS.USER_STATS, stats, this.TTL.USER_STATS);
    }
    invalidateUserStats() {
        this.del(this.KEYS.USER_STATS);
    }
    getHomepageProducts(limit) {
        return this.get(`${this.KEYS.HOMEPAGE_PRODUCTS}_${limit}`);
    }
    setHomepageProducts(limit, products) {
        return this.set(`${this.KEYS.HOMEPAGE_PRODUCTS}_${limit}`, products, this.TTL.HOMEPAGE_PRODUCTS);
    }
    invalidateHomepageProducts() {
        console.log("🔄 Cache homepage products invalidated");
    }
    invalidateAllProducts() {
        this.invalidateByPrefix("product");
        this.invalidateByPrefix("homepage_products");
        console.log("🗑️ Tous les caches de produits ont été invalidés");
    }
    getStats() {
        const stats = this.cache.getStats();
        const hitRate = stats.hits + stats.misses > 0
            ? (stats.hits / (stats.hits + stats.misses)) * 100
            : 0;
        return {
            keys: this.cache.keys().length,
            hits: stats.hits,
            misses: stats.misses,
            ksize: stats.ksize,
            vsize: stats.vsize,
            hitRate: hitRate.toFixed(2),
            hitRateNumeric: hitRate,
        };
    }
    cleanupExpired() {
        const beforeKeys = this.cache.keys().length;
        const afterKeys = this.cache.keys().length;
        return beforeKeys - afterKeys;
    }
    invalidateByPrefix(prefix) {
        const keys = this.cache.keys();
        const toDelete = keys.filter((key) => key.startsWith(prefix));
        toDelete.forEach((key) => this.del(key));
    }
}
exports.cacheService = new CacheService();
exports.default = CacheService;
