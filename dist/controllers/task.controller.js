"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskAssignment = exports.addComment = exports.deleteTask = exports.updateTaskStatus = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const prisma_client_1 = __importDefault(require("../model/prisma.client"));
const getTasks = async (req, res) => {
    try {
        const { projetId, statut, assigneA } = req.query;
        const where = {
            projet: {
                membres: {
                    some: {
                        userId: req.user.id
                    }
                }
            }
        };
        if (projetId)
            where.projetId = projetId;
        if (statut)
            where.statut = statut;
        if (assigneA)
            where.assigneA = assigneA;
        const tasks = await prisma_client_1.default.task.findMany({
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
        });
        res.json({
            success: true,
            data: tasks
        });
    }
    catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tâches' });
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma_client_1.default.task.findFirst({
            where: {
                id: String(id),
                projet: {
                    membres: {
                        some: {
                            userId: req.user.id
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
        });
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la tâche' });
    }
};
exports.getTaskById = getTaskById;
const createTask = async (req, res) => {
    try {
        const { titre, description, projetId, assigneA, echeance } = req.body;
        const project = await prisma_client_1.default.project.findFirst({
            where: {
                id: projetId,
                membres: {
                    some: {
                        userId: req.user.id
                    }
                }
            }
        });
        if (!project) {
            return res.status(403).json({ message: 'Accès non autorisé à ce projet' });
        }
        const task = await prisma_client_1.default.task.create({
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
        });
        await prisma_client_1.default.historiqueTask.create({
            data: {
                taskId: task.id,
                userId: req.user.id,
                action: 'CREATION',
                nouvelleValeur: JSON.stringify(task)
            }
        });
        res.status(201).json({
            success: true,
            data: task,
            message: 'Tâche créée avec succès'
        });
    }
    catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la tâche' });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { titre, description, assigneA, echeance } = req.body;
        const task = await prisma_client_1.default.task.findFirst({
            where: {
                id: String(id),
                projet: {
                    membres: {
                        some: {
                            userId: req.user.id
                        }
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }
        const updatedTask = await prisma_client_1.default.task.update({
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
        });
        await prisma_client_1.default.historiqueTask.create({
            data: {
                taskId: String(id),
                userId: req.user.id,
                action: 'MISE_A_JOUR',
                ancienneValeur: JSON.stringify(task),
                nouvelleValeur: JSON.stringify(updatedTask)
            }
        });
        res.json({
            success: true,
            data: updatedTask,
            message: 'Tâche mise à jour avec succès'
        });
    }
    catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la tâche' });
    }
};
exports.updateTask = updateTask;
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        const validStatuses = ['A_FAIRE', 'EN_COURS', 'TERMINE'];
        if (!validStatuses.includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }
        const task = await prisma_client_1.default.task.findFirst({
            where: {
                id: String(id),
                projet: {
                    membres: {
                        some: {
                            userId: req.user.id
                        }
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }
        const oldStatus = task.statut;
        const updatedTask = await prisma_client_1.default.task.update({
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
        });
        await prisma_client_1.default.historiqueTask.create({
            data: {
                taskId: String(id),
                userId: req.user.id,
                action: 'STATUT_CHANGE',
                ancienneValeur: oldStatus,
                nouvelleValeur: statut
            }
        });
        res.json({
            success: true,
            data: updatedTask,
            message: 'Statut mis à jour avec succès'
        });
    }
    catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
    }
};
exports.updateTaskStatus = updateTaskStatus;
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma_client_1.default.task.findFirst({
            where: {
                id: String(id),
                projet: {
                    membres: {
                        some: {
                            userId: req.user.id
                        }
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }
        await prisma_client_1.default.$transaction([
            prisma_client_1.default.commentaire.deleteMany({
                where: { taskId: String(id) }
            }),
            prisma_client_1.default.historiqueTask.deleteMany({
                where: { taskId: String(id) }
            }),
            prisma_client_1.default.task.delete({
                where: { id: String(id) }
            })
        ]);
        res.json({
            success: true,
            message: 'Tâche supprimée avec succès'
        });
    }
    catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la tâche' });
    }
};
exports.deleteTask = deleteTask;
const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenu } = req.body;
        const task = await prisma_client_1.default.task.findFirst({
            where: {
                id: String(id),
                projet: {
                    membres: {
                        some: {
                            userId: req.user.id
                        }
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }
        const comment = await prisma_client_1.default.commentaire.create({
            data: {
                contenu,
                taskId: String(id),
                userId: req.user.id
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
        });
        res.status(201).json({
            success: true,
            data: comment,
            message: 'Commentaire ajouté avec succès'
        });
    }
    catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire' });
    }
};
exports.addComment = addComment;
const updateTaskAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigneA } = req.body;
        const task = await prisma_client_1.default.task.findFirst({
            where: {
                id: String(id),
                projet: {
                    membres: {
                        some: {
                            userId: req.user.id
                        }
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({ message: 'Tâche non trouvée' });
        }
        if (assigneA && assigneA !== null) {
            const user = await prisma_client_1.default.user.findUnique({
                where: { id: assigneA }
            });
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            const isMember = await prisma_client_1.default.membreProjet.findFirst({
                where: {
                    userId: assigneA,
                    projectId: task.projetId
                }
            });
            if (!isMember) {
                await prisma_client_1.default.membreProjet.create({
                    data: {
                        userId: assigneA,
                        projectId: task.projetId
                    }
                });
            }
        }
        const oldAssignee = task.assigneA;
        const updatedTask = await prisma_client_1.default.task.update({
            where: { id: String(id) },
            data: {
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
        });
        await prisma_client_1.default.historiqueTask.create({
            data: {
                taskId: String(id),
                userId: req.user.id,
                action: assigneA ? 'ASSIGNMENT' : 'UNASSIGNMENT',
                ancienneValeur: oldAssignee || 'null',
                nouvelleValeur: assigneA || 'null'
            }
        });
        res.json({
            success: true,
            data: updatedTask,
            message: assigneA ? 'Tâche assignée avec succès' : 'Tâche désassignée avec succès'
        });
    }
    catch (error) {
        console.error('Update task assignment error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'assignation' });
    }
};
exports.updateTaskAssignment = updateTaskAssignment;
