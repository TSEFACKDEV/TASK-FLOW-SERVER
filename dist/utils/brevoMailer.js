"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.sendEmailViaBrevo = void 0;
const axios_1 = __importDefault(require("axios"));
const config_js_1 = __importDefault(require("../config/config.js"));
const logger_js_1 = require("./logger.js");
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const sendEmailViaBrevo = async (options) => {
    try {
        if (!config_js_1.default.brevoApiKey) {
            logger_js_1.logger.error('BREVO_API_KEY not configured');
            return false;
        }
        const toArray = Array.isArray(options.to) ? options.to : [options.to];
        const payload = {
            sender: {
                email: config_js_1.default.brevoFromEmail,
                name: config_js_1.default.brevoFromName,
            },
            to: toArray.map((recipient) => ({
                email: recipient.email,
                name: recipient.name || '',
            })),
            subject: options.subject,
        };
        if (options.templateId) {
            payload.templateId = options.templateId;
            if (options.params) {
                payload.params = options.params;
            }
        }
        else if (options.htmlContent) {
            payload.htmlContent = options.htmlContent;
        }
        else if (options.textContent) {
            payload.textContent = options.textContent;
        }
        else {
            logger_js_1.logger.error('No message body provided (templateId, htmlContent, or textContent required)');
            return false;
        }
        if (options.cc) {
            payload.cc = options.cc.map((recipient) => ({
                email: recipient.email,
                name: recipient.name || '',
            }));
        }
        if (options.bcc) {
            payload.bcc = options.bcc.map((recipient) => ({
                email: recipient.email,
                name: recipient.name || '',
            }));
        }
        if (options.replyTo) {
            payload.replyTo = {
                email: options.replyTo.email,
                name: options.replyTo.name || '',
            };
        }
        if (options.tags && options.tags.length > 0) {
            payload.tags = options.tags;
        }
        const response = await axios_1.default.post(BREVO_API_URL, payload, {
            headers: {
                'api-key': config_js_1.default.brevoApiKey,
                'content-type': 'application/json',
                'accept': 'application/json',
            },
        });
        if (response.status === 201 && response.data.messageId) {
            logger_js_1.logger.info('Email sent successfully via Brevo', {
                messageId: response.data.messageId,
                to: toArray.map((r) => r.email),
                subject: options.subject,
            });
            return true;
        }
        return false;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = error instanceof axios_1.default.AxiosError ? error.response?.data : null;
        logger_js_1.logger.error('Failed to send email via Brevo API', undefined, {
            error: errorMessage,
            details: errorDetails,
        });
        return false;
    }
};
exports.sendEmailViaBrevo = sendEmailViaBrevo;
const sendEmail = async (to, subject, text, html) => {
    return (0, exports.sendEmailViaBrevo)({
        to: { email: to },
        subject,
        htmlContent: html,
        textContent: text,
    });
};
exports.sendEmail = sendEmail;
