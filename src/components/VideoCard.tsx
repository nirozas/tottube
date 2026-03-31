import { useState } from 'react'
import { Play } from 'lucide-react'
import { YouTubeVideo } from '../types'

interface VideoCardProps {
  video: YouTubeVideo
  onPlay: (video: YouTubeVideo) => void
}

export function VideoCard({ video, onPlay }: VideoCardProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const fallbackThumb = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`

  return (
    <div
      className="video-card group tap-target"
      onClick={() => onPlay(video)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${video.title}`}
      onKeyDown={e => e.key === 'Enter' && onPlay(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
        {!imgLoaded && (
          <div className="skeleton absolute inset-0" />
        )}
        <img
          src={imgError ? fallbackThumb : video.thumbnailUrl}
          alt={video.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true) }}
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="thumb-overlay group-hover:opacity-100 rounded-xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center
                            shadow-2xl shadow-red-900/60 transform group-hover:scale-110 transition-transform duration-200">
              <Play className="w-6 h-6 text-white ml-1 fill-white" />
            </div>
          </div>
        </div>

        {/* Duration badge */}
        {video.durationSeconds && (
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md border border-white/10 opacity-100 group-hover:scale-110 transition-all">
            {formatDuration(video.durationSeconds)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 px-1">
        <h3 className="text-base sm:text-sm font-semibold text-white line-clamp-2 leading-relaxed sm:leading-snug tracking-tight">
          {video.title}
        </h3>
        <p className="text-sm sm:text-xs text-slate-400 mt-1.5 sm:mt-1 font-medium truncate">
          {video.channelTitle}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">
          {new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
