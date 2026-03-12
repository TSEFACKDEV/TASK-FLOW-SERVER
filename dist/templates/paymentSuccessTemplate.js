"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSuccessTemplate = createPaymentSuccessTemplate;
function createPaymentSuccessTemplate({ firstName, lastName, productName, productLink, forfaitType, forfaitDuration, amountPaid, paidAt, campayReference, expiresAt, }) {
    const displayName = firstName ? `${firstName} ${lastName}` : lastName;
    const forfaitLabels = {
        PREMIUM: '🌟 PREMIUM',
        TOP_ANNONCE: '🔝 TOP ANNONCE',
        URGENT: '🔥 URGENT',
    };
    const forfaitColors = {
        PREMIUM: '#9333ea',
        TOP_ANNONCE: '#3b82f6',
        URGENT: '#ef4444',
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paiement Réussi - BuyAndSale</title>
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
        .success-badge {
            width: 90px;
            height: 90px;
            margin: 0 auto 20px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .header-subtitle {
            font-size: 16px;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 22px;
            color: #2d3748;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: #4a5568;
            margin-bottom: 30px;
        }
        .payment-summary {
            background: #f7fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .summary-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        .summary-title .icon {
            margin-right: 10px;
            font-size: 24px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .summary-row:last-child {
            border-bottom: none;
        }
        .summary-label {
            color: #718096;
            font-size: 14px;
        }
        .summary-value {
            color: #2d3748;
            font-weight: 600;
            font-size: 14px;
        }
        .forfait-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            font-size: 14px;
        }
        .amount-highlight {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            text-align: center;
            margin: 25px 0;
        }
        .amount-highlight .label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        .amount-highlight .value {
            font-size: 32px;
            font-weight: 700;
        }
        .product-info {
            background: #fff;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
        }
        .product-name {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 10px;
        }
        .expiry-notice {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .expiry-notice .icon {
            color: #f59e0b;
            margin-right: 8px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 16px 35px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #718096;
            font-size: 13px;
            line-height: 1.6;
        }
        .reference {
            font-family: 'Courier New', monospace;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="success-badge">✅</div>
            <h1>Paiement Réussi !</h1>
            <p class="header-subtitle">Votre forfait a été activé avec succès</p>
        </div>

        <div class="content">
            <h2 class="greeting">Bonjour ${displayName},</h2>
            
            <p class="message">
                Excellente nouvelle ! Votre paiement a été confirmé et votre annonce 
                "<strong>${productName}</strong>" bénéficie maintenant du forfait 
                <span class="forfait-badge" style="background-color: ${forfaitColors[forfaitType]}">
                    ${forfaitLabels[forfaitType]}
                </span>
            </p>

            <div class="amount-highlight">
                <div class="label">Montant Payé</div>
                <div class="value">${amountPaid} XAF</div>
            </div>

            <div class="payment-summary">
                <div class="summary-title">
                    <span class="icon">📋</span>
                    Détails du Paiement
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Date de paiement</span>
                    <span class="summary-value">${formatDate(paidAt)}</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Référence Campay</span>
                    <span class="summary-value reference">${campayReference}</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Forfait activé</span>
                    <span class="summary-value">${forfaitLabels[forfaitType]}</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Durée</span>
                    <span class="summary-value">${forfaitDuration} jours</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Expire le</span>
                    <span class="summary-value">${formatDate(expiresAt)}</span>
                </div>
            </div>

            <div class="product-info">
                <div class="product-name">🎯 Annonce boostée</div>
                <p class="summary-label">${productName}</p>
            </div>

            <div class="expiry-notice">
                <strong style="color: #f59e0b;">
                    <span class="icon">⚡</span>
                    Votre boost est actif !
                </strong><br>
                <span class="summary-label">
                    Votre annonce bénéficie maintenant d'une visibilité maximale pendant ${forfaitDuration} jours.
                </span>
            </div>

            <div style="text-align: center;">
                <a href="${productLink}" class="cta-button" style="color: white;">
                    📱 Voir Mon Annonce Boostée
                </a>
            </div>
        </div>

        <div class="footer">
            <p class="footer-text">
                Merci d'avoir utilisé <strong>BuyAndSale</strong> !<br>
                Si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
            <p class="footer-text" style="margin-top: 15px; font-size: 12px;">
                © ${new Date().getFullYear()} BuyAndSale - Tous droits réservés
            </p>
        </div>
    </div>
</body>
</html>
  `;
}
