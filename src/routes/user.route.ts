import { Router } from 'express'
import type { Request, Response } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import { validate, idValidation, createUserValidation, updateUserRoleValidation } from '../middlewares/validation.middleware.js'
import prisma from '../model/prisma.client.js'
import bcrypt from 'bcrypt'

const router = Router()

router.use(authenticate)

// Recherche d'utilisateurs
router.get('/search', async (req: Request, res: Response): Promise<any> => {
  try {
    const { q } = req.query
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ success: true, data: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { nom: { contains: q, mode: 'insensitive' } },
          { prenom: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        dateInscription: true
      },
      take: 10,
      orderBy: {
        dateInscription: 'desc'
      }
    })

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({ message: 'Erreur lors de la recherche' })
  }
})

// Get all users (admin only)
router.get('/', authorize('ADMIN'), async (_req: Request, res: Response): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        dateInscription: true,
        _count: {
          select: {
            projetsCrees: true,
            tachesAssignees: true
          }
        }
      },
      orderBy: {
        dateInscription: 'desc'
      }
    })

    // Formater les données pour inclure les compteurs
    const formattedUsers = users.map(user => ({
      ...user,
      projets: user._count.projetsCrees,
      taches: user._count.tachesAssignees
    }))

    res.json({ 
      success: true, 
      data: formattedUsers 
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' })
  }
})

// Create user (admin only)
router.post('/', authorize('ADMIN'), validate(createUserValidation), async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, nom, prenom, role } = req.body

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: role || 'MEMBER'
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        dateInscription: true
      }
    })

    res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès'
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' })
  }
})

// Get user by ID
router.get('/:id', validate(idValidation), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        dateInscription: true,
        projetsCrees: {
          select: {
            id: true,
            titre: true
          }
        },
        tachesAssignees: {
          select: {
            id: true,
            titre: true,
            statut: true,
            projet: {
              select: {
                titre: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' })
  }
})

// Update user role (admin only)
router.patch('/:id/role', authorize('ADMIN'), validate(updateUserRoleValidation), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params
    const { role } = req.body

    const user = await prisma.user.findUnique({
      where: { id: String(id) }
    })

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: { role },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        dateInscription: true
      }
    })

    res.json({
      success: true,
      data: updatedUser,
      message: 'Rôle mis à jour avec succès'
    })
  } catch (error) {
    console.error('Update role error:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle' })
  }
})

// Delete user (admin only)
router.delete('/:id', authorize('ADMIN'), validate(idValidation), async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: String(id) }
    })

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    // Empêcher la suppression de soi-même
    if (id === req.user?.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    // Supprimer l'utilisateur (les relations en cascade seront gérées par Prisma)
    await prisma.user.delete({
      where: { id: String(id) }
    })

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' })
  }
})

export default router