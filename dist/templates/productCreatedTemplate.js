"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductCreatedTemplate = createProductCreatedTemplate;
function createProductCreatedTemplate({ firstName, lastName, productName, productPrice, productId, productLink, }) {
    const displayName = firstName ? `${firstName} ${lastName}` : lastName;
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre annonce a été créée - BuyAndSale</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: white;
            border-radius: 50%;
            padding: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .header-subtitle {
            font-size: 14px;
            opacity: 0.95;
        }
        .content {
            padding: 50px 40px;
        }
        .greeting {
            font-size: 24px;
            color: #2d3748;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .message-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
        }
        .success-icon {
            color: #10b981;
            font-size: 20px;
            margin-right: 10px;
        }
        .product-details {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .product-details h3 {
            color: #2d3748;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
        }
        .product-info {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .product-info:last-child {
            border-bottom: none;
        }
        .product-label {
            color: #718096;
            font-weight: 500;
        }
        .product-value {
            color: #2d3748;
            font-weight: 600;
        }
        .validity-section {
            background: linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .validity-title {
            color: #d97706;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .validity-icon {
            font-size: 22px;
            margin-right: 10px;
        }
        .validity-item {
            color: #92400e;
            font-size: 14px;
            margin-bottom: 12px;
            line-height: 1.6;
            display: flex;
            align-items: flex-start;
        }
        .validity-item-icon {
            margin-right: 10px;
            margin-top: 2px;
            flex-shrink: 0;
        }
        .validity-item strong {
            font-weight: 600;
        }
        .renewal-highlight {
            background: #fef3c7;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            border-left: 4px solid #d97706;
        }
        .renewal-text {
            color: #92400e;
            font-size: 14px;
            line-height: 1.6;
        }
        .renewal-text strong {
            color: #d97706;
            font-weight: 700;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 14px 40px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 30px;
            transition: all 0.3s ease;
        }
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }
        .next-steps {
            background: #f0fdf4;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .next-steps h3 {
            color: #10b981;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
        }
        .steps-list {
            list-style: none;
        }
        .steps-list li {
            color: #2d3748;
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
            font-size: 14px;
            line-height: 1.6;
        }
        .steps-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 12px;
        }
        .footer-links {
            margin: 15px 0;
        }
        .footer-link {
            color: #a0aec0;
            text-decoration: none;
            margin: 0 10px;
        }
        .footer-link:hover {
            color: white;
        }
        .divider {
            height: 2px;
            background: linear-gradient(90deg, #10b981, #059669, #10b981);
        }
        .support-banner {
            background: #e0f2fe;
            border: 1px solid #7dd3fc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #0369a1;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 30px 20px; }
            .validity-section { padding: 20px; }
            .header { padding: 30px 20px; }
            .header h1 { font-size: 24px; }
            .greeting { font-size: 20px; }
            .product-info { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ffffff" stroke="#ffffff" stroke-width="0.5"/>
                </svg>
            </div>
            <h1>🎉 Annonce créée avec succès!</h1>
            <p class="header-subtitle">Votre produit est maintenant en ligne</p>
        </div>

        <div class="divider"></div>

        <div class="content">
            <div class="greeting">
                Bonjour ${displayName},
            </div>

            <div class="message-box">
                <span class="success-icon">✅</span>
                <span>Excellent! Votre annonce <strong>"${productName}"</strong> a été créée avec succès et est en attente de validation. Elle sera visible à tous les utilisateurs après validation par notre équipe.</span>
            </div>

            <!-- Détails du produit -->
            <div class="product-details">
                <h3>Détails de votre annonce</h3>
                <div class="product-info">
                    <span class="product-label">Produit</span>
                    <span class="product-value">${productName}</span>
                </div>
                <div class="product-info">
                    <span class="product-label">Prix</span>
                    <span class="product-value">${productPrice.toLocaleString('fr-FR')} XAF</span>
                </div>
                <div class="product-info">
                    <span class="product-label">ID Annonce</span>
                    <span class="product-value">${productId.substring(0, 8)}...</span>
                </div>
            </div>

            <!-- Section validité + renouvellement -->
            <div class="validity-section">
                <div class="validity-title">
                    <span class="validity-icon">⏰</span>
                    Durée de validité et renouvellement
                </div>

                <div class="validity-item">
                    <span class="validity-item-icon">📅</span>
                    <div>
                        <strong>Validité de 60 jours:</strong> Votre annonce restera en ligne pendant 60 jours à partir de sa création.
                    </div>
                </div>

                <div class="validity-item">
                    <span class="validity-item-icon">⏳</span>
                    <div>
                        <strong>Après expiration:</strong> Une fois les 60 jours passés, votre annonce expirera automatiquement et ne sera plus visible publiquement.
                    </div>
                </div>

                <div class="renewal-highlight">
                    <div class="renewal-text">
                        <span class="validity-item-icon" style="display: inline;">🔄</span>
                        <strong>Renouvellement gratuit:</strong> Vous pouvez renouveler votre annonce <strong>gratuitement et un nombre illimité de fois</strong> tant que votre produit n'a pas été vendu! Procédez simplement à un nouveau renouvellement depuis votre tableau de bord pour 60 jours supplémentaires.
                    </div>
                </div>
            </div>

            <!-- Prochaines étapes -->
            <div class="next-steps">
                <h3>Prochaines étapes</h3>
                <ul class="steps-list">
                    <li><strong>Validation:</strong> Notre équipe de modération examinera votre annonce (24-48h)</li>
                    <li><strong>Publication:</strong> Une fois validée, votre annonce sera visible sur la plateforme</li>
                    <li><strong>Gestion:</strong> Vous pouvez modifier ou supprimer votre annonce à tout moment</li>
                    <li><strong>Renouvellement:</strong> Avant expiration, renouvelez gratuitement pour continuer la vente</li>
                </ul>
            </div>

            <center>
                <a href="${productLink}" class="action-button">Voir votre annonce</a>
            </center>

            <div class="support-banner">
                📞 Besoin d'aide? Consultez notre <a href="https://buyandsale.cm/help" style="color: #0369a1; font-weight: 600; text-decoration: none;">centre d'aide</a> ou contactez notre <a href="https://buyandsale.cm/contact" style="color: #0369a1; font-weight: 600; text-decoration: none;">équipe support</a>.
            </div>
        </div>

        <div class="divider"></div>

        <div class="footer">
            <p><strong>BuyAndSale - Votre marketplace camerounaise de confiance</strong></p>
            <div class="footer-links">
                <a href="https://buyandsale.cm/help" class="footer-link">Centre d'aide</a>
                <a href="https://buyandsale.cm/terms" class="footer-link">Conditions</a>
                <a href="https://buyandsale.cm/privacy" class="footer-link">Confidentialité</a>
                <a href="https://buyandsale.cm/contact" class="footer-link">Contact</a>
            </div>
            <p style="margin-top: 20px; opacity: 0.8;">
                © 2025 BuyAndSale. Tous droits réservés.<br>
                Douala, Cameroun 🇨🇲
            </p>
        </div>
    </div>
</body>
</html>
  `;
}
