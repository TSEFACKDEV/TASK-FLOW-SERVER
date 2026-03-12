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
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
function validateBrevoConfig() {
    if (!config_js_1.default.brevoApiKey) {
        const message = 'BREVO_API_KEY is not configured. Email sending will fail.';
        logger_js_1.logger.warn(message);
        if (config_js_1.default.NODE_ENV === 'production') {
            throw new Error(message);
        }
    }
}
validateBrevoConfig();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function buildBrevoPayload(options) {
    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const payload = {
        sender: {
            email: config_js_1.default.brevoFromEmail,
            name: config_js_1.default.brevoFromName,
        },
        to: toArray.map((recipient) => {
            const toObj = { email: recipient.email };
            if (recipient.name?.trim()) {
                toObj.name = recipient.name;
            }
            return toObj;
        }),
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
        throw new Error('No message body provided (templateId, htmlContent, or textContent required)');
    }
    if (options.cc?.length) {
        payload.cc = options.cc.map((recipient) => {
            const ccObj = { email: recipient.email };
            if (recipient.name?.trim()) {
                ccObj.name = recipient.name;
            }
            return ccObj;
        });
    }
    if (options.bcc?.length) {
        payload.bcc = options.bcc.map((recipient) => {
            const bccObj = { email: recipient.email };
            if (recipient.name?.trim()) {
                bccObj.name = recipient.name;
            }
            return bccObj;
        });
    }
    if (options.replyTo) {
        payload.replyTo = { email: options.replyTo.email };
        if (options.replyTo.name?.trim()) {
            payload.replyTo.name = options.replyTo.name;
        }
    }
    if (options.tags?.length) {
        payload.tags = options.tags;
    }
    return payload;
}
const sendEmailViaBrevo = async (options, retryCount = 0) => {
    try {
        if (!config_js_1.default.brevoApiKey) {
            logger_js_1.logger.error('BREVO_API_KEY not configured');
            return false;
        }
        const payload = buildBrevoPayload(options);
        const response = await axios_1.default.post(BREVO_API_URL, payload, {
            headers: {
                'api-key': config_js_1.default.brevoApiKey,
                'content-type': 'application/json',
                'accept': 'application/json',
            },
        });
        if (response.status === 201 && response.data.messageId) {
            const toEmails = Array.isArray(options.to)
                ? options.to.map((r) => r.email)
                : [options.to.email];
            logger_js_1.logger.info('Email sent successfully via Brevo', {
                messageId: response.data.messageId,
                to: toEmails,
                subject: options.subject,
            });
            return true;
        }
        logger_js_1.logger.warn('Unexpected Brevo response', {
            status: response.status,
            data: response.data,
        });
        return false;
    }
    catch (error) {
        const axiosError = error;
        const errorMessage = axiosError.message || 'Unknown error';
        const statusCode = axiosError.response?.status;
        const errorDetails = axiosError.response?.data;
        const isRetryable = statusCode && (statusCode >= 500 || statusCode === 429);
        if (isRetryable && retryCount < MAX_RETRIES) {
            logger_js_1.logger.warn(`Retrying email send (${retryCount + 1}/${MAX_RETRIES})`, {
                statusCode,
                error: errorMessage,
            });
            await delay(RETRY_DELAY * Math.pow(2, retryCount));
            return (0, exports.sendEmailViaBrevo)(options, retryCount + 1);
        }
        logger_js_1.logger.error('Failed to send email via Brevo API', undefined, {
            error: errorMessage,
            statusCode,
            details: errorDetails,
            retryCount,
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
