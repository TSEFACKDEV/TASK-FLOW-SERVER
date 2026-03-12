"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_js_1 = __importDefault(require("./auth.route.js"));
const project_route_js_1 = __importDefault(require("./project.route.js"));
const task_route_js_1 = __importDefault(require("./task.route.js"));
const user_route_js_1 = __importDefault(require("./user.route.js"));
const test_route_js_1 = __importDefault(require("./test.route.js"));
const router = (0, express_1.Router)();
router.use("/auth", auth_route_js_1.default);
router.use("/projects", project_route_js_1.default);
router.use("/tasks", task_route_js_1.default);
router.use("/users", user_route_js_1.default);
router.use("/test", test_route_js_1.default);
exports.default = router;
