"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
class SecurityUtils {
    static generateSecureSecret(length = 64) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    static generateJWTSecret() {
        return this.generateSecureSecret(32);
    }
    static generateSessionSecret() {
        return this.generateSecureSecret(32);
    }
    static validateSecretStrength(secret) {
        const issues = [];
        if (!secret) {
            issues.push('Secret vide');
            return { isSecure: false, issues };
        }
        if (secret.length < 32) {
            issues.push('Secret trop court (minimum 32 caractères)');
        }
        if (secret === 'KleinDev' ||
            secret.toLowerCase().includes('default') ||
            secret.toLowerCase().includes('secret')) {
            issues.push('Secret par défaut ou prévisible détecté');
        }
        if (!/[A-Z]/.test(secret) &&
            !/[a-z]/.test(secret) &&
            !/[0-9]/.test(secret)) {
            issues.push('Secret manque de complexité');
        }
        return {
            isSecure: issues.length === 0,
            issues,
        };
    }
    static auditEnvironmentSecurity() {
        const issues = [];
        const recommendations = [];
        const jwtSecret = process.env.JWT_SECRET;
        const jwtValidation = this.validateSecretStrength(jwtSecret || '');
        if (!jwtValidation.isSecure) {
            issues.push({
                variable: 'JWT_SECRET',
                severity: 'HIGH',
                message: `JWT_SECRET faible: ${jwtValidation.issues.join(', ')}`,
            });
            recommendations.push(`Générer un nouveau JWT_SECRET: ${this.generateJWTSecret()}`);
        }
        const refreshSecret = process.env.REFRESH_TOKEN_SECRET_KEY;
        if (!refreshSecret || refreshSecret.length === 0) {
            issues.push({
                variable: 'REFRESH_TOKEN_SECRET_KEY',
                severity: 'HIGH',
                message: 'REFRESH_TOKEN_SECRET_KEY manquant',
            });
            recommendations.push(`Définir REFRESH_TOKEN_SECRET_KEY: ${this.generateSecureSecret()}`);
        }
        const sessionSecret = process.env.SESSION_SECRET;
        const sessionValidation = this.validateSecretStrength(sessionSecret || '');
        if (!sessionValidation.isSecure) {
            issues.push({
                variable: 'SESSION_SECRET',
                severity: 'MEDIUM',
                message: `SESSION_SECRET faible: ${sessionValidation.issues.join(', ')}`,
            });
            recommendations.push(`Améliorer SESSION_SECRET: ${this.generateSessionSecret()}`);
        }
        const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!googleSecret || googleSecret.length === 0) {
            issues.push({
                variable: 'GOOGLE_CLIENT_SECRET',
                severity: 'MEDIUM',
                message: 'GOOGLE_CLIENT_SECRET manquant pour OAuth',
            });
        }
        const smtpPass = process.env.SMTP_PASS;
        if (!smtpPass || smtpPass.length === 0) {
            issues.push({
                variable: 'SMTP_PASS',
                severity: 'MEDIUM',
                message: 'SMTP_PASS manquant pour envoi emails',
            });
        }
        const highIssues = issues.filter((i) => i.severity === 'HIGH').length;
        const mediumIssues = issues.filter((i) => i.severity === 'MEDIUM').length;
        const lowIssues = issues.filter((i) => i.severity === 'LOW').length;
        let securityScore = 100;
        securityScore -= highIssues * 30;
        securityScore -= mediumIssues * 15;
        securityScore -= lowIssues * 5;
        securityScore = Math.max(0, securityScore);
        return {
            securityScore,
            issues,
            recommendations,
        };
    }
    static runSecurityAudit() {
        const audit = this.auditEnvironmentSecurity();
        if (audit.securityScore < 70 && process.env.NODE_ENV === 'development') {
            audit.issues.forEach((issue) => {
                if (issue.severity === 'HIGH') {
                }
            });
        }
    }
}
exports.SecurityUtils = SecurityUtils;
