import { Request, Response } from 'express'
import prisma from '../model/prisma.client'



export const createProject = async (req: Request, res: Response) => {
  try {
    const { titre, description } = req.body
    const creatorId = req.user!.id

    const project = await prisma.project.create({
      data: {
        titre,
        description,
        creatorId,
        membres: {
          create: {
            userId: creatorId
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        membres: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: project,
      message: 'Projet créé avec succès'
    })
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({ message: 'Erreur lors de la création du projet' })
  }
}

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string || ''
    const sortBy = req.query.sortBy as string || 'dateCreation'
    const sortOrder = req.query.sortOrder as string || 'desc'

    const skip = (page - 1) * limit

    const where = {
      OR: [
        { titre: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const} }
      ],
      membres: {
        some: {
          userId: String(req.user!.id) 
        }
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          creator: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          },
          membres: {
            include: {
              user: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  email: true
                }
              }
            }
          },
          taches: {
            select: {
              id: true,
              titre: true,
              statut: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ])

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get projects error:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération des projets' })
  }
}

export const getProjectById = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params

    const project = await prisma.project.findFirst({
      where: {
        id: String(id),
        membres: {
          some: {
            userId: req.user!.id
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        membres: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        },
        taches: {
          include: {
            assigne: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            },
            commentaires: {
              include: {
                user: {
                  select: {
                    id: true,
                    nom: true,
                    prenom: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' })
    }

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Get project error:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération du projet' })
  }
}

export const updateProject = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params
    const { titre, description } = req.body

    // Check if user is creator
    const project = await prisma.project.findFirst({
      where: {
        id : String(id),
        creatorId: req.user!.id
      }
    })

    if (!project) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce projet' })
    }

    const updatedProject = await prisma.project.update({
      where: { id: String(id) },
      data: { titre, description },
      include: {
        creator: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        membres: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        }
      }
    })

    res.json({
      success: true,
      data: updatedProject,
      message: 'Projet mis à jour avec succès'
    })
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour du projet' })
  }
}

export const deleteProject = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params

    // Check if user is creator
    const project = await prisma.project.findFirst({
      where: {
        id: String(id),
        creatorId: req.user!.id
      }
    })

    if (!project) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce projet' })
    }

    // Delete project and related data
    await prisma.$transaction([
      prisma.commentaire.deleteMany({
        where: {
          task: {
            projetId: String(id)
          }
        }
      }),
      prisma.historiqueTask.deleteMany({
        where: {
          task: {
            projetId: String(id)
          }
        }
      }),
      prisma.task.deleteMany({
        where: { projetId: String(id)}
      }),
      prisma.membreProjet.deleteMany({
        where: { projectId: String(id) }
      }),
      prisma.project.delete({
        where: { id: String(id) }
      })
    ])

    res.json({
      success: true,
      message: 'Projet supprimé avec succès'
    })
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({ message: 'Erreur lors de la suppression du projet' })
  }
}

export const addMember = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id } = req.params
    const { userId } = req.body

    // Check if user is creator
    const project = await prisma.project.findFirst({
      where: {
        id : String(id) ,
        creatorId: req.user!.id
      }
    })

    if (!project) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à ajouter des membres' })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' })
    }

    // Add member
    const member = await prisma.membreProjet.create({
      data: {
        userId,
        projectId: String(id)
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: member,
      message: 'Membre ajouté avec succès'
    })
  } catch (error) {
    console.error('Add member error:', error)
    res.status(500).json({ message: 'Erreur lors de l\'ajout du membre' })
  }
}


export const removeMember = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, userId } = req.params

    // Vérifier que l'utilisateur est le créateur
    const project = await prisma.project.findFirst({
      where: {
        id: String(id),
        creatorId: req.user!.id
      }
    })

    if (!project) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à retirer des membres' })
    }

    // Vérifier que le membre existe
    const member = await prisma.membreProjet.findFirst({
      where: {
        projectId: String(id),
        userId: String(userId)
      }
    })

    if (!member) {
      return res.status(404).json({ message: 'Ce membre n\'est pas dans le projet' })
    }

    // Empêcher de retirer le créateur
    if (userId === req.user!.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous retirer vous-même' })
    }

    // Retirer le membre
    await prisma.membreProjet.delete({
      where: {
        userId_projectId: {
          userId: String(userId),
          projectId: String(id)
        }
      }
    })

    // Optionnel: Désassigner les tâches de ce membre
    await prisma.task.updateMany({
      where: {
        projetId: String(id),
        assigneA: String(userId)
      },
      data: {
        assigneA: null
      }
    })

    res.json({
      success: true,
      message: 'Membre retiré avec succès'
    })
  } catch (error) {
    console.error('Remove member error:', error)
    res.status(500).json({ message: 'Erreur lors du retrait du membre' })
  }
}