"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugForfaitPayment = void 0;
const debugForfaitPayment = (req, _res, next) => {
    console.log('🔍 =========================');
    console.log('🔍 DEBUG FORFAIT PAYMENT');
    console.log('🔍 =========================');
    console.log('📍 URL:', req.originalUrl);
    console.log('📍 Method:', req.method);
    console.log('📍 Headers:', {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Bearer ***' : 'Non fourni',
        'user-agent': req.headers['user-agent']?.substring(0, 50)
    });
    console.log('📍 Body Keys:', Object.keys(req.body));
    console.log('📍 Body Values:', {
        productId: req.body.productId || 'MANQUANT',
        forfaitType: req.body.forfaitType || 'MANQUANT',
        phoneNumber: req.body.phoneNumber ? req.body.phoneNumber.substring(0, 6) + '***' : 'MANQUANT',
        paymentMethod: req.body.paymentMethod || 'MANQUANT'
    });
    console.log('📍 Params:', req.params);
    console.log('📍 Query:', req.query);
    console.log('📍 User Auth:', req.authUser ? { id: req.authUser.id, email: req.authUser.email } : 'NON AUTHENTIFIÉ');
    console.log('🔍 =========================');
    next();
};
exports.debugForfaitPayment = debugForfaitPayment;
exports.default = exports.debugForfaitPayment;
