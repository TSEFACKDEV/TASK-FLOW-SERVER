"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadHeroMedia = exports.uploadAvatar = exports.uploadProductImages = void 0;
const cloudinary_service_1 = __importDefault(require("../services/cloudinary.service"));
const uploadProductImages = async (req) => {
    try {
        const files = req.files;
        if (!files || !files.images) {
            throw new Error('Aucune image fournie');
        }
        const imageUrls = await cloudinary_service_1.default.uploadMultipleFiles(files, 'products');
        if (imageUrls.length === 0) {
            throw new Error("Échec de l'upload des images");
        }
        return imageUrls;
    }
    catch (error) {
        console.error("Erreur lors de l'upload vers Cloudinary:", error);
        throw new Error("Erreur lors de l'upload des images");
    }
};
exports.uploadProductImages = uploadProductImages;
const uploadAvatar = async (req) => {
    try {
        const files = req.files;
        if (!files || !files.avatar) {
            throw new Error('Aucun avatar fourni');
        }
        const avatar = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
        const result = await cloudinary_service_1.default.uploadFile(avatar, 'avatars');
        return result.secureUrl;
    }
    catch (error) {
        console.error("Erreur lors de l'upload de l'avatar:", error);
        throw new Error("Erreur lors de l'upload de l'avatar");
    }
};
exports.uploadAvatar = uploadAvatar;
const uploadHeroMedia = async (req) => {
    try {
        const files = req.files;
        if (!files || !files.media) {
            throw new Error('Aucun média fourni');
        }
        const media = Array.isArray(files.media) ? files.media[0] : files.media;
        const result = await cloudinary_service_1.default.uploadFile(media, 'hero-banners');
        return result.secureUrl;
    }
    catch (error) {
        console.error("Erreur lors de l'upload du média hero:", error);
        throw new Error("Erreur lors de l'upload du média");
    }
};
exports.uploadHeroMedia = uploadHeroMedia;
