"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.addMember = exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getAllProjects = exports.createProject = void 0;
const prisma_client_1 = __importDefault(require("../model/prisma.client"));
const createProject = async (req, res) => {
    try {
        const { titre, description } = req.body;
        const creatorId = req.user.id;
        const project = await prisma_client_1.default.project.create({
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
        });
        res.status(201).json({
            success: true,
            data: project,
            message: 'Projet créé avec succès'
        });
    }
    catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Erreur lors de la création du projet' });
    }
};
exports.createProject = createProject;
const getAllProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'dateCreation';
        const sortOrder = req.query.sortOrder || 'desc';
        const skip = (page - 1) * limit;
        const where = {
            OR: [
                { titre: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ],
            membres: {
                some: {
                    userId: String(req.user.id)
                }
            }
        };
        const [projects, total] = await Promise.all([
            prisma_client_1.default.project.findMany({
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
            prisma_client_1.default.project.count({ where })
        ]);
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
        });
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des projets' });
    }
};
exports.getAllProjects = getAllProjects;
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma_client_1.default.project.findFirst({
            where: {
                id: String(id),
                membres: {
                    some: {
                        userId: req.user.id
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
        });
        if (!project) {
            return res.status(404).json({ message: 'Projet non trouvé' });
        }
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du projet' });
    }
};
exports.getProjectById = getProjectById;
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { titre, description } = req.body;
        const project = await prisma_client_1.default.project.findFirst({
            where: {
                id: String(id),
                creatorId: req.user.id
            }
        });
        if (!project) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce projet' });
        }
        const updatedProject = await prisma_client_1.default.project.update({
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
        });
        res.json({
            success: true,
            data: updatedProject,
            message: 'Projet mis à jour avec succès'
        });
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du projet' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma_client_1.default.project.findFirst({
            where: {
                id: String(id),
                creatorId: req.user.id
            }
        });
        if (!project) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce projet' });
        }
        await prisma_client_1.default.$transaction([
            prisma_client_1.default.commentaire.deleteMany({
                where: {
                    task: {
                        projetId: String(id)
                    }
                }
            }),
            prisma_client_1.default.historiqueTask.deleteMany({
                where: {
                    task: {
                        projetId: String(id)
                    }
                }
            }),
            prisma_client_1.default.task.deleteMany({
                where: { projetId: String(id) }
            }),
            prisma_client_1.default.membreProjet.deleteMany({
                where: { projectId: String(id) }
            }),
            prisma_client_1.default.project.delete({
                where: { id: String(id) }
            })
        ]);
        res.json({
            success: true,
            message: 'Projet supprimé avec succès'
        });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du projet' });
    }
};
exports.deleteProject = deleteProject;
const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const project = await prisma_client_1.default.project.findFirst({
            where: {
                id: String(id),
                creatorId: req.user.id
            }
        });
        if (!project) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à ajouter des membres' });
        }
        const user = await prisma_client_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        const member = await prisma_client_1.default.membreProjet.create({
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
        });
        res.json({
            success: true,
            data: member,
            message: 'Membre ajouté avec succès'
        });
    }
    catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du membre' });
    }
};
exports.addMember = addMember;
const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const project = await prisma_client_1.default.project.findFirst({
            where: {
                id: String(id),
                creatorId: req.user.id
            }
        });
        if (!project) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à retirer des membres' });
        }
        const member = await prisma_client_1.default.membreProjet.findFirst({
            where: {
                projectId: String(id),
                userId: String(userId)
            }
        });
        if (!member) {
            return res.status(404).json({ message: 'Ce membre n\'est pas dans le projet' });
        }
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas vous retirer vous-même' });
        }
        await prisma_client_1.default.membreProjet.delete({
            where: {
                userId_projectId: {
                    userId: String(userId),
                    projectId: String(id)
                }
            }
        });
        await prisma_client_1.default.task.updateMany({
            where: {
                projetId: String(id),
                assigneA: String(userId)
            },
            data: {
                assigneA: null
            }
        });
        res.json({
            success: true,
            message: 'Membre retiré avec succès'
        });
    }
    catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Erreur lors du retrait du membre' });
    }
};
exports.removeMember = removeMember;
