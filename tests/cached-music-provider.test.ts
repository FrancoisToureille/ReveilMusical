import { describe, expect, it, vi } from 'vitest';
import { CachedMusicProvider } from '../src/application/cached-music-provider';

describe('CachedMusicProvider', () => {
  it('does not query the external provider twice for the same song', async () => {
    const source = { findSong: vi.fn().mockResolvedValue({ title: 'Song', artist: 'Artist' }) };
    const provider = new CachedMusicProvider(source);
    await provider.findSong(' Song ');
    await provider.findSong('song');
    expect(source.findSong).toHaveBeenCalledTimes(1);
  });
});
