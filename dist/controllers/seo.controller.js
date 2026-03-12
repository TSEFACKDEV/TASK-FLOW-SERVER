"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRobotsTxt = exports.generateSitemap = void 0;
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const generateSitemap = async (_req, res) => {
    try {
        const baseUrl = process.env.CLIENT_URL || "https://buyandsale.cm";
        const products = await prisma_client_js_1.default.product.findMany({
            where: {
                status: "VALIDATED",
                slug: { not: null },
            },
            select: {
                slug: true,
                updatedAt: true,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        const categories = await prisma_client_js_1.default.category.findMany({
            select: {
                slug: true,
                name: true,
                updatedAt: true,
            },
        });
        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/</loc>\n`;
        sitemap += `    <changefreq>daily</changefreq>\n`;
        sitemap += `    <priority>1.0</priority>\n`;
        sitemap += `  </url>\n`;
        const staticPages = [
            { path: "/products", priority: "0.9", changefreq: "hourly" },
            { path: "/vendeurs", priority: "0.8", changefreq: "daily" },
            { path: "/about", priority: "0.5", changefreq: "monthly" },
            { path: "/contact", priority: "0.5", changefreq: "monthly" },
            { path: "/help", priority: "0.5", changefreq: "monthly" },
            { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
            { path: "/terms", priority: "0.3", changefreq: "yearly" },
        ];
        staticPages.forEach((page) => {
            sitemap += `  <url>\n`;
            sitemap += `    <loc>${baseUrl}${page.path}</loc>\n`;
            sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
            sitemap += `    <priority>${page.priority}</priority>\n`;
            sitemap += `  </url>\n`;
        });
        products.forEach((product) => {
            if (product.slug) {
                sitemap += `  <url>\n`;
                sitemap += `    <loc>${baseUrl}/produit/${product.slug}</loc>\n`;
                sitemap += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
                sitemap += `    <changefreq>weekly</changefreq>\n`;
                sitemap += `    <priority>0.8</priority>\n`;
                sitemap += `  </url>\n`;
            }
        });
        categories.forEach((category) => {
            if (category.slug) {
                sitemap += `  <url>\n`;
                sitemap += `    <loc>${baseUrl}/categorie/${category.slug}</loc>\n`;
                sitemap += `    <lastmod>${category.updatedAt.toISOString()}</lastmod>\n`;
                sitemap += `    <changefreq>daily</changefreq>\n`;
                sitemap += `    <priority>0.7</priority>\n`;
                sitemap += `  </url>\n`;
            }
        });
        sitemap += "</urlset>";
        res.header("Content-Type", "application/xml");
        res.send(sitemap);
    }
    catch (error) {
        console.error("Erreur lors de la génération du sitemap:", error);
        res.status(500).send("Erreur lors de la génération du sitemap");
    }
};
exports.generateSitemap = generateSitemap;
const generateRobotsTxt = async (_req, res) => {
    try {
        const baseUrl = process.env.CLIENT_URL || "https://buyandsale.cm";
        let robotsTxt = `# Robots.txt pour BuyAndSale Marketplace Cameroun\n\n`;
        robotsTxt += `User-agent: *\n`;
        robotsTxt += `Allow: /\n`;
        robotsTxt += `Allow: /produit/\n`;
        robotsTxt += `Allow: /products\n`;
        robotsTxt += `Allow: /categorie/\n`;
        robotsTxt += `Allow: /vendeurs\n`;
        robotsTxt += `Allow: /vendeur/\n`;
        robotsTxt += `\n`;
        robotsTxt += `# Pages privées\n`;
        robotsTxt += `Disallow: /admin/\n`;
        robotsTxt += `Disallow: /profile\n`;
        robotsTxt += `Disallow: /auth/\n`;
        robotsTxt += `Disallow: /post\n`;
        robotsTxt += `Disallow: /favorites\n`;
        robotsTxt += `Disallow: /notifications\n`;
        robotsTxt += `\n`;
        robotsTxt += `# Anciennes URLs (redirigées)\n`;
        robotsTxt += `Disallow: /annonce/\n`;
        robotsTxt += `Disallow: /product/\n`;
        robotsTxt += `\n`;
        robotsTxt += `# Sitemap\n`;
        robotsTxt += `Sitemap: ${baseUrl}/api/sitemap.xml\n`;
        robotsTxt += `\n`;
        robotsTxt += `# Crawl delay\n`;
        robotsTxt += `Crawl-delay: 1\n`;
        res.header("Content-Type", "text/plain");
        res.send(robotsTxt);
    }
    catch (error) {
        console.error("Erreur lors de la génération du robots.txt:", error);
        res.status(500).send("Erreur lors de la génération du robots.txt");
    }
};
exports.generateRobotsTxt = generateRobotsTxt;
