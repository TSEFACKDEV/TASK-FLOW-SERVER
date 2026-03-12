import { Request, Response, NextFunction } from 'express'
import { validationResult, body, param } from 'express-validator'

export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)))

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    res.status(400).json({
      message: 'Erreur de validation',
      errors: errors.array()
    })
  }
}

// Auth validations
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('prenom').optional()
]

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
]

// Project validations
export const projectValidation = [
  body('titre').notEmpty().withMessage('Le titre est requis').isLength({ max: 100 }),
  body('description').optional().isLength({ max: 1000 })
]

// Task validations
export const taskValidation = [
  body('titre').notEmpty().withMessage('Le titre est requis'),
  body('projetId').notEmpty().withMessage('L\'ID du projet est requis'),
  body('assigneA').optional(),
  body('statut').optional().isIn(['A_FAIRE', 'EN_COURS', 'TERMINE']),
  body('echeance').optional().isISO8601().toDate()
]

export const taskStatusValidation = [
  body('statut').isIn(['A_FAIRE', 'EN_COURS', 'TERMINE']).withMessage('Statut invalide')
]

export const taskUpdateValidation = [
  body('titre').optional().isLength({ max: 100 }),
  body('description').optional().isLength({ max: 1000 }),
  body('assigneA').optional().isUUID(),
  body('echeance').optional().isISO8601().toDate()
]

// Task assignment validation
// Task assignment validation - CORRIGÉ pour accepter null
export const taskAssignmentValidation = [
  body('assigneA')
    .optional({ nullable: true }) // Accepte null
    .custom((value) => {
      // Si c'est null ou undefined, c'est valide
      if (value === null || value === undefined) return true
      // Si c'est une string, doit être un UUID
      if (typeof value === 'string') {
        // Regex pour UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(value)
      }
      return false
    })
    .withMessage('ID utilisateur invalide')
]

// ID validation
export const idValidation = [
  param('id').isUUID().withMessage('ID invalide')
]

// Create user validation
export const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('nom').notEmpty().withMessage('Le nom est requis'),
  body('prenom').optional(),
  body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Rôle invalide')
]

// Update user role validation
export const updateUserRoleValidation = [
  param('id').isUUID().withMessage('ID invalide'),
  body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Rôle invalide')
]