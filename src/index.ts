import express from 'express';
import cors from 'cors';
import router from './routes/index.js';
import env from './config/env.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import prisma from './model/prisma.client.js';


const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration améliorée
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://task-flow-client-chi.vercel.app',
  /^https:\/\/task-flow-client-.*\.vercel\.app$/, // Accepte toutes les URLs de preview
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origin (comme les apps mobiles ou Postman)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est autorisée
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('🚫 Origine non autorisée:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
// Augmenter les limites du rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute au lieu de 15 minutes
  max: 100, // 100 requêtes par minute
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Routes
app.use('/api', router);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 404 handler - FIXED THIS LINE
app.all('{/*path}', (_req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const server = app.listen(env.PORT, () => {
      console.log("=========================================")
      console.log(`🚀 Server running on: http://localhost:${env.PORT}`);
      console.log("=========================================")

      console.log(`📝 Environment: ${env.NODE_ENV}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\n👋 Received shutdown signal, closing connections...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();