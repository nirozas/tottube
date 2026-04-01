import { useState } from 'react'
import { 
  Shield, Users, Key, Loader2, SearchIcon, X, Trash2, 
  Settings as SettingsIcon, Timer, Film, Sparkles, Library, Moon, Plus
} from 'lucide-react'
import { Channel, AppSettings, Kid, Playlist, Movie } from '../types'
import { fetchChannelInfo, fetchPlaylistInfo, setRuntimeApiKeys } from '../lib/storage'
import { PinEntry } from './PinEntry'
import { KID_AVATARS, PASSCODE_CHARACTERS } from '../constants'

type AdminView = 'pin' | 'dashboard'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  isVaultUnlocked: boolean
  setIsVaultUnlocked: (unlocked: boolean) => void
  channels: Channel[]
  playlists: Playlist[]
  settings: AppSettings
  kids: Kid[]
  currentKid: Kid | null
  minutesUsed: number
  isBedtimeMode: boolean
  setIsBedtimeMode: (mode: boolean) => void
  onAddChannel: (id: string) => Promise<any>
  onRemoveChannel: (id: string) => void
  onAddPlaylist: (id: string) => Promise<void>
  onRemovePlaylist: (id: string) => void
  onUpdateSettings: (s: AppSettings) => void
  onAddKid: (name: string, avatar: string, passcodeId: string) => Promise<void>
  onUpdateKid: (id: string, name: string, avatar: string, passcodeId: string) => Promise<void>
  onUpdateKidChannels: (kidId: string, channelIds: string[]) => void
  onAddShortcut: (keyword: string, imageUrl: string) => Promise<void>
  onRemoveShortcut: (id: string) => void
  movies: Movie[]
  onAddMovie: (title: string, videoUrl: string, thumbnailUrl: string) => Promise<void>
  onRemoveMovie: (id: string) => void
  onResetTimer: (kidId: string) => void
  onSwitchProfile: () => void
  onLogout: () => Promise<void>
}

