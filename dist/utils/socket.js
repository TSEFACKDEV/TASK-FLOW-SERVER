"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSockets = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSockets = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ],
            credentials: true,
            methods: ["GET", "POST"],
        },
        transports: ["websocket", "polling"],
    });
    io.on("connection", (socket) => {
        socket.on("join", (userId) => {
            if (userId) {
                socket.join(userId);
            }
        });
        socket.on("leave", (userId) => {
            if (userId) {
                socket.leave(userId);
            }
        });
        socket.on("disconnect", () => {
        });
    });
    return io;
};
exports.initSockets = initSockets;
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
};
exports.getIO = getIO;
