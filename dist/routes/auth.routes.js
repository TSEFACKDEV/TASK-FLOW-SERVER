"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const auth_validation_js_1 = require("../validations/auth.validation.js");
const validation_js_1 = __importDefault(require("../middlewares/validation.js"));
const passport_config_js_1 = __importDefault(require("../config/passport.config.js"));
const rateLimiter_js_1 = require("../middlewares/rateLimiter.js");
const router = express_1.default.Router();
router.post("/register", rateLimiter_js_1.authRateLimiter, (0, validation_js_1.default)(auth_validation_js_1.registerSchema), auth_controller_js_1.register);
router.post("/verify-otp", rateLimiter_js_1.authRateLimiter, (0, validation_js_1.default)(auth_validation_js_1.verifyOTPSchema), auth_controller_js_1.verifyOTP);
router.post("/resend-otp", rateLimiter_js_1.authRateLimiter, (0, validation_js_1.default)(auth_validation_js_1.resendOTPSchema), auth_controller_js_1.resendOTP);
router.post("/login", rateLimiter_js_1.authRateLimiter, (0, validation_js_1.default)(auth_validation_js_1.loginSchema), auth_controller_js_1.login);
router.post("/logout", (0, validation_js_1.default)(auth_validation_js_1.logoutSchema), auth_controller_js_1.logout);
router.post("/refresh-token", (0, validation_js_1.default)(auth_validation_js_1.refreshTokenSchema), auth_controller_js_1.refreshToken);
router.post("/forgot-password", rateLimiter_js_1.authRateLimiter, (0, validation_js_1.default)(auth_validation_js_1.forgotPasswordSchema), auth_controller_js_1.forgotPassword);
router.post("/reset-password", rateLimiter_js_1.authRateLimiter, (0, validation_js_1.default)(auth_validation_js_1.resetPasswordSchema), auth_controller_js_1.resetPassword);
router.get("/google", (req, _res, next) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err)
                console.error("Erreur lors de la destruction de session:", err);
        });
    }
    next();
}, (req, res, next) => {
    const sessionId = req.query.sessionId;
    const isMobile = req.query.mobile === 'true';
    const options = {
        scope: ["profile", "email"],
        prompt: "select_account",
    };
    if (isMobile && sessionId) {
        options.state = JSON.stringify({ sessionId, mobile: true });
    }
    passport_config_js_1.default.authenticate("google", options)(req, res, next);
});
router.get("/google/callback", (req, res, next) => {
    passport_config_js_1.default.authenticate("google", {
        session: true,
        failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google_auth_failed`,
    })(req, res, (err) => {
        if (err) {
            console.error("Erreur callback Google:", err);
            return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=auth_failed`);
        }
        next();
    });
}, auth_controller_js_1.googleCallback);
router.get("/session/:sessionId", auth_controller_js_1.getAuthSession);
router.use(auth_middleware_js_1.authenticate);
router.get("/me", auth_controller_js_1.getUserProfile);
exports.default = router;