export function AdminModal({
  isOpen,
  onClose,
  isVaultUnlocked,
  setIsVaultUnlocked,
  channels,
  playlists,
  settings,
  kids,
  currentKid,
  minutesUsed,
  isBedtimeMode,
  setIsBedtimeMode,
  onAddChannel,
  onRemoveChannel,
  onAddPlaylist,
  onRemovePlaylist,
  onUpdateSettings,
  onAddKid,
  onUpdateKid,
  onUpdateKidChannels,
  onAddShortcut,
  onRemoveShortcut,
  movies,
  onAddMovie,
  onRemoveMovie,
  onResetTimer,
  onLogout,
}: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'profiles' | 'timer' | 'settings'>('content')
  const [contentType, setContentType] = useState<'channels' | 'playlists' | 'shortcuts' | 'movies'>('channels')
  
  const [channelInput, setChannelInput] = useState('')
  const [playlistInput, setPlaylistInput] = useState('')
  const [movieTitle, setMovieTitle] = useState('')
  const [movieUrl, setMovieUrl] = useState('')
  const [movieThumb, setMovieThumb] = useState('')
  const [shortcutKeyword, setShortcutKeyword] = useState('')
  const [shortcutImage, setShortcutImage] = useState('')
  
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [addError, setAddError] = useState('')
  const [preview, setPreview] = useState<any>(null)

  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkInput, setBulkInput] = useState('')

  const [kidName, setKidName] = useState('')
  const [kidAvatar, setKidAvatar] = useState(KID_AVATARS[0].url)
  const [kidPasscodeId, setKidPasscodeId] = useState<string>(PASSCODE_CHARACTERS[0].id)
  const [editingKidId, setEditingKidId] = useState<string | null>(null)

  if (!isOpen) return null

  const view: AdminView = isVaultUnlocked ? 'dashboard' : 'pin'

  const handleChannelPreview = async () => {
    let input = channelInput.trim()
    if (!input) return
    
    const atMatch = input.match(/@([a-zA-Z0-9._-]+)/)
    const idMatch = input.match(/channel\/([a-zA-Z0-9_-]{24})/)
    const target = atMatch ? `@${atMatch[1]}` : idMatch ? idMatch[1] : input

    setAddStatus('loading')
    setPreview(null)
    try {
      const info = await fetchChannelInfo(target)
      if (info) {
        setPreview({ ...info, type: 'channel' })
        setAddStatus('idle')
      } else {
        setAddError('Channel not found.')
        setAddStatus('error')
      }
    } catch (e: any) {
      const msg = e.message === 'QUOTA_EXCEEDED' 
        ? '⚠️ Daily YouTube API limit reached. Try again tomorrow.'
        : e.message || 'Fetch failed.'
      setAddError(msg)
      setAddStatus('error')
    }
  }

  const handlePlaylistPreview = async () => {
    let input = playlistInput.trim()
    if (!input) return
    
    const listMatch = input.match(/(?:\?|&)list=([a-zA-Z0-9_-]+)/)
    const playlistId = listMatch ? listMatch[1] : input

    setAddStatus('loading')
    setPreview(null)
    try {
      const info = await fetchPlaylistInfo(playlistId)
      if (info) {
        setPreview({ ...info, type: 'playlist' })
        setAddStatus('idle')
      } else {
        setAddError('Playlist not found.')
        setAddStatus('error')
      }
    } catch (e: any) {
      const msg = e.message === 'QUOTA_EXCEEDED' 
        ? '⚠️ Daily YouTube API limit reached. Try again tomorrow.'
        : e.message || 'Fetch failed.'
      setAddError(msg)
      setAddStatus('error')
    }
  }

  const handleAdd = async () => {
    setAddStatus('loading')
    try {
      if (preview.type === 'channel') {
        await onAddChannel(preview.channelId)
        setChannelInput('')
      } else {
        await onAddPlaylist(preview.id)
        setPlaylistInput('')
      }
      setAddStatus('success')
      setPreview(null)
      setTimeout(() => setAddStatus('idle'), 2000)
    } catch (e: any) {
      setAddError(e.message || 'Add failed')
      setAddStatus('error')
    }
  }

  const handleBulkAdd = async () => {
    const handles = bulkInput.split(/[\n,]/).map(h => h.trim()).filter(h => h)
    if (!handles.length) return
    
    setAddStatus('loading')
    let successCount = 0
    let failedHandles: string[] = []

    for (const handle of handles) {
      try {
        const atMatch = handle.match(/@([a-zA-Z0-9._-]+)/)
        const idMatch = handle.match(/channel\/([a-zA-Z0-9_-]{24})/)
        const target = atMatch ? `@${atMatch[1]}` : idMatch ? idMatch[1] : handle
        
        await onAddChannel(target)
        successCount++
      } catch (e) {
        failedHandles.push(handle)
      }
    }

    if (failedHandles.length > 0) {
      setAddError(`Added ${successCount} channels. Failed: ${failedHandles.join(', ')}`)
      setAddStatus('error')
    } else {
      setBulkInput('')
      setAddStatus('success')
      setTimeout(() => setAddStatus('idle'), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl max-h-[92vh] bg-slate-900 sm:rounded-[3rem] rounded-t-[2.5rem]
                      border border-slate-700/60 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {view === 'pin' ? (
          <PinEntry 
            correctPin={settings.adminPin} 
            onSuccess={() => setIsVaultUnlocked(true)} 
            onLogout={onLogout}
          />
        ) : (
          <>
            <div className="p-8 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/20 p-3 rounded-2xl">
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Parental Vault</h2>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Unlocked Session
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 p-8 overflow-x-auto scrollbar-hide">
              {[
                { id: 'content', icon: Library, label: 'Approved Content' },
                { id: 'profiles', icon: Users, label: 'Kids' },
                { id: 'timer', icon: Timer, label: 'Limits' },
                { id: 'settings', icon: SettingsIcon, label: 'Security' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all whitespace-nowrap shadow-sm
                    ${activeTab === tab.id 
                      ? 'bg-white text-slate-900 scale-105 shadow-2xl shadow-white/5' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8">
              
              {activeTab === 'content' && (
                <div className="space-y-8">
                  <div className="flex bg-slate-800/50 p-1.5 rounded-[1.5rem] border border-slate-700/30">
                    <button 
                      onClick={() => { setContentType('channels'); setPreview(null); setAddStatus('idle') }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all
                        ${contentType === 'channels' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Film className="w-4 h-4" /> Channels
                    </button>
                    <button 
                      onClick={() => { setContentType('playlists'); setPreview(null); setAddStatus('idle') }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all
                        ${contentType === 'playlists' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Sparkles className="w-4 h-4" /> Playlists
                    </button>
                    <button 
                      onClick={() => { setContentType('shortcuts'); setPreview(null); setAddStatus('idle') }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all
                        ${contentType === 'shortcuts' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <SearchIcon className="w-4 h-4" /> Discover
                    </button>
                    <button 
                      onClick={() => { setContentType('movies'); setPreview(null); setAddStatus('idle') }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all
                        ${contentType === 'movies' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Film className="w-4 h-4" /> Movies
                    </button>
                  </div>

                  <div className="bg-slate-800/40 rounded-[2.5rem] p-6 border border-slate-700/50 space-y-5">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                      {contentType === 'shortcuts' ? 'Create Quick Search Keyword' : `Add New ${contentType === 'channels' ? 'Channel' : 'Playlist'}`}
                    </h3>

                    {contentType === 'shortcuts' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <input
                            type="text"
                            value={shortcutKeyword}
                            onChange={e => setShortcutKeyword(e.target.value)}
                            placeholder="Keyword (e.g. Leo, Space)..."
                            className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black"
                          />
                          <input
                            type="text"
                            value={shortcutImage}
                            onChange={e => setShortcutImage(e.target.value)}
                            placeholder="Image URL..."
                            className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black"
                          />
                        </div>
                        <button
                          onClick={() => {
                            onAddShortcut(shortcutKeyword, shortcutImage)
                            setShortcutKeyword('')
                            setShortcutImage('')
                          }}
                          disabled={!shortcutKeyword.trim() || !shortcutImage.trim()}
                          className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-30 active:scale-95 shadow-xl shadow-red-900/40"
                        >
                          Add Magic Shortcut
                        </button>
                        
                        <div className="pt-4 border-t border-slate-700/30">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Or use a Magic Template</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {[
                              { k: 'Space', i: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=200' },
                              { k: 'Animals', i: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200' },
                              { k: 'Dinosaurs', i: 'https://images.unsplash.com/photo-1584844308364-9e43f2cfaa3a?auto=format&fit=crop&q=80&w=200' },
                              { k: 'Trucks', i: 'https://images.unsplash.com/photo-1519003722824-191d446bd382?auto=format&fit=crop&q=80&w=200' },
                              { k: 'Leo', i: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80&w=200' }
                            ].map(tpl => (
                              <button
                                key={tpl.k}
                                onClick={() => onAddShortcut(tpl.k, tpl.i)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all active:scale-95"
                              >
                                🪄 {tpl.k}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : contentType === 'movies' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          <input
                            type="text"
                            value={movieTitle}
                            onChange={e => setMovieTitle(e.target.value)}
                            placeholder="Movie Title..."
                            className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black"
                          />
                          <input
                            type="text"
                            value={movieUrl}
                            onChange={e => setMovieUrl(e.target.value)}
                            placeholder="Video URL (Direct link or YouTube/Vimeo)..."
                            className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black"
                          />
                          <input
                            type="text"
                            value={movieThumb}
                            onChange={e => setMovieThumb(e.target.value)}
                            placeholder="Thumbnail URL (Optional)..."
                            className="bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            setAddStatus('loading')
                            try {
                              await onAddMovie(movieTitle, movieUrl, movieThumb || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200')
                              setMovieTitle('')
                              setMovieUrl('')
                              setMovieThumb('')
                              setAddStatus('success')
                              setTimeout(() => setAddStatus('idle'), 2000)
                            } catch (e: any) {
                              setAddError(e.message || 'Add Failed')
                              setAddStatus('error')
                            }
                          }}
                          disabled={!movieTitle.trim() || !movieUrl.trim()}
                          className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-30 active:scale-95 shadow-xl shadow-red-900/40"
                        >
                          {addStatus === 'loading' ? 'Saving Movie...' : 'Add Movie to Vault'}
                        </button>
                      </div>
                    ) : contentType === 'channels' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Adding Method</p>
                          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                             <button 
                               onClick={() => setIsBulkMode(false)}
                               className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${!isBulkMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}
                             >Single</button>
                             <button 
                               onClick={() => setIsBulkMode(true)}
                               className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${isBulkMode ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}
                             >Bulk</button>
                          </div>
                        </div>

                        {isBulkMode ? (
                          <div className="space-y-4">
                            <textarea
                              value={bulkInput}
                              onChange={e => setBulkInput(e.target.value)}
                              placeholder="Paste multiple @handles or channel IDs... (one per line)"
                              className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black min-h-[120px] resize-none"
                            />
                            <button
                              onClick={handleBulkAdd}
                              disabled={addStatus === 'loading' || !bulkInput.trim()}
                              className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-30 active:scale-95 shadow-xl shadow-red-900/40"
                            >
                               {addStatus === 'loading' ? 'Adding to Vault...' : 'Bulk Add Channels'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={channelInput}
                              onChange={e => { 
                                setChannelInput(e.target.value)
                                setAddStatus('idle')
                                setPreview(null) 
                              }}
                              placeholder="@handle or channel ID..."
                              className="flex-1 bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black"
                              onKeyDown={e => e.key === 'Enter' && handleChannelPreview()}
                            />
                            <button
                              onClick={handleChannelPreview}
                              disabled={addStatus === 'loading' || !channelInput.trim()}
                              className="bg-slate-700 hover:bg-slate-600 text-white px-8 rounded-2xl font-black transition-all disabled:opacity-30 active:scale-95 shadow-md shadow-black/20"
                            >
                              {addStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <SearchIcon className="w-5 h-5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={playlistInput}
                          onChange={e => { 
                            setPlaylistInput(e.target.value)
                            setAddStatus('idle')
                            setPreview(null) 
                          }}
                          placeholder="YouTube Playlist ID (PL...)"
                          className="flex-1 bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition-all font-black"
                          onKeyDown={e => e.key === 'Enter' && handlePlaylistPreview()}
                        />
                        <button
                          onClick={handlePlaylistPreview}
                          disabled={addStatus === 'loading' || !playlistInput.trim()}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-8 rounded-2xl font-black transition-all disabled:opacity-30 active:scale-95 shadow-md shadow-black/20"
                        >
                          {addStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <SearchIcon className="w-5 h-5" />}
                        </button>
                      </div>
                    )}

                    {preview && (
                      <div className="bg-slate-900 rounded-[2rem] p-5 border-2 border-green-500/30 flex items-center gap-5 animate-in zoom-in-95 duration-200">
                        <img src={preview.avatarUrl || preview.thumbnailUrl} className="w-14 h-14 rounded-2xl ring-4 ring-green-500/10 shadow-lg object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-black text-lg leading-tight truncate">{preview.name || preview.title}</p>
                          <p className="text-green-500 text-xs font-black uppercase tracking-widest">
                            {preview.type === 'channel' ? `${preview.subscriberCount} Subscribers` : 'Curated Playlist'}
                          </p>
                        </div>
                        <button
                          onClick={handleAdd}
                          className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-green-900/40 active:scale-95 transition-all"
                        >
                          Add {preview.type === 'channel' ? 'Channel' : 'Playlist'}
                        </button>
                      </div>
                    )}

                    {addStatus === 'error' && <p className="text-red-400 text-xs font-black uppercase tracking-widest px-1">{addError}</p>}
                  </div>

                  {/* List View */}
                  <div className="space-y-4 pb-12">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                      {contentType === 'shortcuts' 
                        ? `Active Shortcuts (${(settings.shortcuts || []).length})`
                        : contentType === 'movies'
                        ? `Movies Vault (${movies.length})`
                        : `Approved ${contentType === 'channels' ? 'Channels' : 'Playlists'} (${contentType === 'channels' ? channels.length : playlists.length})`}
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {contentType === 'shortcuts' ? (
                        (settings.shortcuts || []).map(sc => (
                          <div key={sc.id} className="bg-slate-800/40 border-2 border-slate-700/30 p-5 rounded-[2rem] flex items-center gap-5 group hover:border-slate-600 transition-all shadow-sm">
                            <img src={sc.imageUrl} className="w-12 h-12 rounded-2xl shadow-lg ring-2 ring-slate-700 object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-black text-lg truncate capitalize">{sc.keyword}</p>
                              <p className="text-slate-500 text-xs font-bold truncate tracking-tight">Magic Search Shortcut</p>
                            </div>
                            <button
                              onClick={() => {
                                onRemoveShortcut(sc.id)
                              }}
                              className="text-slate-600 hover:text-red-500 p-3 hover:bg-red-500/10 rounded-2xl transition-all sm:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        ))
                      ) : contentType === 'movies' ? (
                        movies.map(movie => (
                          <div key={movie.id} className="bg-slate-800/40 border-2 border-slate-700/30 p-5 rounded-[2rem] flex items-center gap-5 group hover:border-slate-600 transition-all shadow-sm">
                            <img src={movie.thumbnailUrl} className="w-12 h-12 rounded-2xl shadow-lg ring-2 ring-slate-700 object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-black text-lg truncate">{movie.title}</p>
                              <p className="text-slate-500 text-xs font-bold truncate tracking-tight">{movie.videoUrl.slice(0, 40)}...</p>
                            </div>
                            <button
                              onClick={() => onRemoveMovie(movie.id)}
                              className="text-slate-600 hover:text-red-500 p-3 hover:bg-red-500/10 rounded-2xl transition-all sm:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        ))
                      ) : contentType === 'channels' ? (
                        channels.map(channel => (
                          <div key={channel.channelId} className="bg-slate-800/40 border-2 border-slate-700/30 p-5 rounded-[2rem] flex items-center gap-5 group hover:border-slate-600 transition-all shadow-sm">
                            <img src={channel.avatarUrl} className="w-12 h-12 rounded-2xl shadow-lg ring-2 ring-slate-700" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-black text-lg truncate">{channel.name}</p>
                              <p className="text-slate-500 text-xs font-bold truncate tracking-tight">@{channel.handle}</p>
                            </div>
                            <button
                              onClick={() => onRemoveChannel(channel.channelId)}
                              className="text-slate-600 hover:text-red-500 p-3 hover:bg-red-500/10 rounded-2xl transition-all sm:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        ))
                      ) : (
                        playlists.map(pl => (
                          <div key={pl.id} className="bg-slate-800/40 border-2 border-slate-700/30 p-5 rounded-[2rem] flex items-center gap-5 group hover:border-slate-600 transition-all shadow-sm">
                            <img src={pl.thumbnailUrl} className="w-12 h-12 rounded-2xl shadow-lg ring-2 ring-slate-700 object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-black text-lg truncate">{pl.title}</p>
                              <p className="text-slate-500 text-xs font-bold truncate tracking-tight">YouTube Playlist</p>
                            </div>
                            <button
                              onClick={() => onRemovePlaylist(pl.id)}
                              className="text-slate-600 hover:text-red-500 p-3 hover:bg-red-500/10 rounded-2xl transition-all sm:opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profiles' && (
                <div className="space-y-8 pb-10">
                   <div className="space-y-4">
                     <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Manage Kids</h3>
                        <button 
                          onClick={() => {
                            setEditingKidId(null)
                            setKidName('')
                            setKidAvatar(KID_AVATARS[0].url)
                            setKidPasscodeId(PASSCODE_CHARACTERS[0].id)
                          }}
                          className={`${!editingKidId ? 'text-red-500' : 'text-slate-400'} text-xs font-black uppercase flex items-center gap-1.5`}
                        >
                          <Plus className="w-4 h-4" /> New Profile
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        {kids.map(kid => (
                          <button
                            key={kid.id}
                            onClick={() => {
                              setEditingKidId(kid.id)
                              setKidName(kid.name)
                              setKidAvatar(kid.avatarUrl)
                              setKidPasscodeId(kid.passcodeAvatarId || PASSCODE_CHARACTERS[0].id)
                            }}
                            className={`p-4 rounded-3xl border-2 transition-all flex items-center gap-3
                              ${editingKidId === kid.id ? 'bg-red-500/10 border-red-500 text-white' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                          >
                           <img src={kid.avatarUrl} className="w-10 h-10 rounded-2xl shadow-lg" alt="" />
                           <span className="font-black text-sm truncate">{kid.name}</span>
                          </button>
                        ))}
                     </div>
                   </div>

                   <div className="bg-slate-800/40 rounded-[2.5rem] p-8 border border-slate-700/50 space-y-8">
                      <div className="space-y-4 text-center">
                        <div className="relative inline-block mx-auto">
                          <img src={kidAvatar} className="w-24 h-24 rounded-[2rem] shadow-2xl ring-4 ring-slate-900" alt="Avatar" />
                          <div className="absolute -bottom-2 -right-2 bg-red-600 p-2 rounded-xl border-4 border-slate-900 shadow-xl">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={kidName}
                          onChange={e => setKidName(e.target.value)}
                          placeholder="Name your kid..."
                          className="w-full text-center bg-transparent text-2xl font-black text-white focus:outline-none placeholder:text-slate-700"
                        />
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Choose Avatar</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 -mx-4">
                          {KID_AVATARS.map(av => (
                            <button
                              key={av.id}
                              onClick={() => setKidAvatar(av.url)}
                              className={`flex-shrink-0 w-16 h-16 rounded-2xl transition-all overflow-hidden border-4
                                ${kidAvatar === av.url ? 'border-red-500 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                            >
                              <img src={av.url} className="w-full h-full object-cover" alt="" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Pick Unlock Friend</h3>
                        <div className="grid grid-cols-5 gap-3">
                          {PASSCODE_CHARACTERS.map(char => (
                            <button
                              key={char.id}
                              onClick={() => setKidPasscodeId(char.id)}
                              className={`aspect-square rounded-2xl p-2 transition-all flex items-center justify-center border-4
                                ${kidPasscodeId === char.id ? 'bg-red-500/20 border-red-500 scale-110 shadow-xl' : 'bg-slate-900 border-slate-800 opacity-30 hover:opacity-100 hover:scale-105'}`}
                            >
                              <img src={char.url} className="w-full h-full object-contain" alt="" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">Approved Channels</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                          {channels.map(ch => {
                            const isSelected = kids.find(k => k.id === editingKidId)?.allowedChannels?.includes(ch.channelId)
                            return (
                              <button
                                key={ch.channelId}
                                onClick={() => {
                                  if (!editingKidId) return
                                  const current = kids.find(k => k.id === editingKidId)?.allowedChannels || []
                                  if (isSelected) onUpdateKidChannels(editingKidId, current.filter(id => id !== ch.channelId))
                                  else onUpdateKidChannels(editingKidId, [...current, ch.channelId])
                                }}
                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all
                                  ${isSelected ? 'bg-red-500/10 border-red-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                              >
                                <img src={ch.avatarUrl} className="w-6 h-6 rounded-lg" alt="" />
                                <span className="text-xs font-bold truncate">{ch.name}</span>
                                <div className={`ml-auto w-4 h-4 rounded-full border-2 ${isSelected ? 'bg-red-500 border-red-500' : 'border-slate-700'}`} />
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (editingKidId) onUpdateKid(editingKidId, kidName, kidAvatar, kidPasscodeId)
                          else onAddKid(kidName, kidAvatar, kidPasscodeId)
                          setKidName('')
                          setEditingKidId(null)
                        }}
                        disabled={!kidName.trim()}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-red-900/40 transition-all active:scale-95 disabled:opacity-20"
                      >
                        {editingKidId ? 'Save Profile' : 'Create Profile'}
                      </button>
                   </div>
                </div>
              )}

              {activeTab === 'timer' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-slate-800/40 rounded-[2.5rem] p-8 border border-slate-700/50 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Timer className="w-10 h-10 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Watch Time Limiter</h3>
                      <p className="text-slate-400 text-sm mt-1">Set the daily screen time for your kids.</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-8 py-4">
                      {[15, 30, 45, 60, 90, 120].map(mins => (
                        <button
                          key={mins}
                          onClick={() => onUpdateSettings({ ...settings, dailyLimitMinutes: mins })}
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black transition-all
                            ${settings.dailyLimitMinutes === mins 
                              ? 'bg-amber-500 text-slate-900 scale-125 shadow-xl shadow-amber-900/20' 
                              : 'bg-slate-800 text-slate-500 hover:text-white hover:bg-slate-700'}`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-slate-800/50">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Current Usage</p>
                      <div className="text-4xl font-black text-white tabular-nums tracking-tight">
                        {Math.floor(minutesUsed)} <span className="text-slate-600 text-xl">minutes consumed</span>
                      </div>
                      <button
                        onClick={() => {
                          if (currentKid) onResetTimer(currentKid.id)
                          else if (confirm('Reset usage for ALL kids?')) kids.forEach(k => onResetTimer(k.id))
                        }}
                        className="mt-6 bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all active:scale-95"
                      >
                        Reset Daily Timer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-800/40 rounded-[2.5rem] p-8 border border-slate-700/50 space-y-6">
                      <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Key className="w-10 h-10 text-red-500" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-black text-white">Security Controls</h3>
                        <p className="text-slate-400 text-sm mt-1">Manage app access and API configuration.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isBedtimeMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                               <Moon className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-white font-black text-sm">Bedtime Mode</p>
                               <p className="text-slate-500 text-[10px] font-bold">Dims screen & shows stars</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsBedtimeMode(!isBedtimeMode)}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isBedtimeMode ? 'bg-indigo-600 shadow-lg shadow-indigo-900/40' : 'bg-slate-800'}`}
                          >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md ${isBedtimeMode ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">YouTube API Keys</p>
                           <textarea
                             value={settings.youtubeApiKeys || ''}
                             onChange={(e) => onUpdateSettings({ ...settings, youtubeApiKeys: e.target.value })}
                             placeholder="AIzaSy... , AIzaSy..."
                             className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white text-xs font-mono focus:border-red-500 outline-none min-h-[100px] resize-none"
                           />
                           <button
                             onClick={() => {
                               if (settings.youtubeApiKeys) {
                                 setRuntimeApiKeys(settings.youtubeApiKeys)
                               }
                             }}
                             className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-700"
                           >
                             Apply & Refresh App
                           </button>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-slate-900 rounded-3xl border border-slate-800 shadow-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-800 rounded-2xl text-slate-500">
                               <Key className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-white font-black text-sm">Update Vault PIN</p>
                               <p className="text-slate-500 text-[10px] font-bold">Change 4-digit parent code</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newPin = prompt('Enter new 4-digit PIN (numbers only):', settings.adminPin)
                              if (newPin && /^\d{4}$/.test(newPin)) onUpdateSettings({ ...settings, adminPin: newPin })
                              else if (newPin) alert('Invalid PIN! Please use 4 digits.')
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
