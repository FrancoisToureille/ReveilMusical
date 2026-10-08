export const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'] as const;
export type Day = typeof DAYS[number];
export const WEATHERS = ['SOLEIL', 'PLUIE', 'NEIGE', 'NUAGEUX'] as const;
export type Weather = typeof WEATHERS[number];
export type NotificationChannel = 'email' | 'sms' | 'push';

export interface Song {
  title: string;
  artist: string;
  url?: string;
}

export interface UserProfile {
  songsByWeather: Partial<Record<Weather, string>>;
  songsByDayAndWeather?: Partial<Record<Day, Partial<Record<Weather, string>>>>;
  fallbackSong: string;
  preferredChannel: NotificationChannel;
}

export interface WakeUpCommand {
  userId: string;
  day: Day;
  weather: Weather;
}

export interface WakeUpResult {
  userId: string;
  day: Day;
  weather: Weather;
  song: Song;
  channel: NotificationChannel;
  degraded: boolean;
}
