import { useEffect, useRef } from 'react'
import { X, SkipBack, ChevronLeft } from 'lucide-react'
import { YouTubeVideo } from '../types'

interface VideoPlayerProps {
  video: YouTubeVideo
  isVisible: boolean
  onClose: () => void
  onPrevious?: () => void
}

export function VideoPlayer({ video, isVisible, onClose, onPrevious }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Prevent body scroll when player is open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isVisible])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!video) return null

  // YouTube iframe src with all safety params:
  // rel=0       → no related videos
  // modestbranding=1 → minimal YouTube branding
  // iv_load_policy=3 → no annotations
  // disablekb=0 → allow keyboard
  // fs=1        → allow fullscreen
  // playsinline=1 → plays inline on iOS/Android
  const ytSrc = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&fs=1&playsinline=1&color=red`

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex flex-col transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      ref={containerRef}
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors
                     bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-sm font-semibold
                     active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {onPrevious && (
          <button
            onClick={onPrevious}
            className="text-white/60 hover:text-white transition-colors
                       bg-white/5 hover:bg-white/15 rounded-xl p-2 active:scale-95"
            aria-label="Previous video"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate leading-tight">{video.title}</p>
          <p className="text-slate-400 text-xs font-medium mt-0.5">{video.channelTitle}</p>
        </div>

        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors
                     bg-white/5 hover:bg-red-600/80 rounded-xl p-2 active:scale-95 transition-all ml-auto"
          aria-label="Close player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Player */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="w-full h-full max-h-screen">
          <iframe
            key={video.id}
            src={ytSrc}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
            style={{ border: 'none', display: 'block' }}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          />
        </div>
      </div>
    </div>
  )
}
