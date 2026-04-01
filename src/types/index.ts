export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  viewCount?: string;
  duration?: string;
  durationSeconds?: number;
  isLive?: boolean;
  isSong?: boolean;
}
export interface Movie {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  addedAt: string;
  duration?: string;
  user_id?: string;
}


export interface Channel {
  channelId: string;
  name: string;
  handle: string;
  avatarUrl: string;
  subscriberCount: string;
  addedAt: string;
  user_id?: string;
}

export interface WatchSession {
  id: string;
  date: string;
  minutesWatched: number;
  lastUpdated: string;
}

export interface SearchShortcut {
  id: string;
  keyword: string;
  imageUrl: string;
}

export interface Playlist {
  id: string;
  title: string;
  thumbnailUrl: string;
  addedAt: string;
  user_id?: string;
}

export interface Kid {
  id: string;
  name: string;
  avatarUrl: string;
  allowedChannels: string[]; 
  allowedPlaylists?: string[];
  shortcuts?: SearchShortcut[];
  passcodeAvatarId?: string;
}

export interface AppSettings {
  id?: string;
  user_id?: string;
  dailyLimitMinutes: number;
  adminPin: string;
  isSetup: boolean;
  email?: string;
  shortcuts?: SearchShortcut[];
  kids?: Kid[];
  magicPlaylistId?: string;
  youtubeApiKeys?: string;
  movies?: Movie[];
}

export interface AppState {
  kids: Kid[];
  currentKid: Kid | null;
  channels: Channel[]; 
  playlists: Playlist[];
  currentVideo: YouTubeVideo | null;
  videos: YouTubeVideo[];
  isLoading: boolean;
  isAdminOpen: boolean;
  isTimerExpired: boolean;
  minutesUsed: number;
  settings: AppSettings;
  activeChannelFilter: string | null;
  activePlaylistId: string | null;
  activeMovieId: string | null;
  movies: Movie[];
}
