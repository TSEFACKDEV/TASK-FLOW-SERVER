"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validation_middleware_js_1 = require("../middlewares/validation.middleware.js");
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json({ success: true, data: [] });
        }
        const users = await prisma_client_js_1.default.user.findMany({
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
        });
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Erreur lors de la recherche' });
    }
});
router.get('/', (0, auth_middleware_js_1.authorize)('ADMIN'), async (_req, res) => {
    try {
        const users = await prisma_client_js_1.default.user.findMany({
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
        });
        const formattedUsers = users.map(user => ({
            ...user,
            projets: user._count.projetsCrees,
            taches: user._count.tachesAssignees
        }));
        res.json({
            success: true,
            data: formattedUsers
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
});
router.post('/', (0, auth_middleware_js_1.authorize)('ADMIN'), (0, validation_middleware_js_1.validate)(validation_middleware_js_1.createUserValidation), async (req, res) => {
    try {
        const { email, password, nom, prenom, role } = req.body;
        const existingUser = await prisma_client_js_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_client_js_1.default.user.create({
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
        });
        res.status(201).json({
            success: true,
            data: user,
            message: 'Utilisateur créé avec succès'
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
});
router.get('/:id', (0, validation_middleware_js_1.validate)(validation_middleware_js_1.idValidation), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_client_js_1.default.user.findUnique({
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
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
    }
});
router.patch('/:id/role', (0, auth_middleware_js_1.authorize)('ADMIN'), (0, validation_middleware_js_1.validate)(validation_middleware_js_1.updateUserRoleValidation), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await prisma_client_js_1.default.user.findUnique({
            where: { id: String(id) }
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        const updatedUser = await prisma_client_js_1.default.user.update({
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
        });
        res.json({
            success: true,
            data: updatedUser,
            message: 'Rôle mis à jour avec succès'
        });
    }
    catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle' });
    }
});
router.delete('/:id', (0, auth_middleware_js_1.authorize)('ADMIN'), (0, validation_middleware_js_1.validate)(validation_middleware_js_1.idValidation), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_client_js_1.default.user.findUnique({
            where: { id: String(id) }
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        if (id === req.user?.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }
        await prisma_client_js_1.default.user.delete({
            where: { id: String(id) }
        });
        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});
exports.default = router;
