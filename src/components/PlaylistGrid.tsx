import { Sparkles, PlayCircle, Eye } from 'lucide-react'
import { Playlist } from '../types'

interface PlaylistGridProps {
  playlists: Playlist[]
  onSelect: (playlistId: string) => void
}

export function PlaylistGrid({ playlists, onSelect }: PlaylistGridProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-red-900/20 group">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-black uppercase tracking-[0.2em] animate-pulse">
              <Sparkles className="w-4 h-4" /> Recommended Collections
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none italic uppercase">
              Magic <br/> <span className="opacity-80">Playlists</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-md font-medium leading-relaxed">
              Discover curated sets of videos added by your parents. Tap any collection to start watching!
            </p>
          </div>
          
          <div className="absolute top-0 right-0 p-8 h-full flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
            <PlayCircle className="w-64 h-64 text-white -rotate-12" />
          </div>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
          {playlists.map((pl, idx) => (
            <button
              key={pl.id}
              onClick={() => onSelect(pl.id)}
              className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Thumbnail Card */}
              <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-slate-800 shadow-lg group-hover:shadow-2xl group-hover:shadow-red-600/20 group-hover:border-red-600/40 transition-all">
                <img 
                  src={pl.thumbnailUrl} 
                  alt={pl.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay with glass effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                
                {/* Play Button Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-300">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                    <PlayCircle className="w-8 h-8 text-red-600 ml-1" />
                  </div>
                </div>
              </div>

              {/* Title & Info */}
              <div className="mt-4 px-2 space-y-1">
                <h3 className="text-white font-black text-lg md:text-xl truncate group-hover:text-red-400 transition-colors uppercase tracking-tight leading-tight">
                  {pl.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 bg-slate-800/50 px-2.5 py-1 rounded-full">
                    <Eye className="w-3 h-3" /> View Collection
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
