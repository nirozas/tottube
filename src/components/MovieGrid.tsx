import { Play, Calendar, Film } from 'lucide-react'
import { Movie } from '../types'

interface MovieGridProps {
  movies: Movie[]
  onPlay: (movie: any) => void
}

export function MovieGrid({ movies, onPlay }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-800/50 rounded-[2rem] flex items-center justify-center border border-slate-700/50 shadow-2xl">
          <Film className="w-10 h-10 text-slate-500" />
        </div>
        <div className="max-w-xs">
          <h3 className="text-xl font-black text-white mb-2">No Movies Yet</h3>
          <p className="text-slate-500 text-sm font-medium">
            Ask Mom or Dad to add some movies in the Parental Vault!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="mb-8 flex items-center gap-4">
          <div className="bg-red-500/20 p-3 rounded-2xl">
            <Film className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Movie Vault</h2>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
              {movies.length} {movies.length === 1 ? 'Special Feature' : 'Curated Movies'}
            </p>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 pb-32">
        {movies.map((movie) => (
          <button
            key={movie.id}
            onClick={() => onPlay(movie)}
            className="group relative bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800/60
                       hover:border-red-500/50 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-red-900/20"
          >
            {/* Thumbnail */}
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={movie.thumbnailUrl} 
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                  <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
                </div>
              </div>

              {/* Badge */}
              <div className="absolute top-4 left-4">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] text-white font-black uppercase tracking-widest">Movie</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-6 space-y-3">
              <h3 className="text-white font-black text-lg leading-tight line-clamp-2 text-left group-hover:text-red-400 transition-colors">
                {movie.title}
              </h3>
              
              <div className="flex items-center gap-4 text-slate-500 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Added {new Date(movie.addedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
