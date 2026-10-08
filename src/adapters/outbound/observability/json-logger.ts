import { Logger } from '../../../domain/ports';

export class JsonLogger implements Logger {
  info(message: string, context: Record<string, unknown> = {}): void {
    console.log(JSON.stringify({ level: 'info', message, ...context }));
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    console.warn(JSON.stringify({ level: 'warn', message, ...context }));
  }
}
