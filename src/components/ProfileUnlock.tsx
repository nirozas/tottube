import { useState } from 'react'
import { Kid } from '../types'
import { PASSCODE_CHARACTERS } from '../constants'
import { ChevronLeft, Lock } from 'lucide-react'

interface ProfileUnlockProps {
  kid: Kid
  onUnlock: (success: boolean) => void
  onCancel: () => void
}

export function ProfileUnlock({ kid, onUnlock, onCancel }: ProfileUnlockProps) {
  const [error, setError] = useState(false)

  const handleSelect = (id: string) => {
    if (id === kid.passcodeAvatarId) {
      onUnlock(true)
    } else {
      setError(true)
      setTimeout(() => setError(false), 500)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-950 p-6 animate-fade-in relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <button 
        onClick={onCancel}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold group"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
          <ChevronLeft className="w-6 h-6" />
        </div>
        <span>Back</span>
      </button>

      <div className="text-center mb-10 relative">
        <div className="relative inline-block mb-6">
          <img src={kid.avatarUrl} alt={kid.name} className="w-24 h-24 rounded-3xl object-cover ring-4 ring-slate-800 shadow-2xl" />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-red-600 border-4 border-slate-950 flex items-center justify-center shadow-lg">
            <Lock className="w-5 h-5 text-white" />
          </div>
        </div>
        <h2 className="text-4xl font-black text-white mb-2">Hi, {kid.name}!</h2>
        <p className="text-slate-400 text-lg">Pick your <span className="text-red-400 font-bold">Secret Character</span> to unlock</p>
      </div>

      <div className={`grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-4 max-w-2xl w-full transition-all duration-300 ${error ? 'animate-shake' : ''}`}>
        {PASSCODE_CHARACTERS.map((ava) => (
          <button
            key={ava.id}
            onClick={() => handleSelect(ava.id)}
            className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 hover:border-red-500 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-red-900/20"
          >
            <img 
              src={ava.url} 
              alt={ava.name} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-8 text-red-500 font-black text-xl animate-bounce">Oops! Try again! 💫</p>
      )}
    </div>
  )
}
