"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function addPaymentPermissions() {
    try {
        console.log('🔐 Ajout des permissions de gestion des paiements...');
        let permission = await prisma.permission.findFirst({
            where: { permissionKey: 'manage:payments' }
        });
        if (permission) {
            console.log('✅ La permission manage:payments existe déjà');
        }
        else {
            permission = await prisma.permission.create({
                data: {
                    permissionKey: 'manage:payments',
                    title: 'Gérer les paiements',
                    description: 'Permet de gérer les paiements et voir les statistiques financières'
                }
            });
            console.log('✅ Permission créée:', permission.permissionKey);
        }
        const superAdminRole = await prisma.role.findFirst({
            where: { name: 'SUPER_ADMIN' }
        });
        if (superAdminRole) {
            const existingRolePermission = await prisma.rolePermission.findFirst({
                where: {
                    roleId: superAdminRole.id,
                    permissionId: permission.id
                }
            });
            if (!existingRolePermission) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: superAdminRole.id,
                        permissionId: permission.id
                    }
                });
                console.log('✅ Permission attribuée au rôle SUPER_ADMIN');
            }
            else {
                console.log('✅ Permission déjà attribuée au rôle SUPER_ADMIN');
            }
        }
        console.log('🎉 Permissions de paiement ajoutées avec succès !');
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'ajout des permissions:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
addPaymentPermissions();
