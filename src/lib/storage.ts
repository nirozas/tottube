import { Channel, YouTubeVideo, WatchSession, AppSettings, Playlist, SearchShortcut, Movie } from '../types'
import { supabase, isSupabaseConfigured } from './supabase'

const DEFAULT_SETTINGS: AppSettings = {
  dailyLimitMinutes: 60,
  adminPin: '1234',
  isSetup: false,
  email: '',
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Settings ──────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_SETTINGS
  try {
    const { data: settingsData, error: settingsError } = await supabase.from('tottube_settings').select('*').maybeSingle()
    if (settingsError) throw settingsError
    
    const shortcuts = await getShortcuts()
    
    const settings = settingsData ? (settingsData as AppSettings) : DEFAULT_SETTINGS
    return { ...settings, shortcuts }
  } catch (err) {
    console.error('Failed to get settings from Supabase:', err)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  let finalPayload = { ...settings }
  if (!finalPayload.user_id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) finalPayload.user_id = user.id
  }
  const { error } = await supabase.from('tottube_settings').upsert(finalPayload, { onConflict: 'user_id', ignoreDuplicates: false })
  if (error && finalPayload.id) {
    await supabase.from('tottube_settings').upsert(finalPayload, { onConflict: 'id' })
  }
}

// ─── Channels ──────────────────────────────────────────────────
export async function getChannels(): Promise<Channel[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.from('tottube_channels').select('*').order('"addedAt"', { ascending: true })
    if (error) throw error
    return (data as Channel[]) || []
  } catch (err) {
    console.error('Failed to get channels from Supabase:', err)
    return []
  }
}

export async function addChannel(channel: Channel): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...channel, user_id: user?.id }
  const { error } = await supabase.from('tottube_channels').upsert(payload) 
  if (error) await supabase.from('tottube_channels').upsert(payload, { onConflict: '"channelId",user_id' })
}

export async function removeChannel(channelId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('tottube_channels').delete().eq('"channelId"', channelId)
}

// ─── Playlists ────────────────────────────────────────────────
export async function getPlaylists(): Promise<Playlist[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.from('tottube_playlists').select('*').order('"addedAt"', { ascending: true })
    if (error) throw error
    return (data as Playlist[]) || []
  } catch (err) {
    console.error('Failed to get playlists from Supabase:', err)
    return []
  }
}

export async function addPlaylist(playlist: Playlist): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...playlist, user_id: user?.id }
  const { error } = await supabase.from('tottube_playlists').upsert(payload)
  if (error) console.error('Failed to save playlist:', error)
}

export async function removePlaylist(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('tottube_playlists').delete().eq('id', id)
}

// ─── Shortcuts ────────────────────────────────────────────────
export async function getShortcuts(): Promise<SearchShortcut[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.from('tottube_shortcuts').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return (data as SearchShortcut[]) || []
  } catch (err) {
    console.error('Failed to get shortcuts from Supabase:', err)
    return []
  }
}

export async function addShortcut(shortcut: SearchShortcut): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...shortcut, user_id: user?.id }
  const { error } = await supabase.from('tottube_shortcuts').upsert(payload, { onConflict: 'id' })
  if (error) console.error('Failed to save shortcut:', error)
}

export async function removeShortcut(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('tottube_shortcuts').delete().eq('id', id)
}

// ─── Movies ──────────────────────────────────────────────────
export async function getMovies(): Promise<Movie[]> {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const raw = localStorage.getItem('tottube_movies_fallback')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }
  try {
    const { data, error } = await supabase.from('tottube_movies').select('*').order('"addedAt"', { ascending: false })
    if (error) throw error
    return (data as Movie[]) || []
  } catch (err) {
    console.error('Failed to get movies from Supabase:', err)
    return []
  }
}

export async function addMovie(movie: Movie): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const current = await getMovies()
    const updated = [movie, ...current]
    localStorage.setItem('tottube_movies_fallback', JSON.stringify(updated))
    return
  }
  const { data: { user } } = await supabase.auth.getUser()
  const payload = { ...movie, user_id: user?.id }
  const { error } = await supabase.from('tottube_movies').upsert(payload, { onConflict: 'id' })
  if (error) console.error('Failed to save movie:', error)
}

