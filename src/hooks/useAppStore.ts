import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getSettings, saveSettings,
  getChannels, addChannel, removeChannel,
  getPlaylists, addPlaylist, removePlaylist,
  fetchChannelInfo, fetchPlaylistInfo, fetchVideosFromChannels, fetchPlaylistVideos,
  getTodaySession, saveTodaySession, resetTodaySession,
  getSavedLiveStreams, saveLiveStreams,
  addShortcut, removeShortcut,
  loadCachedVideos, saveCachedVideos,
  getMovies, addMovie, removeMovie
} from '../lib/storage'
import { AppSettings, Channel, YouTubeVideo, Kid, Playlist, Movie } from '../types'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAppStore() {
  // ─── State ───────────────────────────────────────────────────
  const [settings, setSettings] = useState<AppSettings>({
    dailyLimitMinutes: 60,
    adminPin: '1234',
    isSetup: true,
  })
  const [kids, setKids] = useState<Kid[]>([])
  const [currentKid, setCurrentKid] = useState<Kid | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [nextTokens, setNextTokens] = useState<Record<string, string>>({})
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false)
  const [minutesUsed, setMinutesUsed] = useState(0)
  const [activeChannelFilter, setActiveChannelFilter] = useState<string | null>(null)
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null)
  const [isPlayerVisible, setIsPlayerVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [isBedtimeMode, setIsBedtimeMode] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) 

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef = useRef(0)

  // ─── Harvesting Logic (The "Initial Scan") ───────────────────
  const harvestContent = useCallback(async (channelList: Channel[]) => {
    if (!channelList.length) return
    console.log("🚜 Starting Content Harvest...")
    
    try {
      // 1. Find all active lives across all channels (Deep Lookup)
      const targetIds = channelList.map(c => c.channelId)
      const { videos: discoveredLives } = await fetchVideosFromChannels(
        targetIds, '', 'any', undefined, true, 30 // maxResults: 30
      )
      
      if (discoveredLives.length > 0) {
        console.log(`📡 Harvested ${discoveredLives.length} live streams! Saving to vault...`)
        await saveLiveStreams(discoveredLives)
      }

      // 2. Initial fetch of videos for all channels if state is empty
      const { videos: initialVids } = await fetchVideosFromChannels(targetIds, '', 'any', undefined, false, 30)
      setVideos(initialVids)
    } catch (err) {
      console.warn("Harvest incomplete:", err)
    }
  }, [])

  // ─── Init ────────────────────────────────────────────────────
  const refreshState = useCallback(async () => {
    if (!supabase) {
      console.warn('📡 App: Supabase not configured. Using local/offline state.')
      setIsAuthenticated(false)
      setIsLoading(false)
      const mockMovies = await getMovies()
      setMovies(mockMovies)
      return
    }
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      if (!session) {
        setUser(null)
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }
      
      setUser(session.user)
      setIsAuthenticated(true)
      setIsLoading(true)
      
      const [s, ch, pl, mv] = await Promise.all([
        getSettings(),
        getChannels(),
        getPlaylists(),
        getMovies()
      ])
      
      setSettings({ ...s, isSetup: s.isSetup ?? false })
      setChannels(ch)
      setPlaylists(pl)
      setMovies(mv)
      setKids(s.kids || [])
      
      const cached = loadCachedVideos()
      if (cached.length > 0) setVideos(cached)

      if (ch.length > 0) {
        await harvestContent(ch)
      }
    } catch (err) {
      console.error('📡 App: State refresh failed:', err)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [harvestContent])

  useEffect(() => {
    refreshState()

    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`🔑 Auth State Event: ${_event}`)
      if (session) {
        setUser(session.user)
        setIsAuthenticated(true)
        refreshState()
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setKids([])
        setChannels([])
        setPlaylists([])
        setMovies([])
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshState])

  const setProfile = useCallback(async (kid: Kid | null) => {
    setCurrentKid(kid)
    setActiveChannelFilter(null)
    setActivePlaylistId(null)
    if (kid) {
      setIsLoading(true)
      const session = await getTodaySession(kid.id)
      setMinutesUsed(session.minutesWatched)
      setIsLoading(false)
    } else {
      setMinutesUsed(0)
    }
  }, [])

  // ─── Smart Fetcher / Router ────────────────────────────────────
  const refreshVideos = useCallback(async (opts?: {
    channelList?: Channel[], 
    playlistId?: string | null,
    query?: string, 
    category?: string, 
    append?: boolean,
    force?: boolean
  }) => {
    const list = opts?.channelList ?? channels
    const q = opts?.query ?? searchQuery
    const cat = opts?.category ?? activeCategory
    const plId = opts?.hasOwnProperty('playlistId') ? opts.playlistId : activePlaylistId
    const append = opts?.append ?? false
    const force = opts?.force ?? false
    
    // --- 🌍 LOCAL FIRST (Save API Credits) ---
    // Only hit the API if:
    // 1. Explicitly forced (Manual Refresh)
    // 2. Appending (Load More)
    // 3. We have no videos at all (Initial boot if harvest failed)
    if (!force && !append && videos.length > 0) {
       console.log("⚡ Skipping API call: Using in-memory content for filtering/search.")
       return
    }

    if (plId === 'movies') {
       setIsLoading(false)
       return
    }

    setIsLoading(true)
    try {
      let finalVids: YouTubeVideo[] = []
      let finalTokens: Record<string, string> = {}

      // --- 📡 LIVE VAULT FETCH ---
      if (cat === 'live') {
        const savedLives = await getSavedLiveStreams()
        finalVids = activeChannelFilter 
           ? savedLives.filter(v => v.channelId === activeChannelFilter)
           : savedLives
      } 
      else if (plId) {
        if (plId === '__grid__' || plId === 'movies') {
          setIsLoading(false)
          return
        }
        const res = await fetchPlaylistVideos(plId, append ? nextTokens.playlist : undefined)
        finalVids = res.videos
        finalTokens = { playlist: res.nextPageToken || '' }
      } 
      else {
        // Standard Mix/Search
        const targetIds = activeChannelFilter ? [activeChannelFilter] : list.map(c => c.channelId)
        if (!targetIds.length) { setVideos([]); setIsLoading(false); return }

        const { videos: vids, nextPageTokens: updatedTokens } = await fetchVideosFromChannels(
          targetIds, q, 'any', append ? nextTokens : undefined
        )
        
        finalVids = vids
        finalTokens = updatedTokens
      }

      if (append) {
        const combined = [...videos, ...finalVids]
        setVideos(combined)
        setNextTokens(prev => ({ ...prev, ...finalTokens }))
        saveCachedVideos(combined)
      } else {
        setVideos(finalVids)
        setNextTokens(finalTokens)
        saveCachedVideos(finalVids)
      }
    } catch (err: any) {
       console.error('Refresh failed:', err)
       if (!append) {
         const cached = loadCachedVideos()
         if (cached.length) setVideos(cached)
       }
    } finally {
      setIsLoading(false)
    }
  }, [channels, playlists, searchQuery, activeCategory, activeChannelFilter, activePlaylistId, nextTokens, videos])

  const setCategory = useCallback((cat: string) => {
    setActiveCategory(cat)
    // Removed refreshVideos call to save credits
  }, [])

  const toggleChannelFilter = useCallback((channelId: string | null) => {
    setActiveChannelFilter(channelId)
    setActivePlaylistId(null)
    // Removed refreshVideos call to save credits
  }, [])

  const togglePlaylistFilter = useCallback((playlistId: string | null) => {
    setActivePlaylistId(playlistId)
    setActiveChannelFilter(null)
    // Hits API for playlists as they aren't fully harvested on start
    refreshVideos({ playlistId, force: true })
  }, [refreshVideos])

  // ─── Actions ─────────────────────────────────────────────────
  const handleUpdateSettings = async (s: AppSettings) => {
    await saveSettings(s)
    setSettings(s)
    setKids(s.kids || [])
  }

  const handleAddChannel = async (id: string) => {
    const info = await fetchChannelInfo(id)
    if (!info) throw new Error('Channel not found')
    const newChannel: Channel = { ...info, addedAt: new Date().toISOString() }
    await addChannel(newChannel)
    setChannels(prev => [...prev, newChannel])
  }

  const handleRemoveChannel = async (id: string) => {
    await removeChannel(id)
    setChannels(prev => prev.filter(c => c.channelId !== id))
  }

  const handleAddPlaylist = async (id: string) => {
    const info = await fetchPlaylistInfo(id)
    if (!info) throw new Error('Playlist not found')
    await addPlaylist(info)
    setPlaylists(prev => [...prev, info])
  }

  const handleRemovePlaylist = async (id: string) => {
    await removePlaylist(id)
    setPlaylists(prev => prev.filter(p => p.id !== id))
  }

  const handleAddMovie = async (title: string, videoUrl: string, thumbnailUrl: string) => {
     const movie: Movie = {
        id: crypto.randomUUID(),
        title,
        videoUrl,
        thumbnailUrl,
        addedAt: new Date().toISOString()
     }
     await addMovie(movie)
     setMovies(prev => [movie, ...prev])
  }

  const handleRemoveMovie = async (id: string) => {
     await removeMovie(id)
     setMovies(prev => prev.filter(m => m.id !== id))
  }

  const handleAddKid = async (name: string, avatar: string, passcodeId?: string) => {
    const newKid: Kid = { id: crypto.randomUUID(), name, avatarUrl: avatar, passcodeAvatarId: passcodeId || 'ava1', allowedChannels: [] }
    const newKids = [...kids, newKid]
    await handleUpdateSettings({ ...settings, kids: newKids })
  }

  const handleUpdateKid = async (id: string, name: string, avatar: string, passcodeId: string) => {
    const newKids = kids.map(k => k.id === id ? { ...k, name, avatarUrl: avatar, passcodeAvatarId: passcodeId } : k)
    await handleUpdateSettings({ ...settings, kids: newKids })
  }

  const handleUpdateKidChannels = async (kidId: string, channelIds: string[]) => {
    const newKids = kids.map(k => k.id === kidId ? { ...k, allowedChannels: channelIds } : k)
    await handleUpdateSettings({ ...settings, kids: newKids })
  }

  const handleAddShortcut = async (keyword: string, imageUrl: string) => {
    const newShortcut = { id: crypto.randomUUID(), keyword, imageUrl }
    await addShortcut(newShortcut)
    setSettings(prev => ({
      ...prev,
      shortcuts: [...(prev.shortcuts || []), newShortcut]
    }))
  }

  const handleRemoveShortcut = async (id: string) => {
    await removeShortcut(id)
    setSettings(prev => ({
      ...prev,
      shortcuts: (prev.shortcuts || []).filter(s => s.id !== id)
    }))
  }

  // ─── Timer ───────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      secondsRef.current += 1
      if (secondsRef.current >= 60) {
        setMinutesUsed(prev => {
          const newMins = prev + 1
          if (currentKid) saveTodaySession(currentKid.id, newMins)
          return newMins
        })
        secondsRef.current = 0
      }
    }, 1000)
  }, [currentKid])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onResetTimer = async (kidId: string) => {
    await resetTodaySession(kidId)
    if (currentKid?.id === kidId) setMinutesUsed(0)
  }

  return {
    settings, kids, currentKid, channels, playlists, movies, videos, isLoading,
    isAdminOpen, isVaultUnlocked, minutesUsed, activeChannelFilter, activePlaylistId,
    currentVideo, isPlayerVisible, searchQuery, activeCategory,
    setIsAdminOpen, setIsVaultUnlocked, setProfile, refreshVideos, setCategory,
    toggleChannelFilter, togglePlaylistFilter, handleUpdateSettings,
    handleAddChannel, handleRemoveChannel, handleAddPlaylist, handleRemovePlaylist,
    handleAddMovie, handleRemoveMovie,
    handleAddKid, handleUpdateKid, handleUpdateKidChannels,
    handleAddShortcut, handleRemoveShortcut,
    setCurrentVideo, setIsPlayerVisible, setSearchQuery, onResetTimer, startTimer, stopTimer,
    isBedtimeMode,
    setIsBedtimeMode,
    user, isAuthenticated,
    handleLogout: async () => {
      if (supabase) await supabase.auth.signOut()
    }
  }
}
