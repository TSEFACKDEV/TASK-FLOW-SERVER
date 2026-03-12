"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}
async function checkOrphanPayments() {
    log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║  🔍 VÉRIFICATION DES PAIEMENTS ORPHELINS                 ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
    try {
        const allPayments = await prisma_client_js_1.default.payment.findMany({
            include: {
                product: true,
                user: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        log(`📊 Total des paiements récents: ${allPayments.length}\n`, 'blue');
        const paymentsAnalysis = await Promise.all(allPayments.map(async (payment) => {
            const productForfait = await prisma_client_js_1.default.productForfait.findFirst({
                where: {
                    productId: payment.productId,
                    forfaitId: payment.forfaitId,
                    isActive: true,
                },
                include: {
                    forfait: true,
                },
            });
            return {
                payment,
                hasActiveForfait: !!productForfait,
                forfait: productForfait,
            };
        }));
        const paymentsWithForfaits = paymentsAnalysis.filter((p) => p.hasActiveForfait);
        const orphanPayments = paymentsAnalysis.filter((p) => !p.hasActiveForfait);
        log('✅ Paiements avec forfaits assignés:', 'green');
        paymentsWithForfaits.forEach(({ payment, forfait }) => {
            log(`  - ${payment.id.slice(0, 8)}... | ${forfait?.forfait?.type || 'N/A'} | ${payment.status} | ${payment.amount} FCFA`, 'green');
        });
        if (orphanPayments.length > 0) {
            log('\n⚠️  Paiements SANS forfaits assignés (possibles orphelins):', 'yellow');
            orphanPayments.forEach(({ payment }) => {
                log(`  - ${payment.id.slice(0, 8)}... | ${payment.status} | ${payment.amount} FCFA | Produit: ${payment.product?.name || 'N/A'}`, 'yellow');
                log(`    Créé: ${payment.createdAt.toLocaleString('fr-FR')}`, 'yellow');
            });
        }
        else {
            log('\n✅ Aucun paiement orphelin détecté', 'green');
        }
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  📊 RÉSUMÉ                                               ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
        log(`Total paiements:              ${allPayments.length}`, 'blue');
        log(`Paiements avec forfaits:      ${paymentsWithForfaits.length}`, 'green');
        log(`Paiements orphelins:          ${orphanPayments.length}`, orphanPayments.length > 0 ? 'yellow' : 'green');
        if (orphanPayments.length > 0) {
            log('\n⚠️  Recommandation: Vérifier ces paiements orphelins', 'yellow');
            log('    Cela peut arriver si un forfait a expiré ou été remplacé', 'yellow');
        }
        else {
            log('\n✅ Système propre - Aucun paiement orphelin', 'green');
        }
    }
    catch (error) {
        log(`❌ Erreur: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
    finally {
        await prisma_client_js_1.default.$disconnect();
    }
}
checkOrphanPayments();
