"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const config_js_1 = __importDefault(require("./config.js"));
const notification_service_js_1 = require("../services/notification.service.js");
const slugHelpers_js_1 = require("../utils/slugHelpers.js");
const extractGoogleAvatar = (profile) => {
    return profile.photos && profile.photos.length > 0
        ? profile.photos[0].value
        : profile._json?.picture || null;
};
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma_client_js_1.default.user.findUnique({
            where: { id },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_js_1.default.GOOGLE_CLIENT_ID,
    clientSecret: config_js_1.default.GOOGLE_CLIENT_SECRET,
    callbackURL: config_js_1.default.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('Email non fourni par Google'), undefined);
        }
        const googleAvatar = extractGoogleAvatar(profile);
        let isNewUser = false;
        const result = await prisma_client_js_1.default.$transaction(async (tx) => {
            const existingUser = await tx.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { googleId: profile.id },
                    ],
                },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });
            if (existingUser) {
                if (existingUser.status !== "ACTIVE") {
                    throw new Error(`Compte ${existingUser.status.toLowerCase()}. Connexion impossible.`);
                }
                const updatedUser = await tx.user.update({
                    where: { id: existingUser.id },
                    data: {
                        googleId: profile.id,
                        lastConnexion: new Date(),
                        ...(!existingUser.avatar && googleAvatar && { avatar: googleAvatar }),
                    },
                    include: {
                        roles: {
                            include: {
                                role: true,
                            },
                        },
                    },
                });
                return updatedUser;
            }
            isNewUser = true;
            const displayName = (profile.displayName || email).trim();
            const names = displayName.split(' ').filter(name => name.length > 0);
            const firstName = names[0] || '';
            const lastName = names.length > 1 ? names.slice(1).join(' ') : names[0];
            const userRole = await tx.role.findUnique({
                where: { name: 'USER' },
            });
            if (!userRole) {
                throw new Error('Le rôle USER n\'existe pas dans la base de données');
            }
            const newUser = await tx.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    googleId: profile.id,
                    isVerified: true,
                    password: '',
                    ...(googleAvatar && { avatar: googleAvatar }),
                    status: 'ACTIVE',
                    lastConnexion: new Date(),
                    roles: {
                        create: {
                            roleId: userRole.id,
                        },
                    },
                },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });
            const slug = (0, slugHelpers_js_1.generateUserSlug)(firstName, lastName, newUser.id);
            const userWithSlug = await tx.user.update({
                where: { id: newUser.id },
                data: { slug },
                include: {
                    roles: {
                        include: {
                            role: true,
                        },
                    },
                },
            });
            return userWithSlug;
        });
        if (!result) {
            throw new Error('Erreur d\'authentification');
        }
        if (isNewUser) {
            try {
                await (0, notification_service_js_1.createNotification)(result.id, 'Bienvenue sur BuyAndSale', 'Votre compte a été créé avec succès via Google. Bienvenue !', {
                    type: 'WELCOME',
                    link: '/',
                });
            }
            catch (notificationError) {
                console.error('Erreur lors de la création de la notification:', notificationError);
            }
        }
        return done(null, result);
    }
    catch (error) {
        console.error("Erreur d'authentification Google:", error);
        return done(error, undefined);
    }
}));
exports.default = passport_1.default;
