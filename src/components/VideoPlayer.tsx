import { X, ChevronLeft, FastForward, Rewind, Gauge, Play } from 'lucide-react'
import { YouTubeVideo, Movie } from '../types'
import { useRef, useState, useEffect } from 'react'

interface VideoPlayerProps {
  video: YouTubeVideo | Movie | any
  isVisible: boolean
  onClose: () => void
  onVideoSelect?: (video: any) => void
  suggestedVideos?: any[]
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export function VideoPlayer({ 
  video, 
  isVisible, 
  onClose, 
  onVideoSelect, 
  suggestedVideos = [] 
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControlFeedback, setShowControlFeedback] = useState<'rewind' | 'forward' | null>(null)
  const [currentVideoData, setCurrentVideoData] = useState(video)

  // Update internal video data when prop changes
  useEffect(() => {
    if (video) {
      setCurrentVideoData(video)
    }
  }, [video])

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

  const isYouTube = !video?.videoUrl && (video?.id || '').length > 0
  const isDirectVideo = !!video?.videoUrl

  // Initialize YouTube API and Player
  useEffect(() => {
    if (!isYouTube || !isVisible) return

    let player: any = null

    const initPlayer = () => {
      if (playerRef.current) return;
      
      player = new window.YT.Player(`yt-player-${video.id}`, {
        events: {
          onStateChange: (event: any) => {
            // When a new video starts (e.g. from suggestions)
            if (event.data === window.YT.PlayerState.PLAYING) {
              const videoData = event.target.getVideoData();
              if (videoData && videoData.video_id !== currentVideoData.id) {
                const newVideo = {
                  ...currentVideoData,
                  id: videoData.video_id,
                  title: videoData.title,
                  channelTitle: videoData.author || currentVideoData.channelTitle
                };
                setCurrentVideoData(newVideo);
                // Report back to parent if needed
                onVideoSelect?.(newVideo);
              }
            }
          }
        }
      });
      playerRef.current = player;
    }

    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName('script')[0]
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      } else {
        document.head.appendChild(tag);
      }
      
      window.onYouTubeIframeAPIReady = initPlayer
    } else if (window.YT.Player) {
      initPlayer()
    }

    return () => {
      playerRef.current = null;
    }
  }, [isYouTube, isVisible, video.id])

  if (!video) return null

  // YouTube iframe src
  const videoId = isYouTube ? video.id : ''
  const domain = window.location.origin
  const ytSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&fs=1&playsinline=1&color=red&enablejsapi=1&origin=${domain}`

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
          <p className="text-white font-black text-sm truncate leading-tight uppercase tracking-tight">{currentVideoData.title}</p>
          <p className="text-slate-400 text-[10px] font-black mt-0.5 uppercase tracking-widest">
            {isDirectVideo ? 'Safe Movie' : (currentVideoData.channelTitle || 'YouTube Content')}
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
      <div className="flex-1 flex flex-col items-center justify-center bg-black relative overflow-y-auto pt-16 scrollbar-hide">
        <div className="w-full flex-shrink-0 aspect-video max-h-[70vh] bg-slate-900 shadow-2xl">
          {isYouTube ? (
              <iframe
                id={`yt-player-${videoId}`}
                key={videoId}
                src={ytSrc}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
                style={{ border: 'none', display: 'block' }}
                // Removed allow-popups to prevent switching to YouTube app
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              />
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

        {/* Suggestions Section */}
        {suggestedVideos.length > 0 && (
          <div className="w-full px-6 py-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-red-500" />
                 Up Next for You
               </h3>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {suggestedVideos.map((v, i) => (
                <button
                  key={v.id || i}
                  onClick={() => onVideoSelect?.(v)}
                  className="w-48 flex-shrink-0 group snap-start text-left"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-red-500 transition-all">
                    <img src={v.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  </div>
                  <p className="text-white font-bold text-xs line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {v.title}
                  </p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-tighter mt-1">
                    {v.channelTitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
