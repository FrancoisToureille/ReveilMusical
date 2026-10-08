import { Notification } from '../../../domain/ports';

/**
 * Points d'intégration pour les fournisseurs réels.
 *
 * À implémenter avant d'activer l'envoi de production :
 * - Email : SMTP, Resend, SendGrid, etc.
 * - SMS : Twilio, Vonage, etc.
 * - Push : Firebase Cloud Messaging, APNs, etc.
 *
 * Ces adaptateurs échouent explicitement plutôt que de prétendre avoir envoyé
 * une notification. Le fallback local reste disponible en mode dégradé.
 */
export class ProductionEmailNotification implements Notification {
  async send(_userId: string, _message: string): Promise<void> {
    throw new Error('Production email notification is not implemented');
  }
}

export class ProductionSmsNotification implements Notification {
  async send(_userId: string, _message: string): Promise<void> {
    throw new Error('Production SMS notification is not implemented');
  }
}

export class ProductionPushNotification implements Notification {
  async send(_userId: string, _message: string): Promise<void> {
    throw new Error('Production push notification is not implemented');
  }
}
