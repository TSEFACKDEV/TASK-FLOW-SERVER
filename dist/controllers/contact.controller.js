"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContact = void 0;
const mailer_js_1 = require("../utils/mailer.js");
const config_js_1 = __importDefault(require("../config/config.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const response_js_1 = __importDefault(require("../helper/response.js"));
const createContactEmailTemplate_js_1 = require("../templates/createContactEmailTemplate.js");
const createContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Tous les champs sont requis.' });
        }
        const contact = await prisma_client_js_1.default.contact.create({
            data: {
                name,
                email,
                subject,
                message,
            },
        });
        const htmlTemplate = (0, createContactEmailTemplate_js_1.createContactEmailTemplate)(name, email, subject, message);
        await (0, mailer_js_1.sendEmail)(config_js_1.default.brevoFromEmail || 'noreply@buyandsale.cm', `🔔 Nouveau message BuyAndSale : ${subject}`, `Nouveau message de ${name} (${email})\n\nSujet: ${subject}\n\nMessage: ${message}`, htmlTemplate);
        response_js_1.default.success(res, 'Message envoyé avec succès.', contact, 201);
    }
    catch (error) {
        response_js_1.default.error(res, "Erreur lors de l'envoi du message.", error);
    }
};
exports.createContact = createContact;
