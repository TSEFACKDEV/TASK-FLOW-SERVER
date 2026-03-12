"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
class CloudinaryService {
    static async uploadFile(file, folder = 'products') {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: `buyandsale/${folder}`,
                resource_type: 'auto',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' },
                ],
                ...(folder === 'products' && {
                    eager: [
                        { width: 800, height: 800, crop: 'limit' },
                        { width: 400, height: 400, crop: 'thumb' },
                    ],
                }),
            }, (error, result) => {
                if (error)
                    return reject(error);
                if (!result)
                    return reject(new Error('Upload failed'));
                resolve({
                    url: result.url,
                    secureUrl: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    width: result.width,
                    height: result.height,
                });
            });
            streamifier_1.default.createReadStream(file.data).pipe(uploadStream);
        });
    }
    static async uploadMultipleFiles(files, folder = 'products') {
        let fileArray = [];
        if (Array.isArray(files)) {
            fileArray = files;
        }
        else if (files && typeof files === 'object' && 'images' in files) {
            const images = files.images;
            fileArray = Array.isArray(images) ? images : [images];
        }
        else if (files && !Array.isArray(files)) {
            fileArray = [files];
        }
        const filesToUpload = fileArray.slice(0, 5);
        const uploadPromises = filesToUpload.map(file => this.uploadFile(file, folder).then(result => result.secureUrl));
        return Promise.all(uploadPromises);
    }
    static async deleteFile(publicId) {
        try {
            const result = await cloudinary_1.v2.uploader.destroy(publicId);
            return result.result === 'ok';
        }
        catch (error) {
            console.error('Erreur lors de la suppression sur Cloudinary:', error);
            return false;
        }
    }
    static async deleteMultipleFiles(publicIds) {
        const deletePromises = publicIds.map(id => this.deleteFile(id));
        return Promise.all(deletePromises);
    }
    static extractPublicIdFromUrl(url) {
        try {
            const matches = url.match(/\/v\d+\/(.+?)(?:\.\w+)?$/);
            return matches ? matches[1] : null;
        }
        catch {
            return null;
        }
    }
    static getOptimizedUrl(publicId, options = {}) {
        return cloudinary_1.v2.url(publicId, {
            secure: true,
            quality: 'auto',
            fetch_format: 'auto',
            ...options,
        });
    }
}
exports.default = CloudinaryService;
