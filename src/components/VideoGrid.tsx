import { VideoCard } from './VideoCard'
import { SkeletonGrid } from './SkeletonGrid'
import { EmptyState } from './EmptyState'
import { YouTubeVideo, Channel, SearchShortcut } from '../types'
import { RefreshCw } from 'lucide-react'

interface VideoGridProps {
  videos: YouTubeVideo[]
  channels: Channel[]
  isLoading: boolean
  onPlay: (video: YouTubeVideo) => void
  onOpenAdmin: () => void
  shortcuts?: SearchShortcut[]
  searchQuery?: string
  onSearch?: (query: string) => void
  activeCategory: string
  onCategoryChange: (cat: string) => void
  onLoadMore: () => void
}

export function VideoGrid({ 
  videos, 
  channels, 
  isLoading, 
  onPlay, 
  onOpenAdmin, 
  shortcuts = [], 
  onSearch, 
  activeCategory, 
  onCategoryChange,
  onLoadMore
}: VideoGridProps) {
  
  // We no longer return early, we render the UI structure and only skeleton the content area

  // Filter content based on category
  const filteredVideos = videos.filter(v => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'live') return v.isLive;
    if (activeCategory === 'songs') return v.isSong;
    if (activeCategory === 'shorts') return (v.durationSeconds || 0) < 300 && !v.isLive;
    if (activeCategory === 'longs') return (v.durationSeconds || 0) >= 300 && !v.isLive;
    return true;
  });

  return (
    <main className="px-4 md:px-6 py-6 max-w-screen-2xl mx-auto animate-fade-in space-y-8 pb-20">
      
      {/* 🍭 Magic Search Carousel */}
      {shortcuts.length > 0 && (
         <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x px-2 pt-2">
            {shortcuts.map(sc => (
               <button
                  key={sc.id}
                  onClick={() => onSearch?.(sc.keyword)}
                  className="flex flex-col items-center gap-3 group flex-shrink-0 snap-start"
               >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-slate-800 
                                group-hover:border-red-500 group-hover:scale-110 transition-all shadow-2xl bg-slate-800">
                     <img src={sc.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                  <span className="text-sm font-black text-slate-400 group-hover:text-white uppercase tracking-wider transition-colors capitalize">
                     {sc.keyword}
                  </span>
               </button>
            ))}
         </div>
      )}

      {/* Category Tabs & Load More */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x relative z-20">
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-black bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all shadow-lg flex-shrink-0 snap-start"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Load More
        </button>

        <div className="w-[2px] h-6 bg-slate-800 flex-shrink-0" />

        <button
          onClick={() => onCategoryChange('all')}
          className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 snap-start shadow-md
            ${activeCategory === 'all' 
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-500/50 scale-105' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'}`}
        >
          Mix of All
        </button>
        {[
          { id: 'live', title: '🔴 Live Now' },
          { id: 'songs', title: '🎵 Kids Songs' },
          { id: 'shorts', title: '🎬 Stories' },
          { id: 'longs', title: '🍿 Long Shows' },
        ].map(cat => (
          <button
            key={`tab-${cat.id}`}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 snap-start shadow-md
              ${activeCategory === cat.id 
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border border-red-500/50 scale-105' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'}`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      {filteredVideos.length === 0 && isLoading ? (
        <SkeletonGrid count={12} />
      ) : filteredVideos.length === 0 && !isLoading ? (
        <EmptyState hasChannels={channels.length > 0} onOpenAdmin={onOpenAdmin} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {filteredVideos.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={onPlay}
            />
          ))}
        </div>
      )}
    </main>
  )
}
