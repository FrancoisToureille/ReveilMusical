import { Notification } from '../../../domain/ports';

export class LocalFallbackNotification implements Notification {
  async send(userId: string, message: string): Promise<void> {
    console.log(`[fallback-notification] ${userId}: ${message}`);
  }
}
