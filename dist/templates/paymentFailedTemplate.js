"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentFailedTemplate = createPaymentFailedTemplate;
function createPaymentFailedTemplate({ firstName, lastName, productName, productLink, forfaitType, amountAttempted, failureReason, campayReference, attemptedAt, supportEmail, }) {
    const displayName = firstName ? `${firstName} ${lastName}` : lastName;
    const forfaitLabels = {
        PREMIUM: '🌟 PREMIUM',
        TOP_ANNONCE: '🔝 TOP ANNONCE',
        URGENT: '🔥 URGENT',
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
    const reasonMessage = failureReason || 'Solde insuffisant ou paiement annulé';
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Échec du Paiement - BuyAndSale</title>
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
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .error-badge {
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
        .error-summary {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .error-title {
            font-size: 18px;
            font-weight: 600;
            color: #991b1b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .error-title .icon {
            margin-right: 10px;
            font-size: 24px;
        }
        .error-reason {
            background: white;
            padding: 15px;
            border-radius: 8px;
            color: #991b1b;
            font-weight: 500;
            margin-top: 15px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #fecaca;
        }
        .summary-row:last-child {
            border-bottom: none;
        }
        .summary-label {
            color: #991b1b;
            font-size: 14px;
        }
        .summary-value {
            color: #2d3748;
            font-weight: 600;
            font-size: 14px;
        }
        .help-box {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .help-title {
            color: #1e40af;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .help-list {
            color: #1e3a8a;
            font-size: 14px;
            line-height: 1.8;
            margin-left: 20px;
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
        .support-contact {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
        }
        .support-email {
            color: #3b82f6;
            font-weight: 600;
            text-decoration: none;
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
            <div class="error-badge">❌</div>
            <h1>Échec du Paiement</h1>
            <p class="header-subtitle">Votre transaction n'a pas pu être complétée</p>
        </div>

        <div class="content">
            <h2 class="greeting">Bonjour ${displayName},</h2>
            
            <p class="message">
                Nous vous informons que votre tentative de paiement pour activer le forfait 
                <strong>${forfaitLabels[forfaitType]}</strong> sur votre annonce 
                "<strong>${productName}</strong>" n'a pas abouti.
            </p>

            <div class="error-summary">
                <div class="error-title">
                    <span class="icon">⚠️</span>
                    Détails de la Transaction
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Date de la tentative</span>
                    <span class="summary-value">${formatDate(attemptedAt)}</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Référence Campay</span>
                    <span class="summary-value reference">${campayReference}</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Montant</span>
                    <span class="summary-value">${amountAttempted} XAF</span>
                </div>
                
                <div class="summary-row">
                    <span class="summary-label">Forfait visé</span>
                    <span class="summary-value">${forfaitLabels[forfaitType]}</span>
                </div>

                <div class="error-reason">
                    <strong>Raison :</strong> ${reasonMessage}
                </div>
            </div>

            <div class="help-box">
                <div class="help-title">💡 Que faire maintenant ?</div>
                <ul class="help-list">
                    <li>Vérifiez que votre compte Mobile Money dispose de fonds suffisants</li>
                    <li>Assurez-vous que votre numéro de téléphone est actif</li>
                    <li>Réessayez le paiement depuis votre tableau de bord</li>
                    <li>Contactez notre support si le problème persiste</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="${productLink}" class="cta-button" style="color: white;">
                    🔄 Réessayer le Paiement
                </a>
            </div>

            <div class="support-contact">
                <p style="color: #4a5568; margin-bottom: 10px;">
                    Besoin d'aide ?
                </p>
                <a href="mailto:${supportEmail}" class="support-email">
                    📧 ${supportEmail}
                </a>
            </div>
        </div>

        <div class="footer">
            <p class="footer-text">
                Aucun montant n'a été débité de votre compte.<br>
                Vous pouvez réessayer à tout moment depuis votre espace personnel.
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
