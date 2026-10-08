import { describe, expect, it, vi } from 'vitest';
import { TriggerWakeUp } from '../src/application/trigger-wake-up';
import { createResilientNotification } from '../src/application/resilient-notification';
import { createApplicationContainer } from '../src/composition/container';

describe('TriggerWakeUp', () => {
  it('uses the weather-specific song and preferred channel', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const service = new TriggerWakeUp(
      { getProfile: vi.fn().mockResolvedValue({ songsByWeather: { PLUIE: 'Purple Rain' }, fallbackSong: 'Imagine', preferredChannel: 'sms' }) },
      { findSong: vi.fn().mockResolvedValue({ title: 'Purple Rain', artist: 'Prince' }) },
      { getSong: vi.fn() },
      { email: { send: vi.fn() }, sms: { send }, push: { send: vi.fn() } },
      { increment: vi.fn() },
      { info: vi.fn(), warn: vi.fn() },
    );
    const result = await service.execute({ userId: 'u', day: 'LUNDI', weather: 'PLUIE' });
    expect(result.song.title).toBe('Purple Rain');
    expect(result.degraded).toBe(false);
    expect(send).toHaveBeenCalledWith('u', 'Purple Rain - Prince');
  });

  it('prefers a day-and-weather song when the profile provides one', async () => {
    const findSong = vi.fn().mockResolvedValue({ title: 'Friday Song', artist: 'Artist' });
    const service = new TriggerWakeUp(
      { getProfile: vi.fn().mockResolvedValue({ songsByWeather: { PLUIE: 'Generic Rain' }, songsByDayAndWeather: { VENDREDI: { PLUIE: 'Friday Song' } }, fallbackSong: 'Imagine', preferredChannel: 'push' }) },
      { findSong },
      { getSong: vi.fn() },
      { email: { send: vi.fn() }, sms: { send: vi.fn() }, push: { send: vi.fn().mockResolvedValue(undefined) } },
      { increment: vi.fn() },
      { info: vi.fn(), warn: vi.fn() },
    );
    await service.execute({ userId: 'u', day: 'VENDREDI', weather: 'PLUIE' });
    expect(findSong).toHaveBeenCalledWith('Friday Song');
  });

  it('falls back locally when the provider fails', async () => {
    const fallback = { getSong: vi.fn().mockReturnValue({ title: 'Imagine', artist: 'John Lennon' }) };
    const service = new TriggerWakeUp(
      { getProfile: vi.fn().mockResolvedValue({ songsByWeather: {}, fallbackSong: 'Imagine', preferredChannel: 'push' }) },
      { findSong: vi.fn().mockRejectedValue(new Error('down')) },
      fallback,
      { email: { send: vi.fn() }, sms: { send: vi.fn() }, push: { send: vi.fn().mockResolvedValue(undefined) } },
      { increment: vi.fn() },
      { info: vi.fn(), warn: vi.fn() },
    );
    await expect(service.execute({ userId: 'u', day: 'DIMANCHE', weather: 'NEIGE' })).resolves.toMatchObject({ degraded: true });
    expect(fallback.getSong).toHaveBeenCalledWith('Imagine');
  });

  it('uses the fallback notification when the preferred channel fails', async () => {
    const fallbackSend = vi.fn().mockResolvedValue(undefined);
    const notification = createResilientNotification(
      { send: vi.fn().mockRejectedValue(new Error('channel down')) },
      { send: fallbackSend },
    );
    await notification.send('u', 'Imagine - John Lennon');
    expect(fallbackSend).toHaveBeenCalledWith('u', 'Imagine - John Lennon');
  });

  it('uses mock notifications by default', () => {
    expect(() => createApplicationContainer({ MUSIC_PROVIDER: 'itunes' })).not.toThrow();
  });

  it('can assemble the production notification adapters without pretending they work', async () => {
    const container = createApplicationContainer({ MUSIC_PROVIDER: 'itunes', NOTIFICATION_MODE: 'prod' });
    const notification = container.resolve<{ send(userId: string, message: string): Promise<void> }>('emailNotification');
    await expect(notification.send('u', 'message')).rejects.toThrow('not implemented');
  });
});
