"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserSlug = exports.generateCitySlug = exports.generateCategorySlug = exports.extractIdFromSlug = exports.generateProductSlug = exports.generateSlug = void 0;
const generateSlug = (text) => {
    if (!text)
        return "";
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
};
exports.generateSlug = generateSlug;
const generateProductSlug = (productName, categoryName, cityName, productId) => {
    const nameSlug = (0, exports.generateSlug)(productName);
    const categorySlug = (0, exports.generateSlug)(categoryName);
    const citySlug = (0, exports.generateSlug)(cityName);
    const shortId = productId.substring(0, 6);
    return `${nameSlug}-${categorySlug}-${citySlug}-${shortId}`;
};
exports.generateProductSlug = generateProductSlug;
const extractIdFromSlug = (slug) => {
    if (!slug)
        return null;
    const parts = slug.split("-");
    if (parts.length < 2)
        return null;
    const lastPart = parts[parts.length - 1];
    if (/^[a-z0-9]{6}$/i.test(lastPart)) {
        return lastPart;
    }
    return null;
};
exports.extractIdFromSlug = extractIdFromSlug;
const generateCategorySlug = (categoryName) => {
    return (0, exports.generateSlug)(categoryName);
};
exports.generateCategorySlug = generateCategorySlug;
const generateCitySlug = (cityName) => {
    return (0, exports.generateSlug)(cityName);
};
exports.generateCitySlug = generateCitySlug;
const generateUserSlug = (firstName, lastName, userId) => {
    const lastNameSlug = (0, exports.generateSlug)(lastName);
    const shortId = userId.substring(0, 6);
    if (firstName) {
        const firstNameSlug = (0, exports.generateSlug)(firstName);
        return `${firstNameSlug}-${lastNameSlug}-${shortId}`;
    }
    return `${lastNameSlug}-${shortId}`;
};
exports.generateUserSlug = generateUserSlug;
