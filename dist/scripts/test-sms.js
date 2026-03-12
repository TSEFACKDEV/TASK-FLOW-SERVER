"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const techsoft_sms_service_js_1 = __importDefault(require("../services/techsoft-sms.service.js"));
const otp_js_1 = require("../utils/otp.js");
async function testSMS() {
    console.log('🧪 Début du test SMS Techsoft...\n');
    const otp = (0, otp_js_1.generateOTP)();
    console.log('📱 OTP généré:', otp);
    const testPhone = '+237656792837';
    console.log('\n📤 Envoi du SMS de test...');
    console.log('Destinataire:', testPhone);
    console.log('Message OTP:', otp);
    try {
        const result = await techsoft_sms_service_js_1.default.sendOTP(testPhone, otp, 'Test User');
        if (result) {
            console.log('\n✅ SMS envoyé avec succès !');
            console.log('Vérifiez votre téléphone pour recevoir le code:', otp);
        }
        else {
            console.log('\n❌ Échec de l\'envoi du SMS');
            console.log('Vérifiez les logs ci-dessus pour plus de détails');
        }
        console.log('\n\n📤 Test 2: Message personnalisé...');
        const customMessage = `Test BuyAndSale: Votre code est ${otp}`;
        const result2 = await techsoft_sms_service_js_1.default.sendSMS(testPhone, customMessage);
        if (result2) {
            console.log('✅ Message personnalisé envoyé !');
        }
        else {
            console.log('❌ Échec du message personnalisé');
        }
    }
    catch (error) {
        console.error('\n❌ Erreur lors du test:', error.message);
    }
    console.log('\n🏁 Test terminé');
}
testSMS().catch(console.error);
