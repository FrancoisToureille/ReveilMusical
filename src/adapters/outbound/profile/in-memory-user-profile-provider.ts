import { UserProfileProvider } from '../../../domain/ports';
import { UserProfile } from '../../../domain/models';

export class InMemoryUserProfileProvider implements UserProfileProvider {
  async getProfile(userId: string): Promise<UserProfile> {
    if (userId === 'user-1') {
      return {
        songsByWeather: { SOLEIL: 'Here Comes the Sun', PLUIE: 'Purple Rain' },
        songsByDayAndWeather: {
          LUNDI: { SOLEIL: 'Here Comes the Sun' },
          MARDI: { PLUIE: 'Purple Rain' },
          MERCREDI: { NEIGE: 'Let It Go' },
          JEUDI: { NUAGEUX: 'Cloudbusting' },
          VENDREDI: { PLUIE: 'Purple Rain' },
          SAMEDI: { SOLEIL: 'Walking on Sunshine' },
          DIMANCHE: { NUAGEUX: 'Sunday Morning' },
        },
        fallbackSong: 'Imagine',
        preferredChannel: 'email',
      };
    }
    return { songsByWeather: {}, fallbackSong: 'Imagine', preferredChannel: 'push' };
  }
}
