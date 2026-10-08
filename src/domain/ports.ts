import { Song, UserProfile, WakeUpCommand, WakeUpResult } from './models';

export interface UserProfileProvider {
  getProfile(userId: string): Promise<UserProfile>;
}
export interface MusicProvider {
  findSong(query: string): Promise<Song | null>;
}
export interface SongFallback {
  getSong(query: string): Song;
}
export interface Notification {
  send(userId: string, message: string): Promise<void>;
}
export interface WakeUpService {
  execute(command: WakeUpCommand): Promise<WakeUpResult>;
}
export interface Metrics {
  increment(name: string): void;
}
export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
}
