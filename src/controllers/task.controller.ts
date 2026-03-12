import { Request, Response } from 'express'
import prisma from '../model/prisma.client'

// Get all tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { projetId, statut, assigneA } = req.query

    const where: any = {
      projet: {
        membres: {
          some: {
            userId: req.user!.id
          }
        }
      }
    }

    if (projetId) where.projetId = projetId as string
    if (statut) where.statut = statut as string
    if (assigneA) where.assigneA = assigneA as string

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assigne: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            titre: true,
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
        },
        historique: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: tasks
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches' })
  }
}

// Get task by ID
export const getTaskById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params

    const task = await prisma.task.findFirst({
      where: {
        id: String(id),
        projet: {
          membres: {
            some: {
              userId: req.user!.id
            }
          }
        }
      },
      include: {
        assigne: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            titre: true,
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
        },
        historique: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' })
    }

    res.json({
      success: true,
      data: task
    })
  } catch (error) {
    console.error('Get task error:', error)
    res.status(500).json({ message: 'Erreur lors de la récupération de la tâche' })
  }
}

// Create task
export const createTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { titre, description, projetId, assigneA, echeance } = req.body

    const project = await prisma.project.findFirst({
      where: {
        id: projetId,
        membres: {
          some: {
            userId: req.user!.id
          }
        }
      }
    })

    if (!project) {
      return res.status(403).json({ message: 'Accès non autorisé à ce projet' })
    }

    const task = await prisma.task.create({
      data: {
        titre,
        description,
        projetId,
        assigneA,
        echeance: echeance ? new Date(echeance) : null
      },
      include: {
        assigne: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            titre: true
          }
        }
      }
    })

    await prisma.historiqueTask.create({
      data: {
        taskId: task.id,
        userId: req.user!.id,
        action: 'CREATION',
        nouvelleValeur: JSON.stringify(task)
      }
    })

    res.status(201).json({
      success: true,
      data: task,
      message: 'Tâche créée avec succès'
    })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ message: 'Erreur lors de la création de la tâche' })
  }
}

// Update task
export const updateTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params
    const { titre, description, assigneA, echeance } = req.body

    const task = await prisma.task.findFirst({
      where: {
        id: String(id),
        projet: {
          membres: {
            some: {
              userId: req.user!.id
            }
          }
        }
      }
    })

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' })
    }

    const updatedTask = await prisma.task.update({
      where: { id: String(id) },
      data: {
        titre,
        description,
        assigneA,
        echeance: echeance ? new Date(echeance) : null
      },
      include: {
        assigne: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            titre: true
          }
        }
      }
    })

    await prisma.historiqueTask.create({
      data: {
        taskId: String(id),
        userId: req.user!.id,
        action: 'MISE_A_JOUR',
        ancienneValeur: JSON.stringify(task),
        nouvelleValeur: JSON.stringify(updatedTask)
      }
    })

    res.json({
      success: true,
      data: updatedTask,
      message: 'Tâche mise à jour avec succès'
    })
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la tâche' })
  }
}

// Update task status
export const updateTaskStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params
    const { statut } = req.body

    // Validation du statut
    const validStatuses = ['A_FAIRE', 'EN_COURS', 'TERMINE']
    if (!validStatuses.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' })
    }

    const task = await prisma.task.findFirst({
      where: {
        id: String(id),
        projet: {
          membres: {
            some: {
              userId: req.user!.id
            }
          }
        }
      }
    })

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' })
    }

    const oldStatus = task.statut

    const updatedTask = await prisma.task.update({
      where: { id: String(id) },
      data: { statut },
      include: {
        assigne: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    await prisma.historiqueTask.create({
      data: {
        taskId: String(id),
        userId: req.user!.id,
        action: 'STATUT_CHANGE',
        ancienneValeur: oldStatus,
        nouvelleValeur: statut
      }
    })

    res.json({
      success: true,
      data: updatedTask,
      message: 'Statut mis à jour avec succès'
    })
  } catch (error) {
    console.error('Update task status error:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' })
  }
}

// Delete task
export const deleteTask = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params

    const task = await prisma.task.findFirst({
      where: {
        id: String(id),
        projet: {
          membres: {
            some: {
              userId: req.user!.id
            }
          }
        }
      }
    })

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' })
    }

    // Supprimer les commentaires et l'historique associés
    await prisma.$transaction([
      prisma.commentaire.deleteMany({
        where: { taskId: String(id) }
      }),
      prisma.historiqueTask.deleteMany({
        where: { taskId: String(id) }
      }),
      prisma.task.delete({
        where: { id: String(id) }
      })
    ])

    res.json({
      success: true,
      message: 'Tâche supprimée avec succès'
    })
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ message: 'Erreur lors de la suppression de la tâche' })
  }
}

// Add comment
export const addComment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params
    const { contenu } = req.body

    const task = await prisma.task.findFirst({
      where: {
        id: String(id),
        projet: {
          membres: {
            some: {
              userId: req.user!.id
            }
          }
        }
      }
    })

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' })
    }

    const comment = await prisma.commentaire.create({
      data: {
        contenu,
        taskId: String(id),
        userId: req.user!.id
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Commentaire ajouté avec succès'
    })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire' })
  }
}

// Update task assignment (assigner ou désassigner)
export const updateTaskAssignment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params
    const { assigneA } = req.body

    // assigneA peut être null, undefined, ou un string
    // Si c'est null ou undefined, on désassigne

    const task = await prisma.task.findFirst({
      where: {
        id: String(id),
        projet: {
          membres: {
            some: {
              userId: req.user!.id
            }
          }
        }
      }
    })

    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' })
    }

    // Si assigneA est fourni et n'est pas null, vérifier que l'utilisateur existe
    if (assigneA && assigneA !== null) {
      const user = await prisma.user.findUnique({
        where: { id: assigneA }
      })

      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' })
      }

      // Optionnel: Ajouter automatiquement l'utilisateur au projet s'il n'est pas membre
      const isMember = await prisma.membreProjet.findFirst({
        where: {
          userId: assigneA,
          projectId: task.projetId
        }
      })

      if (!isMember) {
        await prisma.membreProjet.create({
          data: {
            userId: assigneA,
            projectId: task.projetId
          }
        })
      }
    }

    const oldAssignee = task.assigneA

    // Mettre à jour l'assignation
    const updatedTask = await prisma.task.update({
      where: { id: String(id) },
      data: { 
        // Si assigneA est null ou undefined, on met null
        assigneA: assigneA || null 
      },
      include: {
        assigne: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            titre: true
          }
        }
      }
    })

    // Créer une entrée dans l'historique
    await prisma.historiqueTask.create({
      data: {
        taskId: String(id),
        userId: req.user!.id,
        action: assigneA ? 'ASSIGNMENT' : 'UNASSIGNMENT',
        ancienneValeur: oldAssignee || 'null',
        nouvelleValeur: assigneA || 'null'
      }
    })

    res.json({
      success: true,
      data: updatedTask,
      message: assigneA ? 'Tâche assignée avec succès' : 'Tâche désassignée avec succès'
    })
  } catch (error) {
    console.error('Update task assignment error:', error)
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'assignation' })
  }
}