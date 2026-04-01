import { Channel, YouTubeVideo, WatchSession, AppSettings, Playlist, SearchShortcut } from '../types'
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
    const { data, error } = await supabase.from('tottube_channels').select('*').order('addedAt', { ascending: true })
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
  if (error) await supabase.from('tottube_channels').upsert(payload, { onConflict: 'channelId,user_id' })
}

export async function removeChannel(channelId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('tottube_channels').delete().eq('channelId', channelId)
}

// ─── Playlists ────────────────────────────────────────────────
export async function getPlaylists(): Promise<Playlist[]> {
  if (!isSupabaseConfigured || !supabase) return []
  try {
    const { data, error } = await supabase.from('tottube_playlists').select('*').order('addedAt', { ascending: true })
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

// ─── Live Vault (Radar) ──────────────────────────────────────
export async function getSavedLiveStreams(): Promise<YouTubeVideo[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data } = await supabase.from('tottube_lives').select('*').order('addedAt', { ascending: false })
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
} else {
  console.log(`✅ TotTube: Initialized with ${API_KEYS.length} API keys starting with ${API_KEYS[0].slice(0, 6)}...`)
}

let currentKeyIndex = 0
let totalRotations = 0

export function setRuntimeApiKeys(keys: string) {
  localStorage.setItem('tottube_runtime_api_keys', keys)
  window.location.reload() // Reload to apply new keys
}

export function resetRotationCount() {
  totalRotations = 0
  console.log("♻️ API Quota Guard Reset. Starting fresh rotation cycle!")
}

function getActiveKey(): string {
  if (API_KEYS.length === 0) return 'YOUR_YOUTUBE_API_KEY_HERE'
  return API_KEYS[currentKeyIndex % API_KEYS.length]
}

function rotateKey(): boolean {
  if (API_KEYS.length <= 1) return false
  
  // Two full circles (Two full cycles through all keys)
  if (totalRotations >= API_KEYS.length * 2) {
    console.warn("🛡️ API Quota Guard: Completed 2 full cycles. Terminating rotation until manual refresh.")
    return false
  }

  totalRotations++
  currentKeyIndex++
  const active = getActiveKey()
  console.log(`📡 Rotating to API Key ${currentKeyIndex % API_KEYS.length + 1}/${API_KEYS.length} (Cycle ${Math.floor(totalRotations / API_KEYS.length) + 1}. ENDS with: ...${active.slice(-4)})`)
  return true
}

// ─── Diagnostic API Call Helper ──────────────────────────────────
async function smartFetch(url: string, retryOnQuota = true): Promise<any> {
  const activeKey = getActiveKey()
  const res = await fetch(`${url}&key=${activeKey}`)
  
  if (res.status === 403 || res.status === 400) {
    const errorData = await res.json().catch(() => ({}))
    const msg = errorData.error?.message || 'Forbidden/Bad Request'
    const reason = errorData.error?.errors?.[0]?.reason || ''
    
    console.error(`🎬 YouTube API ERROR ${res.status} on Key ${currentKeyIndex % API_KEYS.length + 1}: ${msg} (${reason})`)
    
    if (retryOnQuota && (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || res.status === 403) && rotateKey()) {
      return smartFetch(url, true)
    }
    
    if (res.status === 400 && activeKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
      throw new Error('MISSING_API_KEY')
    }

    throw new Error(reason === 'quotaExceeded' ? 'QUOTA_EXCEEDED' : `API_ERROR_${res.status}`)
  }
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ─── YouTube API ────────────────────────────────────────────────
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
  } catch (err: any) {
    if (err.message === 'QUOTA_EXCEEDED') throw err
    return null
  }
}

function parseDuration(pt: string): number {
  const match = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = parseInt(match[1] || '0', 10)
  const m = parseInt(match[2] || '0', 10)
  const s = parseInt(match[3] || '0', 10)
  return h * 3600 + m * 60 + s
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

  const allVideos: YouTubeVideo[] = []
  const newTokens: Record<string, string> = {}

  for (const channelId of channelIds) {
    try {
      let data: any = {}
      let videoIdsToFetch: string[] = []
      
      const isMixView = !forceLiveOnly && (!searchQuery || searchQuery === '-shorts -#shorts') && (!videoDuration || videoDuration === 'any')

      if (isMixView) {
        // Optimized Uploads Playlist View (1 unit cost)
        const uploadsPlaylistId = channelId.replace('UC', 'UU')
        const baseUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`
        const pg = pageTokens?.[channelId] ? `&pageToken=${pageTokens[channelId]}` : ''
        
        data = await smartFetch(baseUrl + pg)
        if (data.nextPageToken) newTokens[channelId] = data.nextPageToken
        if (!data.items?.length) continue
        
        videoIdsToFetch = data.items.map((item: any) => item.contentDetails.videoId)
      } else {
        // Deep search or Force Live Only
        const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=${maxResults}${forceLiveOnly ? '&eventType=live' : ''}`
        let query = searchQuery ? `${searchQuery} -shorts -#shorts` : '-shorts -#shorts'
        let url = `${baseUrl}&q=${encodeURIComponent(query.trim())}`
        if (pageTokens?.[channelId]) url += `&pageToken=${pageTokens[channelId]}`
        if (videoDuration && videoDuration !== 'any') url += `&videoDuration=${videoDuration}`
        
        data = await smartFetch(url)
        if (data.nextPageToken) newTokens[channelId] = data.nextPageToken
        if (!data.items?.length) continue
        
        videoIdsToFetch = data.items.filter((item: any) => item.id?.videoId).map((item: any) => item.id.videoId)
      }

      if (videoIdsToFetch.length > 0) {
        // Fetch full video details (durations, live status) for ALL views
        // This takes 1 unit and enables the duration badges + category filtering
        const detailsData = await smartFetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIdsToFetch.join(',')}`)
        
        const mappedVideos: YouTubeVideo[] = (detailsData.items || []).map((item: any) => ({
           id: item.id,
           title: item.snippet.title,
           thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
           channelId,
           publishedAt: item.snippet.publishedAt,
           durationSeconds: parseDuration(item.contentDetails?.duration || 'PT0S'),
           isLive: item.snippet.liveBroadcastContent === 'live',
           isSong: item.snippet.title.toLowerCase().includes('song'),
        }))
        allVideos.push(...mappedVideos)
      }
    } catch (error: any) {
      console.error(`Error fetching channel ${channelId}:`, error)
      if (error.message === 'QUOTA_EXCEEDED') throw error 
    }
  }

  // Shuffle the result
  const shuffled = [...allVideos]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return { videos: shuffled, nextPageTokens: newTokens }
}

export async function fetchPlaylistVideos(
  playlistId: string,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[], nextPageToken?: string }> {
  const baseUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50`
  const pg = pageToken ? `&pageToken=${pageToken}` : ''
  
  try {
    const data = await smartFetch(baseUrl + pg)
    if (!data.items?.length) return { videos: [] }
    
    const videoIds = data.items.map((item: any) => item.contentDetails.videoId)
    const detailsData = await smartFetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}`)
    
    const mappedVideos: YouTubeVideo[] = (detailsData.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      durationSeconds: parseDuration(item.contentDetails?.duration || 'PT0S'),
      isLive: item.snippet.liveBroadcastContent === 'live',
      isSong: item.snippet.title.toLowerCase().includes('song'),
    }))
    
    return {
      videos: mappedVideos,
      nextPageToken: data.nextPageToken
    }
  } catch (err) {
    console.error('Magic Playlist fetch failed:', err)
    return { videos: [] }
  }
}
