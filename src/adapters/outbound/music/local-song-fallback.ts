import { SongFallback } from '../../../domain/ports';
import { Song } from '../../../domain/models';

export class LocalSongFallback implements SongFallback {
  private readonly songs: Song[] = [
    { title: 'Here Comes the Sun', artist: 'The Beatles' },
    { title: 'Dreams', artist: 'Fleetwood Mac' },
    { title: 'Imagine', artist: 'John Lennon' },
    { title: 'Purple Rain', artist: 'Prince' },
    { title: 'Let It Go', artist: 'Idina Menzel' },
    { title: 'Cloudbusting', artist: 'Kate Bush' },
    { title: 'Walking on Sunshine', artist: 'Katrina and the Waves' },
    { title: 'Sunday Morning', artist: 'Maroon 5' },
  ];
  getSong(query: string): Song {
    return this.songs.find(song => song.title.toLowerCase() === query.toLowerCase()) ?? this.songs[0];
  }
}
