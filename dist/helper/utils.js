"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const cloudinary_service_1 = __importDefault(require("../services/cloudinary.service"));
class Utils {
    static async saveFile(file, saveRelatifPath) {
        const result = await cloudinary_service_1.default.uploadFile(file, saveRelatifPath);
        return result.secureUrl;
    }
    static async deleteFile(relativeFilePath) {
        try {
            if (relativeFilePath.includes('cloudinary.com')) {
                const publicId = cloudinary_service_1.default.extractPublicIdFromUrl(relativeFilePath);
                if (publicId) {
                    return await cloudinary_service_1.default.deleteFile(publicId);
                }
                return false;
            }
            const absolutePath = node_path_1.default.join(__dirname, `/../../public`, relativeFilePath);
            await promises_1.default.access(absolutePath);
            await promises_1.default.unlink(absolutePath);
            return true;
        }
        catch (err) {
            console.error('Erreur lors de la suppression du fichier :', err.message);
            return false;
        }
    }
    static async deleteMultipleFiles(filePaths) {
        const publicIds = filePaths
            .map(path => {
            if (path.includes('cloudinary.com')) {
                return cloudinary_service_1.default.extractPublicIdFromUrl(path);
            }
            return null;
        })
            .filter((id) => id !== null);
        if (publicIds.length > 0) {
            return await cloudinary_service_1.default.deleteMultipleFiles(publicIds);
        }
        return [];
    }
    static resolveFileUrl(req, relativePath) {
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }
        if (relativePath.startsWith('data:')) {
            return relativePath;
        }
        const cleanPath = relativePath.startsWith('/')
            ? relativePath
            : `/${relativePath}`;
        return `${req.protocol}://${req.get('host')}/public${cleanPath}`;
    }
}
exports.default = Utils;
