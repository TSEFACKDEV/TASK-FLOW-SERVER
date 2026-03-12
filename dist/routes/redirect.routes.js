"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redirect_controller_js_1 = require("../controllers/redirect.controller.js");
const router = express_1.default.Router();
router.get("/annonce/:id", redirect_controller_js_1.redirectProductById);
router.get("/product/:id", redirect_controller_js_1.redirectProductById);
router.get("/user/:id", redirect_controller_js_1.redirectUserById);
router.get("/profile/:id", redirect_controller_js_1.redirectUserById);
router.get("/category/:id", redirect_controller_js_1.redirectCategoryById);
router.get("/city/:id", redirect_controller_js_1.redirectCityById);
exports.default = router;
