"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectCityById = exports.redirectCategoryById = exports.redirectUserById = exports.redirectProductById = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const redirectProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma_client_js_1.default.product.findUnique({
            where: { id },
            select: { id: true, slug: true },
        });
        if (!product) {
            res.status(404).json({ error: "Produit non trouvé" });
            return;
        }
        if (product.slug) {
            res.redirect(301, `/api/products/${product.slug}`);
            return;
        }
        res.redirect(301, `/api/products/${product.id}`);
    }
    catch (error) {
        console.error("Erreur redirection produit:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.redirectProductById = redirectProductById;
const redirectUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma_client_js_1.default.user.findUnique({
            where: { id },
            select: { id: true, slug: true },
        });
        if (!user) {
            res.status(404).json({ error: "Utilisateur non trouvé" });
            return;
        }
        if (user.slug) {
            res.redirect(301, `/api/users/seller/${user.slug}`);
            return;
        }
        res.redirect(301, `/api/users/seller/${user.id}`);
    }
    catch (error) {
        console.error("Erreur redirection utilisateur:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.redirectUserById = redirectUserById;
const redirectCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await prisma_client_js_1.default.category.findUnique({
            where: { id },
            select: { id: true, slug: true },
        });
        if (!category) {
            res.status(404).json({ error: "Catégorie non trouvée" });
            return;
        }
        if (category.slug) {
            res.redirect(301, `/api/products?category=${category.slug}`);
            return;
        }
        res.redirect(301, `/api/products?category=${category.id}`);
    }
    catch (error) {
        console.error("Erreur redirection catégorie:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.redirectCategoryById = redirectCategoryById;
const redirectCityById = async (req, res) => {
    const { id } = req.params;
    try {
        const city = await prisma_client_js_1.default.city.findUnique({
            where: { id },
            select: { id: true, slug: true },
        });
        if (!city) {
            res.status(404).json({ error: "Ville non trouvée" });
            return;
        }
        if (city.slug) {
            res.redirect(301, `/api/products?city=${city.slug}`);
            return;
        }
        res.redirect(301, `/api/products?city=${city.id}`);
    }
    catch (error) {
        console.error("Erreur redirection ville:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.redirectCityById = redirectCityById;
