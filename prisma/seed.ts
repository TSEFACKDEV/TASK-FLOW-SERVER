import { PrismaClient, Role, Statut } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();





async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.$transaction([
    prisma.commentaire.deleteMany(),
    prisma.historiqueTask.deleteMany(),
    prisma.task.deleteMany(),
    prisma.membreProjet.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
  ])

  // Create users
  const hashedPassword = await bcrypt.hash('KLEIN310', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'tsefackcalvinklein@gmail.com',
      password: hashedPassword,
      nom: 'TSEFACK',
      prenom: 'Calvin Klein',
      role: Role.ADMIN,
    }
  })

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        password: hashedPassword,
        nom: 'Doe',
        prenom: 'John',
        role: Role.MEMBER,
      }
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        password: hashedPassword,
        nom: 'Smith',
        prenom: 'Jane',
        role: Role.MEMBER,
      }
    }),
    prisma.user.create({
      data: {
        email: 'bob.wilson@example.com',
        password: hashedPassword,
        nom: 'Wilson',
        prenom: 'Bob',
        role: Role.MEMBER,
      }
    })
  ])

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      titre: 'Application Mobile',
      description: 'Développement d\'une application mobile de gestion de tâches',
      creatorId: admin.id,
      membres: {
        create: [
          { userId: admin.id },
          { userId: users[0].id },
          { userId: users[1].id }
        ]
      }
    }
  })

  const project2 = await prisma.project.create({
    data: {
      titre: 'Site Web E-commerce',
      description: 'Refonte du site web e-commerce avec React et Node.js',
      creatorId: users[0].id,
      membres: {
        create: [
          { userId: users[0].id },
          { userId: users[2].id }
        ]
      }
    }
  })

  const project3 = await prisma.project.create({
    data: {
      titre: 'API RESTful',
      description: 'Développement d\'une API RESTful pour le projet de gestion',
      creatorId: users[1].id,
      membres: {
        create: [
          { userId: users[1].id },
          { userId: users[2].id }
        ]
      }
    }
  })

  // Create tasks
  const tasks = await Promise.all([
    // Project 1 tasks
    prisma.task.create({
      data: {
        titre: 'Maquettage UI/UX',
        description: 'Créer les maquettes de l\'application',
        projetId: project1.id,
        assigneA: users[0].id,
        statut: Statut.TERMINE,
        echeance: new Date('2024-02-01')
      }
    }),
    prisma.task.create({
      data: {
        titre: 'Développement Frontend',
        description: 'Implémenter les composants React',
        projetId: project1.id,
        assigneA: users[1].id,
        statut: Statut.EN_COURS,
        echeance: new Date('2024-03-15')
      }
    }),
    prisma.task.create({
      data: {
        titre: 'Développement Backend',
        description: 'Créer les API endpoints',
        projetId: project1.id,
        assigneA: admin.id,
        statut: Statut.A_FAIRE,
        echeance: new Date('2024-03-30')
      }
    }),

    // Project 2 tasks
    prisma.task.create({
      data: {
        titre: 'Configuration du projet',
        description: 'Initialiser le projet et les dépendances',
        projetId: project2.id,
        assigneA: users[0].id,
        statut: Statut.TERMINE,
        echeance: new Date('2024-02-10')
      }
    }),
    prisma.task.create({
      data: {
        titre: 'Catalogue produits',
        description: 'Implémenter la gestion des produits',
        projetId: project2.id,
        assigneA: users[2].id,
        statut: Statut.EN_COURS,
        echeance: new Date('2024-03-01')
      }
    }),
    prisma.task.create({
      data: {
        titre: 'Panier d\'achat',
        description: 'Développer la fonctionnalité de panier',
        projetId: project2.id,
        assigneA: users[0].id,
        statut: Statut.A_FAIRE,
        echeance: new Date('2024-03-20')
      }
    }),

    // Project 3 tasks
    prisma.task.create({
      data: {
        titre: 'Modélisation des données',
        description: 'Créer le schéma Prisma',
        projetId: project3.id,
        assigneA: users[1].id,
        statut: Statut.TERMINE,
        echeance: new Date('2024-02-05')
      }
    }),
    prisma.task.create({
      data: {
        titre: 'Authentification JWT',
        description: 'Implémenter l\'authentification',
        projetId: project3.id,
        assigneA: users[2].id,
        statut: Statut.EN_COURS,
        echeance: new Date('2024-02-28')
      }
    }),
    prisma.task.create({
      data: {
        titre: 'Documentation API',
        description: 'Rédiger la documentation Swagger',
        projetId: project3.id,
        assigneA: users[1].id,
        statut: Statut.A_FAIRE,
        echeance: new Date('2024-03-10')
      }
    })
  ])

  // Create comments
  await Promise.all([
    prisma.commentaire.create({
      data: {
        contenu: 'J\'ai commencé à travailler sur la maquette, voici le lien Figma...',
        taskId: tasks[0].id,
        userId: users[0].id
      }
    }),
    prisma.commentaire.create({
      data: {
        contenu: 'Super travail ! J\'aime beaucoup le design.',
        taskId: tasks[0].id,
        userId: admin.id
      }
    }),
    prisma.commentaire.create({
      data: {
        contenu: 'J\'ai besoin de plus d\'informations sur les spécifications',
        taskId: tasks[1].id,
        userId: users[1].id
      }
    }),
    prisma.commentaire.create({
      data: {
        contenu: 'Je te les envoie dans la journée',
        taskId: tasks[1].id,
        userId: admin.id
      }
    })
  ])

  // Create history entries
  await Promise.all([
    prisma.historiqueTask.create({
      data: {
        taskId: tasks[1].id,
        userId: admin.id,
        action: 'STATUT_CHANGE',
        ancienneValeur: 'A_FAIRE',
        nouvelleValeur: 'EN_COURS'
      }
    }),
    prisma.historiqueTask.create({
      data: {
        taskId: tasks[4].id,
        userId: users[0].id,
        action: 'ASSIGNMENT',
        ancienneValeur: 'null',
        nouvelleValeur: users[2].id
      }
    })
  ])

  console.log('✅ Seeding completed!')
  console.log('📝 Test users:')
  console.log('   Admin: admin@example.com / password123')
  console.log('   John: john.doe@example.com / password123')
  console.log('   Jane: jane.smith@example.com / password123')
  console.log('   Bob: bob.wilson@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })