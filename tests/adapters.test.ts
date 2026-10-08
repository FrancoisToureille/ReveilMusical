import { describe, expect, it, vi } from 'vitest';
import { ItunesProvider } from '../src/adapters/outbound/music/itunes-provider';
import { MusicBrainzProvider } from '../src/adapters/outbound/music/musicbrainz-provider';

describe('music adapters', () => {
  it('maps iTunes DTO without leaking provider fields', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [{ trackName: 'Song', artistName: 'Artist', trackViewUrl: 'url' }] }) });
    await expect(new ItunesProvider(fetcher, 'http://itunes').findSong('Song')).resolves.toEqual({ title: 'Song', artist: 'Artist', url: 'url' });
  });
  it('sends an identifiable User-Agent to MusicBrainz', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ recordings: [{ title: 'Song', 'artist-credit': [{ name: 'Artist' }] }] }) });
    await new MusicBrainzProvider(fetcher, 'App contact@example.com', 'http://mb').findSong('Song');
    expect(fetcher.mock.calls[0][1]).toEqual({ headers: { 'User-Agent': 'App contact@example.com' } });
  });
});
