"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const techsoft_sms_service_1 = __importDefault(require("../services/techsoft-sms.service"));
const otp_1 = require("../utils/otp");
async function testOTPFormat() {
    console.log('🧪 ========================================');
    console.log('🧪 TEST ENVOI OTP - Format XXX-XXX');
    console.log('🧪 ========================================\n');
    console.log('📝 Test 1: Génération OTP');
    const otp1 = (0, otp_1.generateOTP)();
    const otp2 = (0, otp_1.generateOTP)();
    const otp3 = (0, otp_1.generateOTP)();
    console.log('✅ OTP générés:');
    console.log('   - OTP 1:', otp1);
    console.log('   - OTP 2:', otp2);
    console.log('   - OTP 3:', otp3);
    const otpRegex = /^\d{3}-\d{3}$/;
    console.log('   - Format valide (XXX-XXX)?', otpRegex.test(otp1) ? '✅ OUI' : '❌ NON');
    console.log('');
    console.log('📱 Test 2: Envoi SMS de test');
    console.log('⚠️  ATTENTION: Remplacez +237690985805 par votre numéro pour tester\n');
    const testPhone = '+237690985805';
    const testOTP = (0, otp_1.generateOTP)();
    console.log('📤 Tentative d\'envoi OTP:', testOTP);
    console.log('📞 Destinataire:', testPhone);
    console.log('');
    try {
        const result = await techsoft_sms_service_1.default.sendOTP(testPhone, testOTP, 'Test User');
        if (result) {
            console.log('✅ SMS ENVOYÉ AVEC SUCCÈS !');
            console.log('📱 Vérifiez votre téléphone pour le code:', testOTP);
        }
        else {
            console.log('❌ ÉCHEC DE L\'ENVOI DU SMS');
            console.log('⚠️  Vérifiez:');
            console.log('   1. Votre API_TOKEN dans le .env');
            console.log('   2. Votre SMS_SENDER_ID dans le .env');
            console.log('   3. Les logs ci-dessus pour plus de détails');
        }
    }
    catch (error) {
        console.error('❌ ERREUR LORS DU TEST:', error.message);
    }
    console.log('\n🧪 ========================================');
    console.log('🧪 FIN DES TESTS');
    console.log('🧪 ========================================');
}
testOTPFormat()
    .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
});
