"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isDebugEnabled = process.env.DEBUG === 'true';
        this.payment = {
            info: (message, context) => this.info(`💳 Payment: ${message}`, context),
            error: (message, error, context) => this.error(`💳 Payment Error: ${message}`, error, context),
        };
        this.security = {
            info: (message, context) => this.info(`🔒 Security: ${message}`, context),
            warn: (message, context) => this.warn(`🔒 Security: ${message}`, context),
            error: (message, error, context) => this.error(`🔒 Security Error: ${message}`, error, context),
        };
        this.database = {
            info: (message, context) => this.info(`🗄️ Database: ${message}`, context),
            error: (message, error, context) => this.error(`🗄️ Database Error: ${message}`, error, context),
        };
        this.upload = {
            info: (message, context) => this.info(`📁 Upload: ${message}`, context),
            error: (message, error, context) => this.error(`📁 Upload Error: ${message}`, error, context),
        };
        this.sms = {
            info: (message, context) => this.info(`📱 SMS: ${message}`, context),
            error: (message, error, context) => this.error(`📱 SMS Error: ${message}`, error, context),
        };
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const emoji = this.getEmoji(level);
        let logMessage = `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}`;
        if (context && Object.keys(context).length > 0) {
            logMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
        }
        return logMessage;
    }
    getEmoji(level) {
        switch (level) {
            case 'debug': return '🔍';
            case 'info': return 'ℹ️';
            case 'warn': return '⚠️';
            case 'error': return '❌';
            default: return '📝';
        }
    }
    shouldLog(level) {
        if (level === 'error')
            return true;
        if (level === 'warn')
            return true;
        if (level === 'debug')
            return this.isDevelopment && this.isDebugEnabled;
        return this.isDevelopment;
    }
    debug(message, context) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, context));
        }
    }
    error(message, error, context) {
        const errorContext = {
            ...context,
            ...(error instanceof Error && {
                errorMessage: error.message,
                errorStack: this.isDevelopment ? error.stack : undefined,
            }),
        };
        if (error && typeof error === 'object' && error !== null && !(error instanceof Error)) {
            errorContext.errorDetails = error;
        }
        console.error(this.formatMessage('error', message, errorContext));
    }
}
exports.logger = new Logger();
exports.default = exports.logger;