export async function removeMovie(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const current = await getMovies()
    const updated = current.filter(m => m.id !== id)
    localStorage.setItem('tottube_movies_fallback', JSON.stringify(updated))
    return
  }
  await supabase.from('tottube_movies').delete().eq('id', id)
}

// ─── Live Vault (Radar) ──────────────────────────────────────
export async function getSavedLiveStreams(): Promise<YouTubeVideo[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data } = await supabase.from('tottube_lives').select('*').order('"addedAt"', { ascending: false })
  return (data as any[])?.map(item => ({
    ...item,
    isLive: true
  })) || []
}

export async function saveLiveStreams(videos: YouTubeVideo[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !videos.length) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  const payload = videos.map(v => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    channelId: v.channelId,
    channelTitle: v.channelTitle || '',
    user_id: user.id
  }))
  
  await supabase.from('tottube_lives').upsert(payload, { onConflict: 'id' })
}

export async function removeLiveStream(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('tottube_lives').delete().eq('id', id)
}

// ─── Watch Timer (Sessions) ──────────────────────────────────────
export async function getTodaySession(kidId: string): Promise<WatchSession> {
  const date = todayKey()
  const compositeId = `${kidId}_${date}`
  const fallback: WatchSession = { id: compositeId, date, minutesWatched: 0, lastUpdated: new Date().toISOString() }
  if (!isSupabaseConfigured || !supabase) return fallback
  const { data } = await supabase.from('tottube_sessions').select('*').eq('id', compositeId).maybeSingle()
  return data ? (data as WatchSession) : fallback
}

export async function saveTodaySession(kidId: string, minutesWatched: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  const date = todayKey()
  const compositeId = `${kidId}_${date}`
  const session: WatchSession = { id: compositeId, date, minutesWatched, lastUpdated: new Date().toISOString() }
  await supabase.from('tottube_sessions').upsert(session, { onConflict: 'id' })
}

export async function resetTodaySession(kidId: string): Promise<void> {
  await saveTodaySession(kidId, 0)
}

// ─── YouTube API Key Rotation ─────────────────────────────────────
const getStoredKeys = () => {
  try {
    return localStorage.getItem('tottube_runtime_api_keys') || ''
  } catch {
    return ''
  }
}

const RAW_KEYS = getStoredKeys() || import.meta.env.VITE_YOUTUBE_API_KEYS || ''
const API_KEYS = RAW_KEYS.split(',').map((k: string) => k.trim()).filter((k: string) => k && !k.includes('YOUR_'))

if (API_KEYS.length === 0) {
  console.warn("⚠️ TotTube: No YouTube API keys found! Video fetching will fail. Add VITE_YOUTUBE_API_KEYS=key1,key2 to .env or Vercel.")
}

let currentKeyIndex = 0
let totalRotations = 0

function getActiveKey(): string {
  if (API_KEYS.length === 0) return 'YOUR_YOUTUBE_API_KEY_HERE'
  return API_KEYS[currentKeyIndex % API_KEYS.length]
}

function rotateKey(): boolean {
  if (API_KEYS.length <= 1) return false
  if (totalRotations >= API_KEYS.length * 2) return false
  totalRotations++
  currentKeyIndex++
  return true
}

let isRotating = false;
async function smartFetch(url: string, retryOnQuota = true): Promise<any> {
  const activeKey = getActiveKey()
  const res = await fetch(`${url}&key=${activeKey}`)
  
  if (res.status === 403 || res.status === 400) {
    const errorData = await res.json().catch(() => ({}))
    const reason = errorData.error?.errors?.[0]?.reason || ''
    
    if (retryOnQuota && (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || res.status === 403)) {
       if (!isRotating) {
         isRotating = true;
         rotateKey();
         setTimeout(() => { isRotating = false }, 500);
       }
       return smartFetch(url, true)
    }
    throw new Error(reason || 'API_ERROR')
  }
  return res.json()
}

// ─── YouTube API Utility ────────────────────────────────────────
function parseDuration(pt: string): number {
  const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = parseInt(match[1] || '0', 10)
  const m = parseInt(match[2] || '0', 10)
  const s = parseInt(match[3] || '0', 10)
  return h * 3600 + m * 60 + s
}

