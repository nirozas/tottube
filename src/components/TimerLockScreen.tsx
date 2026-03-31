import { Moon, Star } from 'lucide-react'

interface TimerLockScreenProps {
  minutesUsed: number
  dailyLimit: number
  onUnlock: () => void // opens admin to let parent reset
}

export function TimerLockScreen({ minutesUsed, dailyLimit, onUnlock }: TimerLockScreenProps) {
  const hours = Math.floor(minutesUsed / 60)
  const mins = Math.floor(minutesUsed % 60)
  const displayTime = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center text-center px-6 animate-fade-in">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <Star
            key={i}
            className="absolute text-slate-700/40 fill-slate-700/20"
            style={{
              width: `${Math.random() * 12 + 6}px`,
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Moon illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-300 to-amber-500
                        shadow-2xl shadow-amber-500/30 flex items-center justify-center
                        animate-pulse-slow ring-pulse">
          <Moon className="w-16 h-16 text-amber-900/60 fill-amber-900/30" />
        </div>
        {/* Glow ring */}
        <div className="absolute inset-[-8px] rounded-full border-2 border-amber-400/20 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      {/* Message */}
      <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
        Time for a Break! 🌙
      </h1>
      <p className="text-slate-400 text-lg md:text-xl font-medium max-w-sm leading-relaxed mb-2">
        You watched <span className="text-amber-400 font-bold">{displayTime}</span> today.
      </p>
      <p className="text-slate-500 text-base mb-12">
        Come back tomorrow for more fun videos!
      </p>

      {/* Progress visualization */}
      <div className="w-full max-w-xs mb-12">
        <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
          <span>Today's watch time</span>
          <span>{dailyLimit} min limit</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full progress-gradient rounded-full transition-all duration-1000"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Visual fun elements */}
      <div className="flex gap-4 mb-12">
        {['🌟', '🎨', '📚', '🎵', '🧩'].map((emoji, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50
                       flex items-center justify-center text-2xl"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Parent unlock — subtle */}
      <button
        onClick={onUnlock}
        className="text-slate-600 hover:text-slate-400 text-sm font-medium transition-colors
                   border border-slate-800 hover:border-slate-600 rounded-xl px-6 py-3
                   active:scale-95 transition-transform"
        aria-label="Parent unlock"
      >
        🔐 Parent Controls
      </button>
    </div>
  )
}
