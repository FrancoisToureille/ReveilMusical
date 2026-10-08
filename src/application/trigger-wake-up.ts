import { Logger, Metrics, MusicProvider, Notification, SongFallback, UserProfileProvider, WakeUpService } from '../domain/ports';
import { NotificationChannel, WakeUpCommand, WakeUpResult } from '../domain/models';

export class TriggerWakeUp implements WakeUpService {
  constructor(
    private readonly userProfileProvider: UserProfileProvider,
    private readonly musicProvider: MusicProvider,
    private readonly songFallback: SongFallback,
    private readonly notifications: Record<NotificationChannel, Notification>,
    private readonly metrics: Metrics,
    private readonly logger: Logger,
  ) {}

  async execute(command: WakeUpCommand): Promise<WakeUpResult> {
    const profile = await this.userProfileProvider.getProfile(command.userId);
    this.metrics.increment('wake_up.requested');
    const query = profile.songsByDayAndWeather?.[command.day]?.[command.weather]
      ?? profile.songsByWeather[command.weather]
      ?? profile.fallbackSong;
    let degraded = false;
    let song;
    try {
      song = await this.musicProvider.findSong(query);
    } catch {
      this.metrics.increment('music.provider_failure');
      this.logger.warn('Music provider failed', { query });
      song = null;
    }
    if (!song) {
      song = this.songFallback.getSong(query);
      degraded = true;
      this.metrics.increment('music.fallback_used');
    }
    const notification = this.notifications[profile.preferredChannel];
    await notification.send(command.userId, `${song.title} - ${song.artist}`);
    this.metrics.increment('wake_up.sent');
    this.logger.info('Wake-up notification sent', { userId: command.userId, channel: profile.preferredChannel, degraded });
    return { ...command, song, channel: profile.preferredChannel, degraded };
  }
}
