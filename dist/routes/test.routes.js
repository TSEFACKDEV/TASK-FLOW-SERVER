"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const os_1 = __importDefault(require("os"));
const router = express_1.default.Router();
router.get("/ping", (_req, res) => {
    const networkInterfaces = os_1.default.networkInterfaces();
    const localIPs = [];
    Object.keys(networkInterfaces).forEach((key) => {
        networkInterfaces[key]?.forEach((iface) => {
            if (iface.family === "IPv4" && !iface.internal) {
                localIPs.push(iface.address);
            }
        });
    });
    res.status(200).json({
        status: "OK",
        message: "✅ Serveur accessible avec succès!",
        timestamp: new Date().toISOString(),
        server: {
            hostname: os_1.default.hostname(),
            platform: os_1.default.platform(),
            localIPs,
            uptime: process.uptime(),
        },
        connection: {
            from: _req.ip,
            userAgent: _req.get("user-agent"),
        },
    });
});
router.get("/diagnostic", (req, res) => {
    res.status(200).json({
        server: {
            nodeVersion: process.version,
            environment: process.env.NODE_ENV,
            port: process.env.PORT || 3001,
            hostname: os_1.default.hostname(),
        },
        request: {
            ip: req.ip,
            ips: req.ips,
            headers: req.headers,
            protocol: req.protocol,
            method: req.method,
            url: req.url,
            baseUrl: req.baseUrl,
        },
        timestamp: new Date().toISOString(),
    });
});
router.get("/health", (_req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
