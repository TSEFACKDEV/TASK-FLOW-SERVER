"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = exports.sendSMS = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config/config"));
class TechsoftSmsService {
    constructor() {
        this.apiUrl = 'https://app.techsoft-sms.com/api/http/sms/send';
        this.apiToken = config_1.default.techsoftApiToken;
        this.senderId = config_1.default.techsoftSenderId;
        if (!this.apiToken) {
            throw new Error('🔴 TECHSOFT_API_TOKEN manquant dans la configuration');
        }
        if (!this.senderId) {
            throw new Error('🔴 TECHSOFT_SENDER_ID manquant dans la configuration');
        }
    }
    formatPhoneNumber(phone) {
        let cleanPhone = phone.replace(/[^\d+]/g, '');
        cleanPhone = cleanPhone.replace(/\++/g, '+');
        if (cleanPhone.startsWith('+')) {
            if (cleanPhone.startsWith('+0')) {
                cleanPhone = '+237' + cleanPhone.substring(2);
            }
            else if (!cleanPhone.startsWith('+237')) {
                cleanPhone = '+237' + cleanPhone.substring(1);
            }
        }
        else {
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '+237' + cleanPhone.substring(1);
            }
            else if (!cleanPhone.startsWith('237')) {
                cleanPhone = '+237' + cleanPhone;
            }
            else {
                cleanPhone = '+' + cleanPhone;
            }
        }
        console.log('📞 [FormatPhone] Original:', phone, '→ Formaté:', cleanPhone);
        return cleanPhone;
    }
    async sendSMS(phone, message, options) {
        try {
            if (!phone || !message) {
                console.error('❌ [TechsoftSMS] Paramètres manquants:', { phone: !!phone, message: !!message });
                return false;
            }
            const formattedPhone = this.formatPhoneNumber(phone);
            console.log('📤 [TechsoftSMS] Envoi SMS:', {
                destinataire: formattedPhone,
                messageLength: message.length
            });
            const payload = {
                api_token: this.apiToken,
                recipient: formattedPhone,
                sender_id: this.senderId,
                type: 'plain',
                message: message
            };
            if (options?.scheduleTime) {
                payload.schedule_time = options.scheduleTime;
            }
            const response = await axios_1.default.post(this.apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000
            });
            console.log('📨 [TechsoftSMS] Réponse API:', response.data);
            if (response.data.status === 'success') {
                console.log('✅ SMS envoyé avec succès à', formattedPhone);
                return true;
            }
            else {
                console.error('❌ Échec envoi SMS:', response.data);
                return false;
            }
        }
        catch (error) {
            console.error('❌ Erreur lors de l\'envoi SMS:', {
                message: error.message,
                response: error.response?.data
            });
            return false;
        }
    }
    async sendOTP(phone, otp, userName) {
        const message = userName
            ? `Bonjour ${userName}, validez votre compte BuyAndSale avec le code ${otp}. Expire dans 10 min.`
            : `Validez votre compte BuyAndSale avec le code ${otp}. Ce code expire dans 10 minutes.`;
        console.log('🔐 [SendOTP] Envoi OTP:', { phone, otp, userName });
        return this.sendSMS(phone, message);
    }
}
const techsoftSmsService = new TechsoftSmsService();
exports.default = techsoftSmsService;
exports.sendSMS = techsoftSmsService.sendSMS.bind(techsoftSmsService);
exports.sendOTP = techsoftSmsService.sendOTP.bind(techsoftSmsService);
