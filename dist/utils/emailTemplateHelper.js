"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSimpleEmail = exports.sendTemplateEmail = void 0;
const mailer_js_1 = require("./mailer.js");
const sendTemplateEmail = async (payload) => {
    if (!payload.to || (typeof payload.to === 'string' && !payload.to.trim())) {
        console.error('Invalid email recipient');
        return false;
    }
    if (!payload.subject?.trim()) {
        console.error('Email subject is required');
        return false;
    }
    if (!payload.html && !payload.text && !payload.templateId) {
        console.error('Email body required (html, text, or templateId)');
        return false;
    }
    const toArray = Array.isArray(payload.to) ? payload.to : [payload.to];
    const nameArray = Array.isArray(payload.name) ? payload.name : [payload.name || ''];
    const recipients = toArray.map((email, index) => ({
        email,
        name: nameArray[index] || '',
    }));
    return (0, mailer_js_1.sendEmailViaBrevo)({
        to: recipients,
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
        templateId: payload.templateId,
        params: payload.params,
        cc: payload.cc?.map((email) => ({ email })),
        bcc: payload.bcc?.map((email) => ({ email })),
        replyTo: payload.replyTo ? { email: payload.replyTo } : undefined,
        tags: payload.tags,
    });
};
exports.sendTemplateEmail = sendTemplateEmail;
const sendSimpleEmail = (to, subject, text, html) => {
    return (0, mailer_js_1.sendEmail)(to, subject, text, html);
};
exports.sendSimpleEmail = sendSimpleEmail;
exports.default = {
    sendTemplateEmail: exports.sendTemplateEmail,
    sendSimpleEmail: exports.sendSimpleEmail,
};
