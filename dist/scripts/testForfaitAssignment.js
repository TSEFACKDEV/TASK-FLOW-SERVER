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
async function testForfaitAssignment() {
    try {
        log('\n🚀 Démarrage des tests de gestion des forfaits\n', 'cyan');
        log('📦 Recherche d\'un produit de test...', 'blue');
        const product = await prisma_client_js_1.default.product.findFirst({
            where: { status: 'VALIDATED' },
            include: {
                user: true,
                productForfaits: {
                    where: { isActive: true },
                    include: { forfait: true }
                }
            },
        });
        if (!product) {
            log('❌ Aucun produit trouvé. Créez d\'abord un produit dans la base de données.', 'red');
            return;
        }
        log(`✅ Produit trouvé : "${product.name}" (ID: ${product.id})`, 'green');
        log(`   Forfaits actifs actuels : ${product.productForfaits.map(pf => pf.forfait.type).join(', ') || 'Aucun'}`, 'blue');
        log('\n🔍 TEST 1 : Vérification d\'éligibilité', 'cyan');
        const forfaitTypes = ['PREMIUM', 'TOP_ANNONCE', 'URGENT'];
        for (const type of forfaitTypes) {
            const eligibility = await forfait_service_js_1.default.canAssignForfait(product.id, type);
            if (eligibility.canAssign) {
                log(`   ✅ ${type} : PEUT être assigné`, 'green');
                if (eligibility.conflictingForfaits?.length) {
                    log(`      → Remplacera : ${eligibility.conflictingForfaits.map(f => f.type).join(', ')}`, 'yellow');
                }
            }
            else {
                log(`   ❌ ${type} : NE PEUT PAS être assigné`, 'red');
                log(`      Raison : ${eligibility.reason}`, 'yellow');
            }
        }
        log('\n📝 TEST 2 : Assignation d\'URGENT', 'cyan');
        const result1 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'URGENT', { adminId: product.userId });
        if (result1.success) {
            log('   ✅ URGENT assigné avec succès', 'green');
            log(`      Forfaits désactivés : ${result1.deactivatedCount}`, 'blue');
        }
        else {
            log(`   ❌ Échec : ${result1.error?.message}`, 'red');
        }
        log('\n📝 TEST 3 : Assignation de TOP_ANNONCE (remplace URGENT)', 'cyan');
        const result2 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'TOP_ANNONCE', { adminId: product.userId });
        if (result2.success) {
            log('   ✅ TOP_ANNONCE assigné avec succès', 'green');
            log(`      Forfaits désactivés : ${result2.deactivatedCount}`, 'blue');
        }
        else {
            log(`   ❌ Échec : ${result2.error?.message}`, 'red');
        }
        log('\n📝 TEST 4 : Tentative d\'assignation du même forfait (doublon)', 'cyan');
        const result3 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'TOP_ANNONCE', { adminId: product.userId });
        if (result3.success) {
            log('   ⚠️  ATTENTION : Le doublon a été accepté (comportement incorrect)', 'yellow');
        }
        else {
            log('   ✅ Doublon correctement refusé', 'green');
            log(`      Message : ${result3.error?.message}`, 'blue');
        }
        log('\n📝 TEST 5 : Upgrade vers PREMIUM (remplace TOP_ANNONCE)', 'cyan');
        const result4 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'PREMIUM', { adminId: product.userId });
        if (result4.success) {
            log('   ✅ PREMIUM assigné avec succès', 'green');
            log(`      Forfaits désactivés : ${result4.deactivatedCount}`, 'blue');
        }
        else {
            log(`   ❌ Échec : ${result4.error?.message}`, 'red');
        }
        log('\n📝 TEST 6 : Tentative de downgrade vers URGENT (devrait échouer)', 'cyan');
        const result5 = await forfait_service_js_1.default.assignForfaitSmart(product.id, 'URGENT', { adminId: product.userId });
        if (result5.success) {
            log('   ⚠️  ATTENTION : Le downgrade a été accepté (comportement incorrect)', 'yellow');
        }
        else {
            log('   ✅ Downgrade correctement refusé', 'green');
            log(`      Message : ${result5.error?.message}`, 'blue');
        }
        log('\n📊 ÉTAT FINAL', 'cyan');
        const finalProduct = await prisma_client_js_1.default.product.findUnique({
            where: { id: product.id },
            include: {
                productForfaits: {
                    where: { isActive: true, expiresAt: { gt: new Date() } },
                    include: { forfait: true },
                },
            },
        });
        if (finalProduct?.productForfaits.length) {
            log('   Forfaits actifs :', 'blue');
            finalProduct.productForfaits.forEach(pf => {
                log(`   - ${pf.forfait.type} (expire le ${new Date(pf.expiresAt).toLocaleDateString('fr-FR')})`, 'green');
            });
        }
        else {
            log('   Aucun forfait actif', 'yellow');
        }
        log('\n✅ Tests terminés avec succès\n', 'green');
    }
    catch (error) {
        log(`\n❌ Erreur lors des tests : ${error.message}\n`, 'red');
        console.error(error);
    }
    finally {
        await prisma_client_js_1.default.$disconnect();
    }
}
testForfaitAssignment();
