"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHeroMedia = exports.uploadHeroMedia = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const MEDIA_CONFIG = {
    MAX_SIZE: 50 * 1024 * 1024,
    IMAGE_MAX_SIZE: 10 * 1024 * 1024,
    VALID_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    VALID_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
};
const ensureDirectoryExists = async (dirPath) => {
    if (!fs_1.default.existsSync(dirPath)) {
        await fs_1.default.promises.mkdir(dirPath, { recursive: true });
    }
};
const uploadHeroMedia = async (req, res) => {
    try {
        if (!req.files || !req.files.media) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni',
            });
        }
        const mediaFile = req.files.media;
        const mediaType = req.body.mediaType || 'IMAGE';
        const validImageTypes = MEDIA_CONFIG.VALID_IMAGE_TYPES;
        const validVideoTypes = MEDIA_CONFIG.VALID_VIDEO_TYPES;
        const validTypes = mediaType === 'VIDEO'
            ? validVideoTypes
            : validImageTypes;
        if (!validTypes.includes(mediaFile.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `Type de fichier non supporté. Types acceptés: ${validTypes.join(', ')}`,
            });
        }
        const maxSize = mediaType === 'VIDEO'
            ? MEDIA_CONFIG.MAX_SIZE
            : MEDIA_CONFIG.IMAGE_MAX_SIZE;
        if (mediaFile.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: `Fichier trop volumineux. Taille max: ${maxSize / (1024 * 1024)}MB`,
            });
        }
        const uploadDir = path_1.default.join(__dirname, '../../public/uploads/hero');
        await ensureDirectoryExists(uploadDir);
        const fileExtension = path_1.default.extname(mediaFile.name);
        const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
        const filePath = path_1.default.join(uploadDir, fileName);
        await mediaFile.mv(filePath);
        const mediaUrl = `/public/uploads/hero/${fileName}`;
        return res.status(200).json({
            success: true,
            message: 'Média uploadé avec succès',
            data: {
                mediaUrl,
                mediaType,
                fileName,
                size: mediaFile.size,
                mimeType: mediaFile.mimetype,
            },
        });
    }
    catch (error) {
        console.error('Error uploading hero media:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload du média',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
    }
};
exports.uploadHeroMedia = uploadHeroMedia;
const deleteHeroMedia = async (req, res) => {
    try {
        const { fileName } = req.params;
        if (!fileName) {
            return res.status(400).json({
                success: false,
                message: 'Nom de fichier requis',
            });
        }
        const filePath = path_1.default.join(__dirname, '../../public/uploads/hero', fileName);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé',
            });
        }
        await fs_1.default.promises.unlink(filePath);
        return res.status(200).json({
            success: true,
            message: 'Média supprimé avec succès',
        });
    }
    catch (error) {
        console.error('Error deleting hero media:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du média',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
    }
};
exports.deleteHeroMedia = deleteHeroMedia;
