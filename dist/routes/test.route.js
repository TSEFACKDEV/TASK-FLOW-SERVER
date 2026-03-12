"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_client_1 = __importDefault(require("../model/prisma.client"));
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        const result = await prisma_client_1.default.$queryRaw `SELECT 1 as connected`;
        res.json({
            success: true,
            message: 'Database connection is working',
            data: result
        });
    }
    catch (error) {
        console.error('Database test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.default = router;
