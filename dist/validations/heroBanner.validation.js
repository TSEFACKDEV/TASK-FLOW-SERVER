"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.heroBannerQuerySchema = exports.updateHeroBannerSchema = exports.createHeroBannerSchema = void 0;
const yup = __importStar(require("yup"));
const urlOrDataUrl = yup
    .string()
    .test('url-or-data-url', 'URL du média invalide', (value) => {
    if (!value)
        return true;
    if (value.startsWith('data:'))
        return true;
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
});
exports.createHeroBannerSchema = yup.object().shape({
    title: yup
        .string()
        .max(200, 'Le titre ne peut pas dépasser 200 caractères')
        .nullable()
        .optional(),
    subtitle: yup
        .string()
        .max(500, 'Le sous-titre ne peut pas dépasser 500 caractères')
        .nullable()
        .optional(),
    mediaType: yup
        .string()
        .oneOf(['IMAGE', 'VIDEO'], 'Le type de média doit être IMAGE ou VIDEO')
        .required('Le type de média est requis'),
    mediaUrl: urlOrDataUrl
        .required('L\'URL du média est requise'),
    position: yup
        .string()
        .oneOf(['TOP', 'CENTER', 'BOTTOM'], 'La position doit être TOP, CENTER ou BOTTOM')
        .default('CENTER'),
    link: yup
        .string()
        .test('url-or-empty', 'URL de redirection invalide', (value) => {
        if (!value || value === '')
            return true;
        try {
            new URL(value);
            return true;
        }
        catch {
            return false;
        }
    })
        .nullable()
        .transform((value) => value === '' ? null : value)
        .optional(),
    order: yup
        .number()
        .integer('L\'ordre doit être un nombre entier')
        .min(0, 'L\'ordre doit être supérieur ou égal à 0')
        .default(0),
    isActive: yup
        .boolean()
        .default(true),
    duration: yup
        .number()
        .integer('La durée doit être un nombre entier')
        .min(1, 'La durée doit être d\'au moins 1 seconde')
        .max(60, 'La durée ne peut pas dépasser 60 secondes')
        .default(5),
});
exports.updateHeroBannerSchema = yup.object().shape({
    title: yup
        .string()
        .max(200, 'Le titre ne peut pas dépasser 200 caractères')
        .nullable()
        .optional(),
    subtitle: yup
        .string()
        .max(500, 'Le sous-titre ne peut pas dépasser 500 caractères')
        .nullable()
        .optional(),
    mediaType: yup
        .string()
        .oneOf(['IMAGE', 'VIDEO'], 'Le type de média doit être IMAGE ou VIDEO')
        .optional(),
    mediaUrl: urlOrDataUrl
        .optional(),
    position: yup
        .string()
        .oneOf(['TOP', 'CENTER', 'BOTTOM'], 'La position doit être TOP, CENTER ou BOTTOM')
        .optional(),
    link: yup
        .string()
        .test('url-or-empty', 'URL de redirection invalide', (value) => {
        if (!value || value === '')
            return true;
        try {
            new URL(value);
            return true;
        }
        catch {
            return false;
        }
    })
        .nullable()
        .transform((value) => value === '' ? null : value)
        .optional(),
    order: yup
        .number()
        .integer('L\'ordre doit être un nombre entier')
        .min(0, 'L\'ordre doit être supérieur ou égal à 0')
        .optional(),
    isActive: yup
        .boolean()
        .optional(),
    duration: yup
        .number()
        .integer('La durée doit être un nombre entier')
        .min(1, 'La durée doit être d\'au moins 1 seconde')
        .max(60, 'La durée ne peut pas dépasser 60 secondes')
        .optional(),
});
exports.heroBannerQuerySchema = yup.object().shape({
    isActive: yup
        .string()
        .optional(),
    limit: yup
        .string()
        .optional(),
    offset: yup
        .string()
        .optional(),
});