export async function fetchChannelInfo(channelIdOrHandle: string): Promise<any> {
  const isChannelId = channelIdOrHandle.startsWith('UC')
  const baseUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics`
  const params = isChannelId
      ? `&id=${channelIdOrHandle}`
      : `&forHandle=${channelIdOrHandle.startsWith('@') ? channelIdOrHandle : `@${channelIdOrHandle}`}`
  
  const data = await smartFetch(baseUrl + params)
  if (!data.items?.length) return null
  const item = data.items[0]
  return {
    channelId: item.id,
    name: item.snippet.title,
    handle: item.snippet.customUrl,
    avatarUrl: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url,
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0).toLocaleString(),
  }
}

export async function fetchPlaylistInfo(playlistId: string): Promise<Playlist | null> {
  const baseUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}`
  try {
    const data = await smartFetch(baseUrl)
    if (!data.items?.length) return null
    const item = data.items[0]
    return {
      id: item.id,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      addedAt: new Date().toISOString()
    }
  } catch (err) { return null }
}

export async function fetchVideosFromChannels(
  channelIds: string[], 
  searchQuery?: string, 
  videoDuration?: 'short' | 'medium' | 'long' | 'any',
  pageTokens?: Record<string, string>,
  forceLiveOnly?: boolean,
  maxResults: number = 50
): Promise<{ videos: YouTubeVideo[], nextPageTokens: Record<string, string> }> {
  if (!channelIds.length) return { videos: [], nextPageTokens: {} }

  const newTokens: Record<string, string> = {}
  
  const channelPromises = channelIds.map(async (channelId) => {
    try {
      let videoIds: string[] = []
      const isMix = !searchQuery || searchQuery === '-shorts -#shorts'
      
      if (isMix && !forceLiveOnly) {
        const uploadsPlaylistId = channelId.replace('UC', 'UU')
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}${pageTokens?.[channelId] ? `&pageToken=${pageTokens[channelId]}` : ''}`
        const data = await smartFetch(url)
        if (data.nextPageToken) newTokens[channelId] = data.nextPageToken
        videoIds = (data.items || []).map((item: any) => item.contentDetails.videoId)
      } else {
        const query = searchQuery ? `${searchQuery} -shorts -#shorts` : '-shorts -#shorts'
        const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}${forceLiveOnly ? '&eventType=live' : ''}${pageTokens?.[channelId] ? `&pageToken=${pageTokens[channelId]}` : ''}`
        const data = await smartFetch(url)
        if (data.nextPageToken) newTokens[channelId] = data.nextPageToken
        videoIds = (data.items || []).map((item: any) => item.id.videoId)
      }

      if (videoIds.length > 0) {
        const details = await smartFetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}`)
        return (details.items || []).map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
          channelId,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          durationSeconds: parseDuration(item.contentDetails?.duration || 'PT0S'),
          isLive: item.snippet.liveBroadcastContent === 'live',
          isSong: item.snippet.title.toLowerCase().includes('song'),
        }))
      }
      return []
    } catch (e) { return [] }
  })

  const results = await Promise.all(channelPromises)
  const allVideos = results.flat()
  const finalVideos = forceLiveOnly ? allVideos.filter(v => v.isLive) : allVideos

  // Shuffle
  const shuffled = [...finalVideos].sort(() => Math.random() - 0.5)
  return { videos: shuffled, nextPageTokens: newTokens }
}

export async function fetchPlaylistVideos(playlistId: string, pageToken?: string) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}`
    const data = await smartFetch(url)
    const videoIds = (data.items || []).map((item: any) => item.contentDetails.videoId)
    if (!videoIds.length) return { videos: [] }
    
    const details = await smartFetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}`)
    const videos = (details.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      durationSeconds: parseDuration(item.contentDetails?.duration || 'PT0S'),
      isLive: item.snippet.liveBroadcastContent === 'live',
      isSong: item.snippet.title.toLowerCase().includes('song'),
    }))
    return { videos, nextPageToken: data.nextPageToken }
  } catch (e) { return { videos: [] } }
}

export function saveCachedVideos(videos: YouTubeVideo[]) {
  localStorage.setItem('tottube_video_cache', JSON.stringify({ timestamp: Date.now(), videos: videos.slice(0, 100) }))
}

export function loadCachedVideos(): YouTubeVideo[] {
  try {
    const raw = localStorage.getItem('tottube_video_cache')
    if (!raw) return []
    const data = JSON.parse(raw)
    if (Date.now() - data.timestamp > 7200000) return []
    return data.videos || []
  } catch { return [] }
}
