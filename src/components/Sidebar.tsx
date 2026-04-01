import { Home, Tv, Library, Sparkles, Film } from 'lucide-react'
import { Channel, Playlist } from '../types'

interface SidebarProps {
  channels: Channel[]
  playlists: Playlist[]
  activeChannelFilter: string | null
  activePlaylistId: string | null
  onChannelFilter: (id: string | null) => void
  onPlaylistFilter: (id: string | null) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ 
  channels, 
  activeChannelFilter, 
  activePlaylistId,
  onChannelFilter, 
  onPlaylistFilter,
  isOpen, 
  onClose 
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 md:w-72 bg-slate-900 border-r border-slate-800 
                    transform transition-transform duration-300 ease-in-out lg:transform-none
                    flex flex-col h-screen ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-red-700
                          flex items-center justify-center shadow-lg shadow-red-900/40">
            <span className="text-xl leading-none">🎬</span>
          </div>
          <span className="text-white font-black text-xl tracking-tight leading-none">TotTube</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-none">
          {/* Main Home Link */}
          <button
            onClick={() => { onChannelFilter(null); onPlaylistFilter(null); onClose() }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 tap-target
              ${activeChannelFilter === null && activePlaylistId === null
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/30 font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'}`}
          >
            <div className="w-6 h-6 flex items-center justify-center relative">
              <Home className="w-6 h-6 flex-shrink-0" />
              <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-sm">Mix All</span>
          </button>

          {/* Single Playlists Link */}
          <button
            onClick={() => { onPlaylistFilter('__grid__'); onClose() }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 tap-target
              ${activePlaylistId === '__grid__'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-inner font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'}`}
          >
            <Library className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm">Playlists</span>
          </button>

          {/* Movies Link */}
          <button
            onClick={() => { onPlaylistFilter('movies'); onClose() }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 tap-target
              ${activePlaylistId === 'movies'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-inner font-black' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800 font-bold'}`}
          >
            <Film className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm">Movies</span>
          </button>

          {/* Approved Channels Section */}
          <div className="space-y-1">
            <div className="pt-2 pb-1 px-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Channels</span>
            </div>
            {channels.length === 0 ? (
              <div className="text-center py-4 px-2 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                <Tv className="w-6 h-6 mx-auto text-slate-700 mb-1 opacity-50" />
                <p className="text-[10px] text-slate-600 font-bold">Add channels in vault</p>
              </div>
            ) : (
              channels.map((ch) => (
                <button
                  key={ch.channelId}
                  onClick={() => { onChannelFilter(ch.channelId); onClose() }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 tap-target
                    ${activeChannelFilter === ch.channelId 
                      ? 'bg-red-500/10 text-white border border-red-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
                >
                  <img src={ch.avatarUrl} alt="" className="w-7 h-7 rounded-lg border border-slate-700 flex-shrink-0 grayscale-[0.5] hover:grayscale-0 transition-all" />
                  <span className="font-bold text-sm text-left truncate">{ch.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
