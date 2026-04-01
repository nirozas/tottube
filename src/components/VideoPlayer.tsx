import { X, ChevronLeft, FastForward, Rewind, Gauge } from 'lucide-react'
import { YouTubeVideo, Movie } from '../types'
import { useRef, useState, useEffect } from 'react'

interface VideoPlayerProps {
  video: YouTubeVideo | Movie | any
  isVisible: boolean
  onClose: () => void
}

export function VideoPlayer({ video, isVisible, onClose }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControlFeedback, setShowControlFeedback] = useState<'rewind' | 'forward' | null>(null)

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

  const isYouTube = !video.videoUrl && (video.id || '').length > 0
  const isDirectVideo = !!video.videoUrl

  // YouTube iframe src
  const videoId = isYouTube ? video.id : ''
  const ytSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&fs=1&playsinline=1&color=red&enablejsapi=1`

  const handleSideClick = (e: React.MouseEvent) => {
    if (!videoRef.current || !isDirectVideo) return
    
    const { clientX, currentTarget } = e
    const { width } = currentTarget.getBoundingClientRect()
    
    if (clientX < width * 0.3) {
      // Left side - Rewind 10s
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
      triggerFeedback('rewind')
    } else if (clientX > width * 0.7) {
      // Right side - Forward 10s
      videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10)
      triggerFeedback('forward')
    }
  }

  const triggerFeedback = (type: 'rewind' | 'forward') => {
    setShowControlFeedback(type)
    setTimeout(() => setShowControlFeedback(null), 500)
  }

  const toggleSpeed = () => {
    const next = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : playbackRate === 2 ? 0.75 : 1
    setPlaybackRate(next)
    if (videoRef.current) videoRef.current.playbackRate = next
  }

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black flex flex-col transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      ref={containerRef}
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/90 to-transparent absolute top-0 left-0 right-0 z-[210]">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors
                     bg-white/10 hover:bg-white/20 rounded-xl px-4 py-2 text-sm font-black
                     active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex-1 min-w-0 ml-2">
          <p className="text-white font-black text-sm truncate leading-tight uppercase tracking-tight">{video.title}</p>
          <p className="text-slate-400 text-[10px] font-black mt-0.5 uppercase tracking-widest">
            {isDirectVideo ? 'Safe Movie' : (video.channelTitle || 'YouTube Content')}
          </p>
        </div>

        {isDirectVideo && (
            <button
              onClick={toggleSpeed}
              className="flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-red-600 rounded-xl px-4 py-2 transition-all active:scale-90"
            >
              <Gauge className="w-4 h-4" />
              <span className="text-xs font-black">{playbackRate}x</span>
            </button>
        )}

        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors
                     bg-white/5 hover:bg-red-600/80 rounded-xl p-2 active:scale-95 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {isYouTube ? (
          <div className="w-full h-full max-h-screen">
            <iframe
              key={videoId}
              src={ytSrc}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              style={{ border: 'none', display: 'block' }}
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          </div>
        ) : (
          <div 
            className="w-full h-full relative cursor-pointer group"
            onClick={handleSideClick}
          >
            <video
              ref={videoRef}
              src={video.videoUrl}
              autoPlay
              controls
              className="w-full h-full object-contain"
              onEnded={onClose}
            />
            
            {/* Custom Control Overlays */}
            {showControlFeedback && (
              <div className={`absolute top-1/2 -translate-y-1/2 transform transition-all duration-500 animate-out fade-out zoom-out
                              ${showControlFeedback === 'rewind' ? 'left-1/4' : 'right-1/4'}`}>
                <div className="bg-red-600/80 backdrop-blur-md p-8 rounded-full shadow-2xl">
                  {showControlFeedback === 'rewind' ? <Rewind className="w-12 h-12 text-white fill-current" /> : <FastForward className="w-12 h-12 text-white fill-current" />}
                  <p className="text-white font-black mt-2 text-center">10s</p>
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-20 flex justify-between px-20 opacity-0 group-hover:opacity-40 pointer-events-none transition-opacity">
               <div className="text-white font-black text-4xl">«</div>
               <div className="text-white font-black text-4xl">»</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
