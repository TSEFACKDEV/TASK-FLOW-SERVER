"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayServerInfo = displayServerInfo;
exports.getLocalIpAddress = getLocalIpAddress;
const os_1 = __importDefault(require("os"));
function getLocalIpAddress() {
    const interfaces = os_1.default.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const ifaces = interfaces[name];
        if (!ifaces)
            continue;
        for (const iface of ifaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
function displayServerInfo() {
    const localIp = getLocalIpAddress();
    const port = process.env.PORT || 3001;
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║               🚀 SERVEUR BUY&SALE DÉMARRÉ                      ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  📍 Local:      http://localhost:${port}/api/buyandsale         ║`);
    console.log(`║  🌐 Network:    http://${localIp}:${port}/api/buyandsale    ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  📱 CONFIGURATION APP MOBILE:                                  ║');
    console.log(`║  • Android Emulator:  http://10.0.2.2:${port}/api/buyandsale   ║`);
    console.log(`║  • iOS/Physical:      http://${localIp}:${port}/api/buyandsale ║`);
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  INSTRUCTIONS:                                                ║');
    console.log('║  1. Copiez l\'URL Network ci-dessus                            ║');
    console.log('║  2. Collez-la dans buy_and_sale-mobile/.env                   ║');
    console.log('║     API_URL=http://VOTRE_IP:3001/api/buyandsale               ║');
    console.log('║  3. Redémarrez votre app mobile (expo start)                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
}
