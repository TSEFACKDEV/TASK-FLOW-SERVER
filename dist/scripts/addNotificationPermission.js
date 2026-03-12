"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
async function addNotificationPermission() {
    try {
        console.log('🚀 Ajout de la permission MANAGE_NOTIFICATIONS...\n');
        const permission = await prisma_client_js_1.default.permission.upsert({
            where: { name: 'MANAGE_NOTIFICATIONS' },
            update: {},
            create: {
                name: 'MANAGE_NOTIFICATIONS',
                description: 'Permet de gérer et créer des notifications système',
            },
        });
        console.log('✅ Permission créée/récupérée:', permission.name);
        const adminRole = await prisma_client_js_1.default.role.findUnique({
            where: { name: 'ADMIN' },
        });
        const superAdminRole = await prisma_client_js_1.default.role.findUnique({
            where: { name: 'SUPER_ADMIN' },
        });
        const rolesToUpdate = [adminRole, superAdminRole].filter(Boolean);
        for (const role of rolesToUpdate) {
            if (!role)
                continue;
            await prisma_client_js_1.default.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                },
                update: {},
                create: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            });
            console.log(`✅ Permission assignée au rôle: ${role.name}`);
        }
        const usersWithPermission = await prisma_client_js_1.default.user.findMany({
            where: {
                roles: {
                    some: {
                        role: {
                            name: {
                                in: ['ADMIN', 'SUPER_ADMIN'],
                            },
                        },
                    },
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                roles: {
                    select: {
                        role: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        console.log('\n📋 Utilisateurs ayant maintenant accès aux notifications:');
        usersWithPermission.forEach((user) => {
            const roles = user.roles.map((r) => r.role.name).join(', ');
            console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - Rôles: ${roles}`);
        });
        console.log('\n✨ Permission MANAGE_NOTIFICATIONS ajoutée avec succès!\n');
    }
    catch (error) {
        console.error('❌ Erreur:', error);
        throw error;
    }
    finally {
        await prisma_client_js_1.default.$disconnect();
    }
}
addNotificationPermission();
