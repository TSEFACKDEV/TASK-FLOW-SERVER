"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductTransformer = void 0;
const utils_js_1 = __importDefault(require("../helper/utils.js"));
const forfaits_config_js_1 = require("../config/forfaits.config.js");
class ProductTransformer {
    static transformProduct(req, product) {
        return {
            ...product,
            images: Array.isArray(product.images)
                ? product.images.map((imagePath) => utils_js_1.default.resolveFileUrl(req, imagePath))
                : [],
            viewCount: product.viewCount || 0,
        };
    }
    static transformProductWithForfaits(req, product) {
        const baseTransformed = this.transformProduct(req, product);
        const now = new Date();
        return {
            ...baseTransformed,
            activeForfaits: product.productForfaits
                ?.filter((pf) => pf.isActive && new Date(pf.expiresAt) > now)
                .map((pf) => ({
                type: pf.forfait.type,
                priority: forfaits_config_js_1.FORFAIT_CONFIG[pf.forfait.type]?.priority || 999,
                expiresAt: pf.expiresAt,
            }))
                .sort((a, b) => a.priority - b.priority) || [],
        };
    }
    static transformProducts(req, products) {
        return products.map((product) => this.transformProduct(req, product));
    }
    static transformProductsWithForfaits(req, products) {
        return products.map((product) => this.transformProductWithForfaits(req, product));
    }
}
exports.ProductTransformer = ProductTransformer;
exports.default = ProductTransformer;
