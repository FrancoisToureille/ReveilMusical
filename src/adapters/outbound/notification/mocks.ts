import { Notification } from '../../../domain/ports';

export class EmailNotification implements Notification {
  async send(userId: string, message: string): Promise<void> { console.log(`[email] ${userId}: ${message}`); }
}
export class SmsNotification implements Notification {
  async send(userId: string, message: string): Promise<void> { console.log(`[sms] ${userId}: ${message}`); }
}
export class PushNotification implements Notification {
  async send(userId: string, message: string): Promise<void> { console.log(`[push] ${userId}: ${message}`); }
}
