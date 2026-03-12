"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const seo_controller_js_1 = require("../controllers/seo.controller.js");
const router = express_1.default.Router();
router.get("/sitemap.xml", seo_controller_js_1.generateSitemap);
router.get("/robots.txt", seo_controller_js_1.generateRobotsTxt);
exports.default = router;
