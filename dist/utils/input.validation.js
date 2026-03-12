"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordStrength = validatePasswordStrength;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.validateAndNormalizeRegistration = validateAndNormalizeRegistration;
exports.validateLoginData = validateLoginData;
exports.sanitizeString = sanitizeString;
function validatePasswordStrength(password) {
    const feedback = [];
    let score = 0;
    if (!password) {
        return {
            score: 0,
            feedback: ['Mot de passe requis'],
            isSecure: false,
        };
    }
    if (password.length < 6) {
        feedback.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    else {
        score += 1;
    }
    if (!/[A-Z]/.test(password)) {
        feedback.push('Le mot de passe doit contenir au moins une lettre majuscule');
    }
    else {
        score += 1;
    }
    if (!/[a-z]/.test(password)) {
        feedback.push('Le mot de passe doit contenir au moins une lettre minuscule');
    }
    else {
        score += 1;
    }
    if (!/\d/.test(password)) {
        feedback.push('Le mot de passe doit contenir au moins un chiffre');
    }
    else {
        score += 1;
    }
    if (password.length >= 12) {
        score += 1;
    }
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 1;
    }
    return {
        score,
        feedback,
        isSecure: score >= 3,
    };
}
function validateEmail(email) {
    if (!email) {
        return {
            isValid: false,
            message: 'Email requis',
        };
    }
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
        return {
            isValid: false,
            message: "Format d'email invalide",
        };
    }
    if (normalizedEmail.length > 254) {
        return {
            isValid: false,
            message: 'Email trop long',
        };
    }
    return { isValid: true };
}
function validatePhone(phone) {
    if (!phone) {
        return {
            isValid: false,
            message: 'Numéro de téléphone requis',
        };
    }
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
    if (!phoneRegex.test(cleanPhone)) {
        return {
            isValid: false,
            message: 'Format de numéro de téléphone invalide',
        };
    }
    return { isValid: true };
}
function validateAndNormalizeRegistration(data) {
    if (!data) {
        return {
            isValid: false,
            message: 'Données manquantes',
        };
    }
    const { email, firstName, lastName, phone, password } = data;
    if (!email || !lastName || !phone || !password) {
        return {
            isValid: false,
            message: 'Tous les champs sont obligatoires',
        };
    }
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        return {
            isValid: false,
            message: emailValidation.message,
        };
    }
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
        return {
            isValid: false,
            message: phoneValidation.message,
        };
    }
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isSecure) {
        return {
            isValid: false,
            message: passwordValidation.feedback.join(', '),
        };
    }
    const normalizedData = {
        email: email.toLowerCase().trim(),
        firstName: firstName ? firstName.trim() : null,
        lastName: lastName.trim(),
        phone: phone.replace(/[\s\-\(\)]/g, ''),
        password: password,
    };
    return {
        isValid: true,
        normalizedData,
    };
}
function validateLoginData(data) {
    if (!data) {
        return {
            isValid: false,
            message: 'Données manquantes',
        };
    }
    const identifier = data.email || data.identifiant;
    const { password } = data;
    if (!identifier || !password) {
        return {
            isValid: false,
            message: 'Identifiant et mot de passe requis',
        };
    }
    if (identifier.includes('@')) {
        const emailValidation = validateEmail(identifier);
        if (!emailValidation.isValid) {
            return {
                isValid: false,
                message: "Format d'email invalide",
            };
        }
    }
    return { isValid: true };
}
function sanitizeString(str) {
    if (!str || typeof str !== 'string')
        return '';
    return str
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, 1000);
}
