import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { VideoGrid } from './components/VideoGrid'
import { PlaylistGrid } from './components/PlaylistGrid'
import { AdminModal } from './components/AdminModal'
import { VideoPlayer } from './components/VideoPlayer'
import { ProfilePicker } from './components/ProfilePicker'
import { useAppStore } from './hooks/useAppStore'
import { useState } from 'react'

function App() {
  const {
    settings,
    kids,
    currentKid,
    channels,
    playlists,
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
    stopTimer
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
          {!currentKid ? (
            <ProfilePicker 
              kids={kids} 
              onSelect={setProfile} 
              onAdminOpen={() => setIsAdminOpen(true)} 
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
                  />

                  {activePlaylistId === '__grid__' ? (
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
            settings={settings}
            kids={kids}
            currentKid={currentKid}
            minutesUsed={minutesUsed}
            onAddChannel={handleAddChannel}
            onRemoveChannel={handleRemoveChannel}
            onAddPlaylist={handleAddPlaylist}
            onRemovePlaylist={handleRemovePlaylist}
            onUpdateSettings={handleUpdateSettings}
            onAddKid={handleAddKid}
            onUpdateKid={handleUpdateKid}
            onUpdateKidChannels={handleUpdateKidChannels}
            onAddShortcut={handleAddShortcut}
            onRemoveShortcut={handleRemoveShortcut}
            onResetTimer={onResetTimer}
            onSwitchProfile={() => {
              setProfile(null)
              setIsAdminOpen(false)
              setIsVaultUnlocked(false)
            }}
          />
        </div>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
