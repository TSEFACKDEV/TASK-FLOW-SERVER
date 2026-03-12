"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const register = async (req, res) => {
    try {
        const { email, password, nom, prenom } = req.body;
        const existingUser = await prisma_client_js_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const user = await prisma_client_js_1.default.user.create({
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
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            success: true,
            data: { user, token },
            message: 'Inscription réussie'
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);
        console.log('Prisma client state:', {
            hasAdapter: !!prisma_client_js_1.default._adapter,
            isConnected: !!prisma_client_js_1.default._isConnected
        });
        try {
            await prisma_client_js_1.default.$queryRaw `SELECT 1`;
            console.log('Database connection verified');
        }
        catch (connError) {
            console.error('Database connection test failed:', connError);
            await prisma_client_js_1.default.$connect();
            console.log('Reconnected to database');
        }
        const user = await prisma_client_js_1.default.user.findUnique({
            where: { email }
        });
        console.log('User found:', user ? 'Yes' : 'No');
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
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
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const user = await prisma_client_js_1.default.user.findUnique({
            where: { id: req.user.id },
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
        });
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const { nom, prenom, email } = req.body;
        if (email !== req.user.email) {
            const existingUser = await prisma_client_js_1.default.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }
        }
        const updatedUser = await prisma_client_js_1.default.user.update({
            where: { id: req.user.id },
            data: { nom, prenom, email },
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
            message: 'Profil mis à jour avec succès'
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
    }
};
exports.updateProfile = updateProfile;
