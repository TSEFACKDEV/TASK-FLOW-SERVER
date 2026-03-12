import { Router } from 'express';
import prisma from '../model/prisma.client';


const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    res.json({ 
      success: true, 
      message: 'Database connection is working',
      data: result 
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;