"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function addNotificationPermissions() {
    try {
        console.log('🚀 Démarrage de l\'ajout des permissions de notifications...\n');
        const permissions = [
            {
                key: 'MANAGE_NOTIFICATIONS',
                title: 'Manage Notifications',
                description: 'Permission pour gérer et créer des notifications système',
            },
            {
                key: 'MANAGE_USERS',
                title: 'Manage Users',
                description: 'Permission pour gérer les utilisateurs',
            },
        ];
        console.log('📝 Création/Mise à jour des permissions...');
        for (const perm of permissions) {
            const permission = await prisma.permission.upsert({
                where: { permissionKey: perm.key },
                update: {
                    title: perm.title,
                    description: perm.description,
                },
                create: {
                    permissionKey: perm.key,
                    title: perm.title,
                    description: perm.description,
                },
            });
            console.log(`  ✅ ${perm.key} - ${permission.id}`);
        }
        console.log('\n🔍 Recherche du rôle SUPER_ADMIN...');
        const superAdminRole = await prisma.role.findUnique({
            where: { name: 'SUPER_ADMIN' },
        });
        if (!superAdminRole) {
            console.error('❌ Le rôle SUPER_ADMIN n\'existe pas !');
            return;
        }
        console.log(`  ✅ SUPER_ADMIN trouvé - ${superAdminRole.id}`);
        console.log('\n🔗 Attribution des permissions au SUPER_ADMIN...');
        for (const perm of permissions) {
            const permission = await prisma.permission.findUnique({
                where: { permissionKey: perm.key },
            });
            if (permission) {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: superAdminRole.id,
                            permissionId: permission.id,
                        },
                    },
                    update: {},
                    create: {
                        roleId: superAdminRole.id,
                        permissionId: permission.id,
                    },
                });
                console.log(`  ✅ ${perm.key} assigné au SUPER_ADMIN`);
            }
        }
        console.log('\n👥 Vérification des utilisateurs SUPER_ADMIN...');
        const superAdmins = await prisma.userRole.findMany({
            where: { roleId: superAdminRole.id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        console.log(`\n✅ ${superAdmins.length} utilisateur(s) SUPER_ADMIN trouvé(s):`);
        superAdmins.forEach((ur) => {
            console.log(`  • ${ur.user.firstName} ${ur.user.lastName} (${ur.user.email})`);
        });
        console.log('\n✨ Permissions de notifications ajoutées avec succès !');
        console.log('Les utilisateurs SUPER_ADMIN peuvent maintenant :');
        console.log('  • Créer des notifications personnalisées');
        console.log('  • Consulter les statistiques de notifications');
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'ajout des permissions:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
addNotificationPermissions()
    .then(() => {
    console.log('\n🎉 Script terminé avec succès !');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
});
