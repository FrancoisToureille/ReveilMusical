import { MusicProvider } from '../domain/ports';
import { Song } from '../domain/models';

export class CachedMusicProvider implements MusicProvider {
  private readonly cache = new Map<string, { song: Song | null; expiresAt: number }>();

  constructor(
    private readonly sourceMusicProvider: MusicProvider,
    private readonly cacheTtlMs = 300_000,
    private readonly now: () => number = Date.now,
  ) {}

  async findSong(query: string): Promise<Song | null> {
    const key = query.trim().toLocaleLowerCase();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > this.now()) return cached.song;
    if (cached) this.cache.delete(key);
    const song = await this.sourceMusicProvider.findSong(query);
    this.cache.set(key, { song, expiresAt: this.now() + this.cacheTtlMs });
    return song;
  }
}
