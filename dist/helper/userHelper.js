"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserSlug = exports.isBusinessName = exports.normalizeNameForSearch = exports.getDisplayName = void 0;
const getDisplayName = (firstName, lastName) => {
    if (!lastName)
        return "Utilisateur";
    if (firstName && firstName.trim()) {
        return `${firstName.trim()} ${lastName.trim()}`;
    }
    return lastName.trim();
};
exports.getDisplayName = getDisplayName;
const normalizeNameForSearch = (name) => {
    return name.toLowerCase().trim();
};
exports.normalizeNameForSearch = normalizeNameForSearch;
const isBusinessName = (firstName) => {
    return !firstName || !firstName.trim();
};
exports.isBusinessName = isBusinessName;
const generateUserSlug = (firstName, lastName, id) => {
    const parts = [firstName, lastName].filter(Boolean);
    const slug = parts
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return `${slug}-${id.slice(0, 8)}`;
};
exports.generateUserSlug = generateUserSlug;
