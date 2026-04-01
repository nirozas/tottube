import { useState } from 'react'
import { Kid } from '../types'
import { LogOut, Shield, ArrowLeft, Key } from 'lucide-react'
import { PASSCODE_CHARACTERS } from '../constants'

interface ProfilePickerProps {
  kids: Kid[]
  onSelect: (kid: Kid) => void
  onAdminOpen: () => void
  onLogout: () => void
}

export function ProfilePicker({ kids, onSelect, onAdminOpen, onLogout }: ProfilePickerProps) {
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null)
  const [error, setError] = useState(false)

  const handleProfileClick = (kid: Kid) => {
    setSelectedKid(kid)
    setError(false)
  }

  const handleUnlock = (charId: string) => {
    if (selectedKid && selectedKid.passcodeAvatarId === charId) {
      onSelect(selectedKid)
    } else {
      setError(true)
      setTimeout(() => setError(false), 800)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in text-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {!selectedKid ? (
          <div className="animate-fade-in">
            <div className="text-center mb-16">
              <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight">Who's watching?</h1>
              <p className="text-slate-400 text-xl font-medium">Pick your profile to start the fun!</p>
            </div>

            <div className="flex flex-wrap justify-center gap-10">
              {kids.map((kid, i) => (
                <button
                  key={kid.id}
                  onClick={() => handleProfileClick(kid)}
                  className="group flex flex-col items-center space-y-6 animate-slide-up focus:outline-none"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="relative">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[3rem] overflow-hidden border-4 border-slate-800 
                                  group-hover:border-red-500 group-hover:scale-105 transition-all duration-300
                                  shadow-2xl shadow-black/50">
                      <img
                        src={kid.avatarUrl}
                        alt={kid.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 rounded-[3rem] bg-red-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-300 group-hover:text-white transition-colors tracking-tight">
                    {kid.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-24 flex flex-col items-center gap-6">
              <div className="flex gap-4">
                <button
                  onClick={onAdminOpen}
                  className="flex items-center gap-3 px-8 py-4 bg-slate-900/50 border border-slate-800 rounded-3xl
                           text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95 shadow-xl"
                >
                  <Shield className="w-5 h-5 text-red-500" />
                  <span className="font-black uppercase tracking-widest text-sm">Parent Access</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-3 px-8 py-4 bg-slate-900/50 border border-slate-800 rounded-3xl
                           text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 shadow-xl group"
                >
                  <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span className="font-black uppercase tracking-widest text-sm">Sign Out Vault</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-300 max-w-3xl mx-auto text-center space-y-12">
             <div className="relative inline-block">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-xl mx-auto mb-4">
                   <img src={selectedKid.avatarUrl} className="w-full h-full object-cover" alt="" />
                </div>
                <button 
                  onClick={() => setSelectedKid(null)}
                  className="absolute -top-2 -right-2 bg-slate-800 p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-all shadow-lg active:scale-90"
                >
                   <ArrowLeft className="w-4 h-4" />
                </button>
             </div>

             <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-black text-white px-4">Hello {selectedKid.name}!</h2>
                <div className={`flex items-center justify-center gap-3 text-red-400 font-black uppercase tracking-[0.2em] transition-all duration-300 ${error ? 'scale-110' : 'opacity-60'}`}>
                   {error ? 'Oops! Try again friend!' : (
                     <>
                        <Key className="w-5 h-5" />
                        Pick your Secret Unlock Friend
                     </>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-5 gap-4 px-4 sm:gap-6">
                {PASSCODE_CHARACTERS.map((char, i) => (
                  <button
                    key={char.id}
                    onClick={() => handleUnlock(char.id)}
                    className={`group aspect-square rounded-[1.5rem] p-3 sm:p-5 transition-all active:scale-90 shadow-2xl animate-in slide-in-from-bottom-8
                      ${error ? 'animate-shake' : ''}`}
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '2px solid rgba(255, 255, 255, 0.05)',
                      animationDelay: `${i * 0.05}s`
                    }}
                  >
                    <img 
                      src={char.url} 
                      className="w-full h-full object-contain filter group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all" 
                      alt={char.name} 
                    />
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
