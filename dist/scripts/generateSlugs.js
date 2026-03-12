"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_1 = __importDefault(require("../model/prisma.client"));
const slugHelpers_1 = require("../utils/slugHelpers");
async function generateSlugs() {
    try {
        const categories = await prisma_client_1.default.category.findMany();
        for (const category of categories) {
            const slug = (0, slugHelpers_1.generateCategorySlug)(category.name);
            await prisma_client_1.default.category.update({
                where: { id: category.id },
                data: { slug },
            });
        }
        const cities = await prisma_client_1.default.city.findMany();
        for (const city of cities) {
            const slug = (0, slugHelpers_1.generateCitySlug)(city.name);
            await prisma_client_1.default.city.update({
                where: { id: city.id },
                data: { slug },
            });
        }
        const products = await prisma_client_1.default.product.findMany({
            include: {
                category: true,
                city: true,
            },
        });
        for (const product of products) {
            if (!product.name) {
                continue;
            }
            const slug = (0, slugHelpers_1.generateProductSlug)(product.name, product.category.name, product.city.name, product.id);
            await prisma_client_1.default.product.update({
                where: { id: product.id },
                data: { slug },
            });
        }
        const users = await prisma_client_1.default.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });
        for (const user of users) {
            if (!user.lastName) {
                continue;
            }
            const slug = (0, slugHelpers_1.generateUserSlug)(user.firstName, user.lastName, user.id);
            await prisma_client_1.default.user.update({
                where: { id: user.id },
                data: { slug },
            });
        }
    }
    catch (error) {
        throw error;
    }
    finally {
        await prisma_client_1.default.$disconnect();
    }
}
generateSlugs()
    .then(() => {
    process.exit(0);
})
    .catch(() => {
    process.exit(1);
});
