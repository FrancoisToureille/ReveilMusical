import { MusicProvider } from '../../../domain/ports';
import { Song } from '../../../domain/models';

interface MusicBrainzResponse { recordings?: Array<{ title?: string; 'artist-credit'?: Array<{ name?: string }> }> }

export class MusicBrainzProvider implements MusicProvider {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly userAgent = 'ReveilMusical/1.0 contact@example.com',
    private readonly musicBrainzBaseUrl = 'https://musicbrainz.org/ws/2/recording',
  ) {}
  async findSong(query: string): Promise<Song | null> {
    const response = await this.fetcher(`${this.musicBrainzBaseUrl}?query=${encodeURIComponent(query)}&fmt=json`, { headers: { 'User-Agent': this.userAgent } });
    if (!response.ok) throw new Error(`MusicBrainz returned ${response.status}`);
    const data = await response.json() as MusicBrainzResponse;
    const result = data.recordings?.find(item => item.title && item['artist-credit']?.[0]?.name);
    return result ? { title: result.title!, artist: result['artist-credit']![0].name! } : null;
  }
}
