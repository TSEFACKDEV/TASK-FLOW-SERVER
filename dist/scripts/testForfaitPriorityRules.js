"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const forfait_service_js_1 = __importDefault(require("../services/forfait.service.js"));
const forfaits_config_js_1 = require("../config/forfaits.config.js");
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
        throw new Error('Aucune catégorie ou ville trouvée dans la base de données');
    }
    return await prisma_client_js_1.default.product.create({
        data: {
            name,
            price: 10000,
            quantity: 1,
            description: 'Produit de test pour les règles de forfait',
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
async function testRule1_NoDuplicateForfait() {
    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('📋 TEST 1: Impossible d\'assigner le même forfait deux fois', 'cyan');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');
    try {
        const user = await prisma_client_js_1.default.user.findFirst({ where: { isVerified: true } });
        if (!user)
            throw new Error('Aucun utilisateur trouvé');
        const product = await createTestProduct(user.id, 'Test Règle 1 - Doublon');
        log(`✅ Produit créé: ${product.name} (ID: ${product.id})`, 'green');
        log('\n🔹 Tentative 1: Assigner PREMIUM', 'blue');
        const result1 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', {
            userId: user.id,
            skipNotification: true,
        });
        if (result1.success) {
            log('✅ PREMIUM assigné avec succès', 'green');
        }
        else {
            log(`❌ Échec inattendu: ${result1.error?.message}`, 'red');
            throw new Error('Le premier PREMIUM aurait dû réussir');
        }
        log('\n🔹 Tentative 2: Assigner PREMIUM à nouveau (devrait échouer)', 'blue');
        const result2 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', {
            userId: user.id,
            skipNotification: true,
        });
        if (!result2.success) {
            log(`✅ RÈGLE 1 VALIDÉE: ${result2.error?.message}`, 'green');
        }
        else {
            log('❌ RÈGLE 1 ÉCHOUÉE: Le doublon aurait dû être refusé', 'red');
            throw new Error('La règle 1 n\'est pas respectée');
        }
        await prisma_client_js_1.default.product.delete({ where: { id: product.id } });
        log('\n✅ Test 1 terminé avec succès\n', 'green');
        return true;
    }
    catch (error) {
        log(`❌ Erreur Test 1: ${error.message}`, 'red');
        return false;
    }
}
async function testRule2_HigherPriorityReplaces() {
    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('📋 TEST 2: Forfait de priorité supérieure remplace l\'inférieur', 'cyan');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');
    try {
        const user = await prisma_client_js_1.default.user.findFirst({ where: { isVerified: true } });
        if (!user)
            throw new Error('Aucun utilisateur trouvé');
        const product = await createTestProduct(user.id, 'Test Règle 2 - Remplacement');
        log(`✅ Produit créé: ${product.name} (ID: ${product.id})`, 'green');
        log('\n🔹 Étape 1: Assigner URGENT (priorité 3)', 'blue');
        const result1 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'URGENT', {
            userId: user.id,
            skipNotification: true,
        });
        if (result1.success) {
            log('✅ URGENT assigné avec succès', 'green');
        }
        else {
            log(`❌ Échec inattendu: ${result1.error?.message}`, 'red');
            throw new Error('URGENT aurait dû être assigné');
        }
        log('\n🔹 Étape 2: Assigner PREMIUM (priorité 1) pour remplacer URGENT', 'blue');
        const result2 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', {
            userId: user.id,
            skipNotification: true,
        });
        if (result2.success) {
            log(`✅ RÈGLE 2 VALIDÉE: PREMIUM a remplacé URGENT`, 'green');
            log(`   - Forfaits désactivés: ${result2.deactivatedCount}`, 'green');
            const activeForfaits = await prisma_client_js_1.default.productForfait.findMany({
                where: {
                    productId: product.id,
                    isActive: true,
                    expiresAt: { gt: new Date() },
                },
                include: { forfait: true },
            });
            const premiumActive = activeForfaits.find(pf => pf.forfait.type === 'PREMIUM');
            const urgentActive = activeForfaits.find(pf => pf.forfait.type === 'URGENT');
            if (premiumActive && !urgentActive) {
                log('✅ Vérification: PREMIUM actif, URGENT désactivé', 'green');
            }
            else {
                log('❌ Vérification échouée: État des forfaits incorrect', 'red');
                throw new Error('Les forfaits ne sont pas dans l\'état attendu');
            }
        }
        else {
            log(`❌ RÈGLE 2 ÉCHOUÉE: ${result2.error?.message}`, 'red');
            throw new Error('PREMIUM aurait dû remplacer URGENT');
        }
        await prisma_client_js_1.default.product.delete({ where: { id: product.id } });
        log('\n✅ Test 2 terminé avec succès\n', 'green');
        return true;
    }
    catch (error) {
        log(`❌ Erreur Test 2: ${error.message}`, 'red');
        return false;
    }
}
async function testRule3_CannotAssignLowerPriority() {
    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('📋 TEST 3: Impossible d\'assigner un forfait de priorité inférieure', 'cyan');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');
    try {
        const user = await prisma_client_js_1.default.user.findFirst({ where: { isVerified: true } });
        if (!user)
            throw new Error('Aucun utilisateur trouvé');
        const product = await createTestProduct(user.id, 'Test Règle 3 - Refus');
        log(`✅ Produit créé: ${product.name} (ID: ${product.id})`, 'green');
        log('\n🔹 Étape 1: Assigner PREMIUM (priorité 1)', 'blue');
        const result1 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', {
            userId: user.id,
            skipNotification: true,
        });
        if (result1.success) {
            log('✅ PREMIUM assigné avec succès', 'green');
        }
        else {
            log(`❌ Échec inattendu: ${result1.error?.message}`, 'red');
            throw new Error('PREMIUM aurait dû être assigné');
        }
        log('\n🔹 Étape 2: Tenter d\'assigner URGENT (priorité 3) - devrait échouer', 'blue');
        const result2 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'URGENT', {
            userId: user.id,
            skipNotification: true,
        });
        if (!result2.success) {
            log(`✅ RÈGLE 3 VALIDÉE: ${result2.error?.message}`, 'green');
            const activeForfaits = await prisma_client_js_1.default.productForfait.findMany({
                where: {
                    productId: product.id,
                    isActive: true,
                    expiresAt: { gt: new Date() },
                },
                include: { forfait: true },
            });
            const premiumActive = activeForfaits.find(pf => pf.forfait.type === 'PREMIUM');
            const urgentActive = activeForfaits.find(pf => pf.forfait.type === 'URGENT');
            if (premiumActive && !urgentActive && activeForfaits.length === 1) {
                log('✅ Vérification: PREMIUM toujours actif, URGENT non créé', 'green');
            }
            else {
                log('❌ Vérification échouée: État des forfaits incorrect', 'red');
                throw new Error('Les forfaits ne sont pas dans l\'état attendu');
            }
        }
        else {
            log('❌ RÈGLE 3 ÉCHOUÉE: URGENT n\'aurait pas dû être assigné', 'red');
            throw new Error('La règle 3 n\'est pas respectée');
        }
        log('\n🔹 Étape 3: Tenter d\'assigner TOP_ANNONCE (priorité 2) - devrait aussi échouer', 'blue');
        const result3 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'TOP_ANNONCE', {
            userId: user.id,
            skipNotification: true,
        });
        if (!result3.success) {
            log(`✅ RÈGLE 3 VALIDÉE (bis): ${result3.error?.message}`, 'green');
        }
        else {
            log('❌ RÈGLE 3 ÉCHOUÉE: TOP_ANNONCE n\'aurait pas dû être assigné', 'red');
            throw new Error('La règle 3 n\'est pas respectée');
        }
        await prisma_client_js_1.default.product.delete({ where: { id: product.id } });
        log('\n✅ Test 3 terminé avec succès\n', 'green');
        return true;
    }
    catch (error) {
        log(`❌ Erreur Test 3: ${error.message}`, 'red');
        return false;
    }
}
async function testCompleteScenario() {
    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('📋 TEST COMPLET: Scénario réaliste d\'utilisation', 'cyan');
    log('═══════════════════════════════════════════════════════════\n', 'cyan');
    try {
        const user = await prisma_client_js_1.default.user.findFirst({ where: { isVerified: true } });
        if (!user)
            throw new Error('Aucun utilisateur trouvé');
        const product = await createTestProduct(user.id, 'Test Scénario Complet');
        log(`✅ Produit créé: ${product.name} (ID: ${product.id})`, 'green');
        log('\n📖 Scénario: Achat de TOP_ANNONCE puis upgrade vers PREMIUM', 'yellow');
        log('\n🔹 1. Assigner TOP_ANNONCE (priorité 2)', 'blue');
        const result1 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'TOP_ANNONCE', {
            userId: user.id,
            skipNotification: true,
        });
        log(result1.success ? '✅ TOP_ANNONCE assigné' : `❌ ${result1.error?.message}`, result1.success ? 'green' : 'red');
        log('\n🔹 2. Upgrade vers PREMIUM (priorité 1) - devrait remplacer TOP_ANNONCE', 'blue');
        const result2 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', {
            userId: user.id,
            skipNotification: true,
        });
        log(result2.success ? '✅ PREMIUM assigné et TOP_ANNONCE remplacé' : `❌ ${result2.error?.message}`, result2.success ? 'green' : 'red');
        log('\n🔹 3. Tenter d\'assigner URGENT (priorité 3) - devrait échouer', 'blue');
        const result3 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'URGENT', {
            userId: user.id,
            skipNotification: true,
        });
        log(!result3.success ? '✅ URGENT refusé (priorité inférieure)' : '❌ URGENT ne devrait pas être accepté', !result3.success ? 'green' : 'red');
        log('\n🔹 4. Tenter de réassigner PREMIUM - devrait échouer (doublon)', 'blue');
        const result4 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', {
            userId: user.id,
            skipNotification: true,
        });
        log(!result4.success ? '✅ PREMIUM refusé (doublon)' : '❌ Doublon devrait être refusé', !result4.success ? 'green' : 'red');
        const finalForfaits = await prisma_client_js_1.default.productForfait.findMany({
            where: {
                productId: product.id,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            include: { forfait: true },
        });
        log('\n📊 État final des forfaits:', 'yellow');
        finalForfaits.forEach(pf => {
            log(`   - ${pf.forfait.type} (priorité ${forfaits_config_js_1.FORFAIT_CONFIG[pf.forfait.type].priority})`, 'cyan');
        });
        if (finalForfaits.length === 1 && finalForfaits[0].forfait.type === 'PREMIUM') {
            log('\n✅ Scénario complet validé: Seul PREMIUM est actif', 'green');
        }
        else {
            log('\n❌ Scénario complet échoué: État final incorrect', 'red');
            throw new Error('État final incorrect');
        }
        await prisma_client_js_1.default.product.delete({ where: { id: product.id } });
        log('\n✅ Test scénario complet terminé avec succès\n', 'green');
        return true;
    }
    catch (error) {
        log(`❌ Erreur Test Scénario: ${error.message}`, 'red');
        return false;
    }
}
async function main() {
    log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║  🧪 TEST DES RÈGLES DE PRIORITÉ DES FORFAITS            ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
    log('\n📝 Configuration des forfaits:', 'yellow');
    Object.entries(forfaits_config_js_1.FORFAIT_CONFIG).forEach(([key, config]) => {
        log(`   ${key}: priorité ${config.priority} (${config.price} XAF)`, 'cyan');
    });
    log('   ⚠️  Rappel: Plus le nombre est PETIT, plus la priorité est HAUTE\n', 'yellow');
    const results = {
        rule1: false,
        rule2: false,
        rule3: false,
        complete: false,
    };
    try {
        results.rule1 = await testRule1_NoDuplicateForfait();
        results.rule2 = await testRule2_HigherPriorityReplaces();
        results.rule3 = await testRule3_CannotAssignLowerPriority();
        results.complete = await testCompleteScenario();
        log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
        log('║  📊 RÉSUMÉ DES TESTS                                     ║', 'cyan');
        log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
        const allPassed = Object.values(results).every(r => r === true);
        log(`Règle 1 (Pas de doublon):           ${results.rule1 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`, results.rule1 ? 'green' : 'red');
        log(`Règle 2 (Remplacement priorité):    ${results.rule2 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`, results.rule2 ? 'green' : 'red');
        log(`Règle 3 (Refus priorité infér.):    ${results.rule3 ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`, results.rule3 ? 'green' : 'red');
        log(`Scénario complet:                   ${results.complete ? '✅ PASSÉ' : '❌ ÉCHOUÉ'}`, results.complete ? 'green' : 'red');
        log('\n' + '═'.repeat(60), 'cyan');
        if (allPassed) {
            log('✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!', 'green');
        }
        else {
            log('❌ CERTAINS TESTS ONT ÉCHOUÉ', 'red');
            process.exit(1);
        }
        log('═'.repeat(60) + '\n', 'cyan');
    }
    catch (error) {
        log(`\n❌ Erreur fatale: ${error.message}`, 'red');
        process.exit(1);
    }
    finally {
        await prisma_client_js_1.default.$disconnect();
    }
}
main();
