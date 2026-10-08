import { describe, expect, it, vi } from 'vitest';
import { CachedMusicProvider } from '../src/application/cached-music-provider';
import { InMemoryMetrics } from '../src/adapters/outbound/observability/in-memory-metrics';

describe('mock observability', () => {
  it('expires cached songs after the configured TTL', async () => {
    let time = 0;
    const source = { findSong: vi.fn().mockResolvedValue({ title: 'Song', artist: 'Artist' }) };
    const provider = new CachedMusicProvider(source, 1000, () => time);
    await provider.findSong('song');
    time = 1001;
    await provider.findSong('song');
    expect(source.findSong).toHaveBeenCalledTimes(2);
  });

  it('exposes in-memory metric counters', () => {
    const metrics = new InMemoryMetrics();
    metrics.increment('wake_up.requested');
    metrics.increment('wake_up.requested');
    expect(metrics.snapshot()).toEqual({ 'wake_up.requested': 2 });
  });
});
