import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { TriggerWakeUp } from '../application/trigger-wake-up';
import { ItunesProvider } from '../adapters/outbound/music/itunes-provider';
import { MusicBrainzProvider } from '../adapters/outbound/music/musicbrainz-provider';
import { LocalSongFallback } from '../adapters/outbound/music/local-song-fallback';
import { InMemoryUserProfileProvider } from '../adapters/outbound/profile/in-memory-user-profile-provider';
import { EmailNotification, PushNotification, SmsNotification } from '../adapters/outbound/notification/mocks';
import { ProductionEmailNotification, ProductionPushNotification, ProductionSmsNotification } from '../adapters/outbound/notification/production';
import { createApp } from '../adapters/inbound/http/app';
import { CachedMusicProvider } from '../application/cached-music-provider';
import { LocalFallbackNotification } from '../adapters/outbound/notification/local-fallback-notification';
import { createResilientNotification } from '../application/resilient-notification';
import { InMemoryMetrics } from '../adapters/outbound/observability/in-memory-metrics';
import { JsonLogger } from '../adapters/outbound/observability/json-logger';

export function createApplicationContainer(env: NodeJS.ProcessEnv = process.env) {
  const container = createContainer({ injectionMode: InjectionMode.CLASSIC });
  const useMusicBrainz = env.MUSIC_PROVIDER === 'musicbrainz';
  const useProductionNotifications = env.NOTIFICATION_MODE === 'prod';
  container.register({
    itunesProvider: asClass(ItunesProvider).singleton(),
    musicBrainzProvider: asClass(MusicBrainzProvider).singleton(),
    fetcher: asFunction(() => fetch).singleton(),
    itunesBaseUrl: asFunction(() => env.ITUNES_BASE_URL ?? 'https://itunes.apple.com/search').singleton(),
    userAgent: asFunction(() => env.MUSICBRAINZ_USER_AGENT ?? 'ReveilMusical/1.0 contact@example.com').singleton(),
    musicBrainzBaseUrl: asFunction(() => env.MUSICBRAINZ_BASE_URL ?? 'https://musicbrainz.org/ws/2/recording').singleton(),
    sourceMusicProvider: asFunction((itunesProvider, musicBrainzProvider) => useMusicBrainz ? musicBrainzProvider : itunesProvider).singleton(),
    musicProvider: asClass(CachedMusicProvider).singleton(),
    cacheTtlMs: asFunction(() => Number(env.MUSIC_CACHE_TTL_MS ?? 300000)).singleton(),
    now: asFunction(() => Date.now).singleton(),
    userProfileProvider: asClass(InMemoryUserProfileProvider).singleton(),
    songFallback: asClass(LocalSongFallback).singleton(),
    emailNotification: asClass(useProductionNotifications ? ProductionEmailNotification : EmailNotification).singleton(),
    smsNotification: asClass(useProductionNotifications ? ProductionSmsNotification : SmsNotification).singleton(),
    pushNotification: asClass(useProductionNotifications ? ProductionPushNotification : PushNotification).singleton(),
    localFallbackNotification: asClass(LocalFallbackNotification).singleton(),
    resilientEmailNotification: asFunction((emailNotification, localFallbackNotification) => createResilientNotification(emailNotification, localFallbackNotification)).singleton(),
    resilientSmsNotification: asFunction((smsNotification, localFallbackNotification) => createResilientNotification(smsNotification, localFallbackNotification)).singleton(),
    resilientPushNotification: asFunction((pushNotification, localFallbackNotification) => createResilientNotification(pushNotification, localFallbackNotification)).singleton(),
    notifications: asFunction((resilientEmailNotification, resilientSmsNotification, resilientPushNotification) => ({
      email: resilientEmailNotification,
      sms: resilientSmsNotification,
      push: resilientPushNotification,
    })).singleton(),
    metrics: asClass(InMemoryMetrics).singleton(),
    logger: asClass(JsonLogger).singleton(),
    triggerWakeUp: asClass(TriggerWakeUp).singleton(),
    app: asFunction(createApp).singleton(),
  });
  return container;
}
