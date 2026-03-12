import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { LoginCredentials, RegisterData } from '../types/index.js'
import prisma from '../model/prisma.client.js'

export const register = async (req: Request, res: Response):Promise<any> => {
  try {
    const { email, password, nom, prenom }: RegisterData = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS!) || 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: 'MEMBER'
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

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      success: true,
      data: { user, token },
      message: 'Inscription réussie'
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Erreur lors de l\'inscription' })
  }
}

export const login = async (req: Request, res: Response):Promise<any> => {
  try {
    const { email, password }: LoginCredentials = req.body
    console.log('Login attempt for email:', email);
    console.log('Prisma client state:', {
      hasAdapter: !!(prisma as any)._adapter,
      isConnected: !!(prisma as any)._isConnected
    });
    
    // Test connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection verified');
    } catch (connError) {
      console.error('Database connection test failed:', connError);
      await prisma.$connect();
      console.log('Reconnected to database');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          dateInscription: user.dateInscription
        },
        token
      },
      message: 'Connexion réussie'
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Erreur lors de la connexion' })
  }
}

export const getProfile = async (req:Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
            titre: true,
            dateCreation: true
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

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' })
  }
}

export const updateProfile = async (req: Request, res: Response):Promise<any> => {
  try {
    const { nom, prenom, email } = req.body

    // Check if email is already taken
    if (email !== req.user!.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { nom, prenom, email },
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
      message: 'Profil mis à jour avec succès'
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' })
  }
}