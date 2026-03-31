import { Kid } from '../types'
import { LogOut, Shield } from 'lucide-react'

interface ProfilePickerProps {
  kids: Kid[]
  onSelect: (kid: Kid) => void
  onAdminOpen: () => void
  onLogout: () => void
}

export function ProfilePicker({ kids, onSelect, onAdminOpen, onLogout }: ProfilePickerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in text-white">
      {/* Sign Out Button in top right */}
      <div className="absolute top-8 right-8">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-2xl
                     text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-sm hidden sm:inline">Sign Out Vault</span>
        </button>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">Who's watching?</h1>
          <p className="text-slate-400 text-lg">Pick your profile to start the fun!</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-center">
          {kids.map((kid, i) => (
            <button
              key={kid.id}
              onClick={() => onSelect(kid)}
              className="group flex flex-col items-center space-y-4 animate-slide-up focus:outline-none"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] overflow-hidden border-4 border-slate-800 
                              group-hover:border-red-500 group-hover:scale-110 transition-all duration-300
                              shadow-2xl shadow-black/50">
                  <img
                    src={kid.avatarUrl}
                    alt={kid.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-300 group-hover:text-white transition-colors">
                {kid.name}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-20 flex justify-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={onAdminOpen}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl
                     text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95"
          >
            <Shield className="w-5 h-5" />
            <span className="font-bold">Parent Access</span>
          </button>
        </div>
      </div>
    </div>
  )
}
