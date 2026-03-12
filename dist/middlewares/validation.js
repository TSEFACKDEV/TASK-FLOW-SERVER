"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate = (schema) => async (req, res, next) => {
    try {
        const validatedData = await schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        req.body = validatedData;
        next();
    }
    catch (err) {
        if (process.env.NODE_ENV === "development") {
            console.log("❌ Erreur de validation Yup:", err.message);
            console.log("📄 Champ en erreur:", err.path);
        }
        const errorMessage = err.errors && err.errors.length > 0
            ? err.errors[0]
            : "Données invalides";
        res.status(400).json({
            success: false,
            meta: {
                message: errorMessage,
                errors: err.errors
            }
        });
    }
};
exports.default = validate;
