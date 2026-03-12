"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const env_js_1 = __importDefault(require("./config/env.js"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const prisma_client_js_1 = __importDefault(require("./model/prisma.client.js"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://task-flow-client-chi.vercel.app',
    /^https:\/\/task-flow-client-.*\.vercel\.app$/,
    process.env.CORS_ORIGIN
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });
        if (isAllowed) {
            callback(null, true);
        }
        else {
            console.log('🚫 Origine non autorisée:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('dev'));
app.use('/api', index_js_1.default);
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
app.all('{/*path}', (_req, res) => {
    res.status(404).json({ message: "Route non trouvée" });
});
app.use((err, _req, res, _next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});
const startServer = async () => {
    try {
        await prisma_client_js_1.default.$connect();
        console.log('✅ Database connected successfully');
        const server = app.listen(env_js_1.default.PORT, () => {
            console.log("=========================================");
            console.log(`🚀 Server running on: http://localhost:${env_js_1.default.PORT}`);
            console.log("=========================================");
            console.log(`📝 Environment: ${env_js_1.default.NODE_ENV}`);
        });
        const gracefulShutdown = async () => {
            console.log('\n👋 Received shutdown signal, closing connections...');
            server.close(async () => {
                await prisma_client_js_1.default.$disconnect();
                console.log('✅ Database disconnected');
                process.exit(0);
            });
        };
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
