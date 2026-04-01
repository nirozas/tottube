import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { VideoGrid } from './components/VideoGrid'
import { PlaylistGrid } from './components/PlaylistGrid'
import { MovieGrid } from './components/MovieGrid'
import { AdminModal } from './components/AdminModal'
import { VideoPlayer } from './components/VideoPlayer'
import { ProfilePicker } from './components/ProfilePicker'
import { SetupScreen } from './components/SetupScreen'
import { useAppStore } from './hooks/useAppStore'
import { useState } from 'react'
import { Moon } from 'lucide-react'
function App() {
  const {
    settings,
    kids,
    currentKid,
    channels,
    playlists,
    movies,
    videos,
    isLoading,
    isAdminOpen,
    isVaultUnlocked,
    minutesUsed,
    activeChannelFilter,
    activePlaylistId,
    currentVideo,
    isPlayerVisible,
    searchQuery,
    activeCategory,
    setIsAdminOpen,
    setIsVaultUnlocked,
    setProfile,
    refreshVideos,
    setCategory,
    toggleChannelFilter,
    togglePlaylistFilter,
    handleUpdateSettings,
    handleAddChannel,
    handleRemoveChannel,
    handleAddPlaylist,
    handleRemovePlaylist,
    handleAddMovie,
    handleRemoveMovie,
    handleAddKid,
    handleUpdateKid,
    handleUpdateKidChannels,
    handleAddShortcut,
    handleRemoveShortcut,
    setCurrentVideo,
    setIsPlayerVisible,
    setSearchQuery,
    onResetTimer,
    startTimer,
    stopTimer,
    isBedtimeMode,
    setIsBedtimeMode,
    isAuthenticated,
    handleLogout,
  } = useAppStore()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    // Reset filters to ensure portal-wide discovery for the kid
    toggleChannelFilter(null)
    togglePlaylistFilter(null)
    refreshVideos({ query: q, category: 'all' })
  }

  const playVideo = (video: any) => {
    setCurrentVideo(video)
    setIsPlayerVisible(true)
    startTimer()
  }

  const closeVideo = () => {
    setIsPlayerVisible(false)
    stopTimer()
    setTimeout(() => setCurrentVideo(null), 300)
  }

  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
          {isAuthenticated === false ? (
            <SetupScreen 
               onComplete={() => {}} 
               onAddKid={handleAddKid} 
            />
          ) : !currentKid ? (
            <ProfilePicker 
              kids={kids} 
              onSelect={setProfile} 
              onAdminOpen={() => setIsAdminOpen(true)} 
              onLogout={handleLogout}
            />
          ) : (
            <>
              <div className="flex flex-1 overflow-hidden">
                <Sidebar
                  channels={channels}
                  playlists={playlists}
                  activeChannelFilter={activeChannelFilter}
                  activePlaylistId={activePlaylistId}
                  onChannelFilter={toggleChannelFilter}
                  onPlaylistFilter={togglePlaylistFilter}
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />
                
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header
                    onAdminOpen={() => setIsAdminOpen(true)}
                    onRefresh={() => refreshVideos()}
                    isLoading={isLoading}
                    minutesUsed={minutesUsed}
                    dailyLimit={settings.dailyLimitMinutes}
                    onToggleSidebar={() => setIsSidebarOpen(true)}
                    searchQuery={searchQuery}
                    onSearch={handleSearch}
                    currentKid={currentKid}
                    onSwitchProfile={() => setProfile(null)}
                    onLogout={handleLogout}
                  />

                    {activePlaylistId === 'movies' ? (
                      <MovieGrid 
                        movies={movies}
                        onPlay={playVideo}
                      />
                    ) : activePlaylistId === '__grid__' ? (
                      <PlaylistGrid 
                        playlists={playlists}
                        onSelect={(id) => togglePlaylistFilter(id)}
                      />
                    ) : (
                      <VideoGrid
                        videos={videos}
                        channels={channels}
                        isLoading={isLoading}
                        onPlay={playVideo}
                        onOpenAdmin={() => setIsAdminOpen(true)}
                        shortcuts={settings.shortcuts}
                        searchQuery={searchQuery}
                        onSearch={handleSearch}
                        activeCategory={activeCategory}
                        onCategoryChange={setCategory}
                        onLoadMore={() => refreshVideos({ append: true })}
                      />
                    )}
                </div>
              </div>

              {currentVideo && (
                <VideoPlayer
                  video={currentVideo}
                  isVisible={isPlayerVisible}
                  onClose={closeVideo}
                />
              )}
            </>
          )}

          <AdminModal
            isOpen={isAdminOpen}
            onClose={() => {
              setIsAdminOpen(false)
              setIsVaultUnlocked(false)
            }}
            isVaultUnlocked={isVaultUnlocked}
            setIsVaultUnlocked={setIsVaultUnlocked}
            channels={channels}
            playlists={playlists}
            movies={movies}
            settings={settings}
            kids={kids}
            currentKid={currentKid}
            minutesUsed={minutesUsed}
            isBedtimeMode={isBedtimeMode}
            setIsBedtimeMode={setIsBedtimeMode}
            onAddChannel={handleAddChannel}
            onRemoveChannel={handleRemoveChannel}
            onAddPlaylist={handleAddPlaylist}
            onRemovePlaylist={handleRemovePlaylist}
            onAddMovie={handleAddMovie}
            onRemoveMovie={handleRemoveMovie}
            onUpdateSettings={handleUpdateSettings}
            onAddKid={handleAddKid}
            onUpdateKid={handleUpdateKid}
            onUpdateKidChannels={handleUpdateKidChannels}
            onAddShortcut={handleAddShortcut}
            onRemoveShortcut={handleRemoveShortcut}
            onResetTimer={onResetTimer}
            onLogout={handleLogout}
            onSwitchProfile={() => {
              setProfile(null)
              setIsAdminOpen(false)
              setIsVaultUnlocked(false)
            }}
          />
          {/* 🌙 Bedtime Overlay (Phase 2 Upgrade) */}
          {isBedtimeMode && (
            <div className="fixed inset-0 z-[200] bg-indigo-950/40 pointer-events-none mix-blend-multiply transition-all duration-1000 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              {/* Floating Stars */}
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    opacity: Math.random() * 0.5 + 0.3
                  }}
                >
                  <div className="w-1 h-1 bg-white rounded-full blur-[1px]" />
                </div>
              ))}
              <div className="absolute top-10 right-10 flex flex-col items-center gap-2 opacity-40">
                 <Moon className="w-12 h-12 text-white" />
                 <p className="text-[10px] font-black text-white uppercase tracking-widest">Night Time</p>
              </div>
            </div>
          )}
        </div>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
