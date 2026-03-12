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
    magenta: '\x1b[35m',
};
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}
function logCheck(message, status) {
    const symbols = { success: '✅', warning: '⚠️', error: '❌' };
    const statusColors = { success: 'green', warning: 'yellow', error: 'red' };
    log(`${symbols[status]} ${message}`, statusColors[status]);
}
async function validateForfaitOptimization() {
    try {
        log('\n🔍 VALIDATION DE L\'OPTIMISATION DES FORFAITS\n', 'cyan');
        let successCount = 0;
        let warningCount = 0;
        let errorCount = 0;
        log('📋 VÉRIFICATION DE LA CONFIGURATION', 'magenta');
        const expectedPriorities = {
            PREMIUM: 1,
            TOP_ANNONCE: 2,
            URGENT: 3
        };
        let configValid = true;
        for (const [type, expectedPriority] of Object.entries(expectedPriorities)) {
            const config = forfaits_config_js_1.FORFAIT_CONFIG[type];
            if (config.priority === expectedPriority) {
                logCheck(`Priorité ${type}: ${config.priority} (correct)`, 'success');
                successCount++;
            }
            else {
                logCheck(`Priorité ${type}: ${config.priority} (attendu: ${expectedPriority})`, 'error');
                errorCount++;
                configValid = false;
            }
        }
        log('\n🔧 VÉRIFICATION DES MÉTHODES', 'magenta');
        if (typeof forfait_service_js_1.default.assignForfaitSmart === 'function') {
            logCheck('Méthode assignForfaitSmart existe', 'success');
            successCount++;
        }
        else {
            logCheck('Méthode assignForfaitSmart manquante', 'error');
            errorCount++;
        }
        if (typeof forfait_service_js_1.default.canAssignForfait === 'function') {
            logCheck('Méthode canAssignForfait existe', 'success');
            successCount++;
        }
        else {
            logCheck('Méthode canAssignForfait manquante', 'error');
            errorCount++;
        }
        log('\n🗄️  VÉRIFICATION DE LA BASE DE DONNÉES', 'magenta');
        try {
            await prisma_client_js_1.default.$queryRaw `SELECT 1`;
            logCheck('Connexion à la base de données OK', 'success');
            successCount++;
        }
        catch (error) {
            logCheck('Erreur de connexion à la base de données', 'error');
            errorCount++;
        }
        try {
            await prisma_client_js_1.default.productForfait.findFirst();
            logCheck('Table ProductForfait existe', 'success');
            successCount++;
        }
        catch (error) {
            logCheck('Table ProductForfait introuvable', 'error');
            errorCount++;
        }
        try {
            const indexes = await prisma_client_js_1.default.$queryRaw `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'ProductForfait'
        AND indexname LIKE '%productId%' OR indexname LIKE '%isActive%'
      `;
            const expectedIndexes = [
                'ProductForfait_productId_isActive_expiresAt_idx',
                'ProductForfait_isActive_expiresAt_idx',
                'ProductForfait_productId_forfaitId_isActive_idx'
            ];
            const foundIndexes = indexes.map((idx) => idx.indexname);
            for (const expectedIndex of expectedIndexes) {
                if (foundIndexes.includes(expectedIndex)) {
                    logCheck(`Index ${expectedIndex} trouvé`, 'success');
                    successCount++;
                }
                else {
                    logCheck(`Index ${expectedIndex} manquant`, 'warning');
                    warningCount++;
                }
            }
        }
        catch (error) {
            logCheck(`Erreur lors de la vérification des index: ${error.message}`, 'warning');
            warningCount++;
        }
        log('\n🧪 TESTS FONCTIONNELS', 'magenta');
        const testProduct = await prisma_client_js_1.default.product.findFirst({
            where: { status: 'VALIDATED' },
            include: {
                productForfaits: {
                    where: { isActive: true },
                    include: { forfait: true }
                }
            }
        });
        if (testProduct) {
            logCheck(`Produit de test trouvé: "${testProduct.name}"`, 'success');
            successCount++;
            try {
                const eligibilityPremium = await forfait_service_js_1.default.canAssignForfait(testProduct.id, 'PREMIUM');
                if (typeof eligibilityPremium.canAssign === 'boolean') {
                    logCheck('canAssignForfait retourne un résultat valide', 'success');
                    successCount++;
                    log(`   → PREMIUM peut être assigné: ${eligibilityPremium.canAssign}`, 'blue');
                    if (eligibilityPremium.reason) {
                        log(`   → Raison: ${eligibilityPremium.reason}`, 'blue');
                    }
                }
                else {
                    logCheck('canAssignForfait retourne un format invalide', 'error');
                    errorCount++;
                }
            }
            catch (error) {
                logCheck(`Erreur canAssignForfait: ${error.message}`, 'error');
                errorCount++;
            }
            if (testProduct.productForfaits.length > 0) {
                logCheck(`Forfaits actifs trouvés: ${testProduct.productForfaits.length}`, 'success');
                successCount++;
                testProduct.productForfaits.forEach(pf => {
                    const config = forfaits_config_js_1.FORFAIT_CONFIG[pf.forfait.type];
                    log(`   → ${pf.forfait.type} (priorité ${config.priority})`, 'blue');
                });
            }
            else {
                logCheck('Aucun forfait actif sur le produit de test', 'warning');
                warningCount++;
            }
        }
        else {
            logCheck('Aucun produit de test disponible', 'warning');
            warningCount++;
        }
        log('\n🔒 VÉRIFICATION DE L\'INTÉGRITÉ', 'magenta');
        const duplicates = await prisma_client_js_1.default.$queryRaw `
      SELECT 
        "productId", 
        "forfaitId", 
        COUNT(*) as count
      FROM "ProductForfait"
      WHERE "isActive" = true
        AND "expiresAt" > NOW()
      GROUP BY "productId", "forfaitId"
      HAVING COUNT(*) > 1
    `;
        if (duplicates.length === 0) {
            logCheck('Aucun doublon détecté (excellent !)', 'success');
            successCount++;
        }
        else {
            logCheck(`${duplicates.length} doublon(s) détecté(s) - À corriger !`, 'error');
            errorCount++;
            duplicates.forEach(d => {
                log(`   → Produit ${d.productId.substring(0, 8)}... - Forfait dupliqué`, 'red');
            });
        }
        const expiredActive = await prisma_client_js_1.default.productForfait.count({
            where: {
                isActive: true,
                expiresAt: { lte: new Date() }
            }
        });
        if (expiredActive === 0) {
            logCheck('Aucun forfait expiré actif (bon nettoyage)', 'success');
            successCount++;
        }
        else {
            logCheck(`${expiredActive} forfait(s) expiré(s) encore actif(s)`, 'warning');
            warningCount++;
            log('   → Exécuter ForfaitService.checkAndManageExpiringForfaits()', 'yellow');
        }
        log('\n' + '='.repeat(60), 'cyan');
        log('📊 RÉSUMÉ DE LA VALIDATION', 'cyan');
        log('='.repeat(60), 'cyan');
        logCheck(`Tests réussis: ${successCount}`, 'success');
        if (warningCount > 0) {
            logCheck(`Avertissements: ${warningCount}`, 'warning');
        }
        if (errorCount > 0) {
            logCheck(`Erreurs: ${errorCount}`, 'error');
        }
        log('');
        const total = successCount + warningCount + errorCount;
        const score = Math.round((successCount / total) * 100);
        if (score >= 90) {
            log(`🎉 SCORE: ${score}% - EXCELLENT ! Système prêt pour la production.`, 'green');
        }
        else if (score >= 70) {
            log(`👍 SCORE: ${score}% - BON. Quelques ajustements recommandés.`, 'yellow');
        }
        else {
            log(`⚠️  SCORE: ${score}% - ATTENTION. Des corrections sont nécessaires.`, 'red');
        }
        log('');
        if (warningCount > 0 || errorCount > 0) {
            log('📌 RECOMMANDATIONS:', 'cyan');
            if (errorCount > 0) {
                log('   1. Corriger les erreurs critiques listées ci-dessus', 'red');
            }
            if (warningCount > 0) {
                log('   2. Vérifier les avertissements', 'yellow');
            }
            if (expiredActive > 0) {
                log('   3. Nettoyer les forfaits expirés', 'yellow');
            }
            if (duplicates.length > 0) {
                log('   4. Résoudre les doublons détectés', 'red');
            }
        }
        log('\n✅ Validation terminée.\n', 'green');
    }
    catch (error) {
        log(`\n❌ Erreur fatale : ${error.message}\n`, 'red');
        console.error(error);
    }
    finally {
        await prisma_client_js_1.default.$disconnect();
    }
}
validateForfaitOptimization();
