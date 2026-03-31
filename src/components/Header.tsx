import { useState, useRef } from 'react'
import { Lock, RefreshCw, Menu, Search } from 'lucide-react'
import { Kid } from '../types'

interface HeaderProps {
  onAdminOpen: () => void
  onRefresh: () => void
  isLoading: boolean
  minutesUsed: number
  dailyLimit: number
  onToggleSidebar: () => void
  searchQuery?: string
  onSearch?: (query: string) => void
  currentKid?: Kid | null
  onSwitchProfile: () => void
}

const LONG_PRESS_MS = 1200

export function Header({
  onAdminOpen,
  onRefresh,
  isLoading,
  minutesUsed,
  dailyLimit,
  onToggleSidebar,
  searchQuery = '',
  onSearch,
  currentKid,
  onSwitchProfile
}: HeaderProps) {
  const [pressing, setPressing] = useState(false)
  const [searchInput, setSearchInput] = useState(searchQuery)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressPct = Math.min((minutesUsed / dailyLimit) * 100, 100)

  // Long-press on logo to open admin
  const handlePressStart = () => {
    setPressing(true)
    pressTimer.current = setTimeout(() => {
      setPressing(false)
      onAdminOpen()
    }, LONG_PRESS_MS)
  }

  const handlePressEnd = () => {
    setPressing(false)
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 max-w-screen-2xl mx-auto w-full">
        {/* Mobile Sidebar Toggle & Logo */}
        <div className="flex items-center gap-3 w-1/3 flex-shrink-0">
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all active:scale-95"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div
            className={`flex items-center gap-2 cursor-pointer select-none
                        transition-transform duration-200 ${pressing ? 'scale-95' : 'scale-100'}`}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            aria-label="Parent controls hidden trigger"
            role="button"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700
                            flex items-center justify-center shadow-lg shadow-red-900/30">
              <span className="text-lg md:text-xl leading-none">🎬</span>
            </div>
            <div className="hidden sm:block lg:hidden xl:block">
              <span className="text-white font-black text-xl tracking-tight leading-none">Tot</span>
              <span className="text-red-500 font-black text-xl tracking-tight leading-none">Tube</span>
            </div>
          </div>
        </div>

        {/* Timer bar / Search Form */}
        <div className="flex-1 flex flex-col justify-center items-center max-w-[200px] md:max-w-md mx-auto w-1/3">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              if (onSearch) onSearch(searchInput)
            }}
            className="w-full relative hidden md:block"
          >
            <input
              type="text"
              placeholder="Search approved channels..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            
            {/* Realtime visual timer under search */}
            <div className="absolute -bottom-2.5 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden opacity-50">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct >= 100 ? '#ef4444' : progressPct >= 75 ? '#f97316' : '#22c55e',
                }}
              />
            </div>
          </form>

          {/* Mobile minimal timer */}
          <div className="w-full md:hidden flex flex-col items-center">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct >= 100
                    ? '#ef4444'
                    : progressPct >= 75
                    ? 'linear-gradient(90deg, #22c55e, #f97316)'
                    : '#22c55e',
                }}
              />
            </div>
            <p className="text-slate-500 text-[10px] mt-1 font-medium truncate">
              {Math.floor(minutesUsed)}m / {dailyLimit}m today
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex justify-end items-center gap-3 w-1/3 flex-shrink-0">
          {currentKid && (
            <button
              onClick={onSwitchProfile}
              className="hidden sm:flex items-center gap-2 bg-slate-800/50 p-1 pr-3 rounded-full border border-slate-700/50 hover:bg-slate-700/60 transition-all active:scale-95 cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500/20 group-hover:border-red-500/40 transition-colors">
                <img src={currentKid.avatarUrl} alt={currentKid.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-white text-xs font-black truncate max-w-[80px] group-hover:text-red-400 transition-colors uppercase tracking-tight">{currentKid.name}</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all
                       active:scale-95 disabled:opacity-40"
            aria-label="Refresh videos"
          >
            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onAdminOpen}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all
                       active:scale-95"
            aria-label="Open parent controls"
          >
            <Lock className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Row (Only visible on small screens) */}
      <div className="px-4 pb-3 md:hidden border-t border-slate-800/30 pt-3">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            if (onSearch) onSearch(searchInput)
          }}
          className="w-full relative"
        >
          <input
            type="text"
            placeholder="Search channels..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white text-base rounded-2xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Press progress ring visual */}
      {pressing && (
        <div className="fixed top-20 md:top-4 left-1/2 -translate-x-1/2 z-50
                        bg-slate-900 border border-slate-700 rounded-2xl px-6 py-3
                        flex items-center gap-3 text-base font-bold text-slate-300 shadow-2xl animate-fade-in">
          <Lock className="w-5 h-5 text-red-400 animate-pulse" />
          Hold to open Parent Controls...
        </div>
      )}
    </header>
  )
}
