"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleValidation = exports.createUserValidation = exports.idValidation = exports.taskAssignmentValidation = exports.taskUpdateValidation = exports.taskStatusValidation = exports.taskValidation = exports.projectValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        res.status(400).json({
            message: 'Erreur de validation',
            errors: errors.array()
        });
    };
};
exports.validate = validate;
exports.registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    (0, express_validator_1.body)('nom').notEmpty().withMessage('Le nom est requis'),
    (0, express_validator_1.body)('prenom').optional()
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Mot de passe requis')
];
exports.projectValidation = [
    (0, express_validator_1.body)('titre').notEmpty().withMessage('Le titre est requis').isLength({ max: 100 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 1000 })
];
exports.taskValidation = [
    (0, express_validator_1.body)('titre').notEmpty().withMessage('Le titre est requis'),
    (0, express_validator_1.body)('projetId').notEmpty().withMessage('L\'ID du projet est requis'),
    (0, express_validator_1.body)('assigneA').optional(),
    (0, express_validator_1.body)('statut').optional().isIn(['A_FAIRE', 'EN_COURS', 'TERMINE']),
    (0, express_validator_1.body)('echeance').optional().isISO8601().toDate()
];
exports.taskStatusValidation = [
    (0, express_validator_1.body)('statut').isIn(['A_FAIRE', 'EN_COURS', 'TERMINE']).withMessage('Statut invalide')
];
exports.taskUpdateValidation = [
    (0, express_validator_1.body)('titre').optional().isLength({ max: 100 }),
    (0, express_validator_1.body)('description').optional().isLength({ max: 1000 }),
    (0, express_validator_1.body)('assigneA').optional().isUUID(),
    (0, express_validator_1.body)('echeance').optional().isISO8601().toDate()
];
exports.taskAssignmentValidation = [
    (0, express_validator_1.body)('assigneA')
        .optional({ nullable: true })
        .custom((value) => {
        if (value === null || value === undefined)
            return true;
        if (typeof value === 'string') {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(value);
        }
        return false;
    })
        .withMessage('ID utilisateur invalide')
];
exports.idValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID invalide')
];
exports.createUserValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    (0, express_validator_1.body)('nom').notEmpty().withMessage('Le nom est requis'),
    (0, express_validator_1.body)('prenom').optional(),
    (0, express_validator_1.body)('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Rôle invalide')
];
exports.updateUserRoleValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('ID invalide'),
    (0, express_validator_1.body)('role').isIn(['ADMIN', 'MEMBER']).withMessage('Rôle invalide')
];
