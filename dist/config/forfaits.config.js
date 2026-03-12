"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForfaitConfig = exports.FORFAIT_CONFIG = void 0;
exports.FORFAIT_CONFIG = {
    PREMIUM: {
        type: "PREMIUM",
        priority: 1,
        price: 500,
        duration: 15,
        description: "Regroupe tous les avantages des forfaits",
        badge: {
            label: "premium",
            color: "purple",
            icon: "crown",
            badgeClass: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border border-purple-300 dark:border-purple-700",
        },
        cardBorder: "ring-2 ring-purple-500 dark:ring-purple-400 shadow-lg hover:shadow-xl border-purple-200 dark:border-purple-800",
    },
    TOP_ANNONCE: {
        type: "TOP_ANNONCE",
        priority: 2,
        price: 1500,
        duration: 10,
        description: "Annonce mise en avant en tête de liste",
        badge: {
            label: "top",
            color: "blue",
            icon: "arrow-up",
            badgeClass: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border border-blue-300 dark:border-blue-700",
        },
        cardBorder: "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg hover:shadow-xl border-blue-200 dark:border-blue-800",
    },
    URGENT: {
        type: "URGENT",
        priority: 3,
        price: 2000,
        duration: 7,
        description: "Badge urgent et haute visibilité",
        badge: {
            label: "urgent",
            color: "red",
            icon: "alert",
            badgeClass: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border border-red-300 dark:border-red-700",
        },
        cardBorder: "ring-2 ring-red-500 dark:ring-red-400 shadow-lg hover:shadow-xl border-red-200 dark:border-red-800",
    },
};
const getForfaitConfig = (type) => {
    return exports.FORFAIT_CONFIG[type] || null;
};
exports.getForfaitConfig = getForfaitConfig;
