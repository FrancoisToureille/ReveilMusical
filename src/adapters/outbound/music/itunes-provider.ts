import { MusicProvider } from '../../../domain/ports';
import { Song } from '../../../domain/models';

interface ItunesResponse { results?: Array<{ trackName?: string; artistName?: string; trackViewUrl?: string }> }

export class ItunesProvider implements MusicProvider {
  constructor(private readonly fetcher: typeof fetch = fetch, private readonly itunesBaseUrl = 'https://itunes.apple.com/search') {}
  async findSong(query: string): Promise<Song | null> {
    const response = await this.fetcher(`${this.itunesBaseUrl}?term=${encodeURIComponent(query)}&media=music&limit=5`);
    if (!response.ok) throw new Error(`iTunes returned ${response.status}`);
    const data = await response.json() as ItunesResponse;
    const result = data.results?.find(item => item.trackName && item.artistName);
    return result ? { title: result.trackName!, artist: result.artistName!, url: result.trackViewUrl } : null;
  }
}
