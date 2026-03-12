"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const forfait_service_js_1 = __importDefault(require("../services/forfait.service.js"));
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
async function createTestProduct(userId, name) {
    const category = await prisma_client_js_1.default.category.findFirst();
    const city = await prisma_client_js_1.default.city.findFirst();
    if (!category || !city) {
        throw new Error('Aucune catégorie ou ville trouvée');
    }
    return await prisma_client_js_1.default.product.create({
        data: {
            name,
            price: 10000,
            quantity: 1,
            description: 'Produit de test pour blocage pré-paiement',
            images: ['test.jpg'],
            categoryId: category.id,
            cityId: city.id,
            userId,
            etat: 'NEUF',
            telephone: '237612345678',
            status: 'VALIDATED',
        },
    });
}
async function testPrePaymentBlocking() {
    log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║  🧪 TEST BLOCAGE PRÉ-PAIEMENT                            ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
    try {
        const user = await prisma_client_js_1.default.user.findFirst({ where: { isVerified: true } });
        if (!user)
            throw new Error('Aucun utilisateur trouvé');
        const product = await createTestProduct(user.id, 'Test Blocage Pré-Paiement');
        log(`✅ Produit créé: ${product.name} (ID: ${product.id})`, 'green');
        log('\n📝 TEST 1: Assigner PREMIUM pour la première fois', 'blue');
        const check1 = await forfait_service_js_1.default.canAssignForfait(product.id, 'PREMIUM');
        log(`Résultat: ${check1.canAssign ? '✅ Autorisé' : '❌ Bloqué'}`, check1.canAssign ? 'green' : 'red');
        if (check1.canAssign) {
            const result1 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', {
                userId: user.id,
                skipNotification: true,
            });
            if (result1.success) {
                log('✅ PREMIUM assigné', 'green');
            }
        }
        log('\n📝 TEST 2: Tenter de réassigner PREMIUM (doublon)', 'blue');
        const check2 = await forfait_service_js_1.default.canAssignForfait(product.id, 'PREMIUM');
        log(`Résultat: ${check2.canAssign ? '❌ ERREUR - Devrait être bloqué' : '✅ BLOQUÉ CORRECTEMENT'}`, check2.canAssign ? 'red' : 'green');
        if (!check2.canAssign) {
            log(`Raison: ${check2.reason}`, 'yellow');
        }
        log('\n📝 TEST 3: Tenter d\'assigner URGENT (priorité inférieure)', 'blue');
        const check3 = await forfait_service_js_1.default.canAssignForfait(product.id, 'URGENT');
        log(`Résultat: ${check3.canAssign ? '❌ ERREUR - Devrait être bloqué' : '✅ BLOQUÉ CORRECTEMENT'}`, check3.canAssign ? 'red' : 'green');
        if (!check3.canAssign) {
            log(`Raison: ${check3.reason}`, 'yellow');
        }
        await prisma_client_js_1.default.product.delete({ where: { id: product.id } });
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  📊 RÉSUMÉ DU TEST                                       ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
        const test1Pass = check1.canAssign;
        const test2Pass = !check2.canAssign;
        const test3Pass = !check3.canAssign;
        log(`Test 1 (Premier forfait):     ${test1Pass ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`, test1Pass ? 'green' : 'red');
        log(`Test 2 (Doublon bloqué):       ${test2Pass ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`, test2Pass ? 'green' : 'red');
        log(`Test 3 (Downgrade bloqué):     ${test3Pass ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`, test3Pass ? 'green' : 'red');
        log('\n' + '═'.repeat(60), 'cyan');
        if (test1Pass && test2Pass && test3Pass) {
            log('✅ TOUS LES BLOCAGES PRÉ-PAIEMENT FONCTIONNENT !', 'green');
            log('✅ Les paiements ne seront PAS initialisés si les règles sont violées', 'green');
        }
        else {
            log('❌ CERTAINS TESTS ONT ÉCHOUÉ', 'red');
            process.exit(1);
        }
        log('═'.repeat(60) + '\n', 'cyan');
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
testPrePaymentBlocking();
