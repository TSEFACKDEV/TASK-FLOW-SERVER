"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeSearchParam = sanitizeSearchParam;
exports.sanitizeXSS = sanitizeXSS;
exports.sanitizeNumericParam = sanitizeNumericParam;
exports.sanitizeFloatParam = sanitizeFloatParam;
exports.sanitizeProductName = sanitizeProductName;
exports.sanitizeDescription = sanitizeDescription;
exports.sanitizeUUID = sanitizeUUID;
function decodeHTMLEntities(text) {
    return text
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(parseInt(dec)))
        .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
}
function cleanXSS(text) {
    let cleaned = text;
    cleaned = decodeHTMLEntities(cleaned);
    cleaned = cleaned.replace(/<[^>]*>/g, "");
    cleaned = cleaned.replace(/on\w+\s*=\s*['""].*?['"']/gi, "");
    cleaned = cleaned.replace(/(javascript|data|vbscript):/gi, "");
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    return cleaned;
}
function sanitizeSearchParam(searchParam) {
    if (!searchParam || typeof searchParam !== "string") {
        return "";
    }
    let sanitized = String(searchParam).trim();
    sanitized = sanitized.replace(/[^\w\s\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF'-]/g, "");
    const MAX_SEARCH_LENGTH = 100;
    if (sanitized.length > MAX_SEARCH_LENGTH) {
        sanitized = sanitized.substring(0, MAX_SEARCH_LENGTH);
    }
    sanitized = sanitized.replace(/\s+/g, " ").trim();
    return sanitized;
}
function sanitizeXSS(input) {
    if (!input || typeof input !== "string") {
        return "";
    }
    let sanitized = String(input).trim();
    sanitized = cleanXSS(sanitized);
    const MAX_TEXT_LENGTH = 1000;
    if (sanitized.length > MAX_TEXT_LENGTH) {
        sanitized = sanitized.substring(0, MAX_TEXT_LENGTH);
    }
    return sanitized;
}
function sanitizeNumericParam(param, defaultValue, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
    if (!param)
        return defaultValue;
    const parsed = typeof param === "string" ? parseInt(param, 10) : Number(param);
    if (isNaN(parsed) || !isFinite(parsed)) {
        return defaultValue;
    }
    if (parsed < min)
        return min;
    if (parsed > max)
        return max;
    return parsed;
}
function sanitizeFloatParam(param, defaultValue, min = 0, max = Number.MAX_SAFE_INTEGER) {
    if (!param)
        return defaultValue;
    const parsed = typeof param === "string" ? parseFloat(param) : Number(param);
    if (isNaN(parsed) || !isFinite(parsed)) {
        return defaultValue;
    }
    if (parsed < min)
        return min;
    if (parsed > max)
        return max;
    return parsed;
}
function sanitizeProductName(name) {
    if (!name || typeof name !== "string") {
        return "";
    }
    let sanitized = String(name).trim();
    sanitized = cleanXSS(sanitized);
    sanitized = sanitized.replace(/[^\w\s\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF()\-.,'/]/g, "");
    const MAX_NAME_LENGTH = 100;
    if (sanitized.length > MAX_NAME_LENGTH) {
        sanitized = sanitized.substring(0, MAX_NAME_LENGTH);
    }
    return sanitized;
}
function sanitizeDescription(description) {
    if (!description || typeof description !== "string") {
        return "";
    }
    let sanitized = String(description).trim();
    sanitized = cleanXSS(sanitized);
    const MAX_DESC_LENGTH = 2000;
    if (sanitized.length > MAX_DESC_LENGTH) {
        sanitized = sanitized.substring(0, MAX_DESC_LENGTH);
    }
    return sanitized;
}
function sanitizeUUID(id) {
    if (!id || typeof id !== "string") {
        return null;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id) ? id : null;
}
