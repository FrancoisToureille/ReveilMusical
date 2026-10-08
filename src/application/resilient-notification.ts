import { Notification } from '../domain/ports';

export function createResilientNotification(primary: Notification, fallback: Notification): Notification {
  return {
    async send(userId: string, message: string): Promise<void> {
      try {
        await primary.send(userId, message);
      } catch {
        await fallback.send(userId, message);
      }
    },
  };
}
