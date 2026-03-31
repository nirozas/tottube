import { Play, Tv2 } from 'lucide-react'

interface EmptyStateProps {
  hasChannels: boolean
  onOpenAdmin: () => void
}

export function EmptyState({ hasChannels, onOpenAdmin }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in">
      <div className="w-24 h-24 rounded-3xl bg-slate-800/60 border border-slate-700/50
                      flex items-center justify-center mb-6 shadow-2xl">
        {hasChannels ? (
          <Play className="w-12 h-12 text-slate-600" />
        ) : (
          <Tv2 className="w-12 h-12 text-slate-600" />
        )}
      </div>

      {hasChannels ? (
        <>
          <h2 className="text-2xl font-black text-white mb-2">No Videos Found</h2>
          <p className="text-slate-400 text-base max-w-xs leading-relaxed">
            The approved channels exist but returned no videos. Check your YouTube API key or try refreshing.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-black text-white mb-2">Welcome to TotTube! 🎬</h2>
          <p className="text-slate-400 text-base max-w-xs leading-relaxed mb-6">
            No channels have been approved yet. A parent needs to add channels in the settings.
          </p>
          <button onClick={onOpenAdmin} className="btn-primary flex items-center gap-2">
            <span>🔐</span>
            Open Parent Controls
          </button>
        </>
      )}
    </div>
  )
}
