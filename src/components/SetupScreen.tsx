import { useState, useEffect } from 'react'
import { Shield, ChevronRight, Mail, Key, User, Plus } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { KID_AVATARS, PASSCODE_CHARACTERS } from '../constants'

interface SetupScreenProps {
  onComplete: (email: string, pin: string) => void
  onAddKid: (name: string, avatarUrl: string, passcodeAvatarId?: string) => Promise<void>
}

type SetupStep = 'auth' | 'pin' | 'profile'

export function SetupScreen({ onComplete, onAddKid }: SetupScreenProps) {
  const [step, setStep] = useState<SetupStep>('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [kidName, setKidName] = useState('')
  const [kidAvatar, setKidAvatar] = useState(KID_AVATARS[0].url)
  const [kidPasscodeId, setKidPasscodeId] = useState<string>(KID_AVATARS[0].id)
  const [error, setError] = useState('')

  // Check if session exists on mount
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
           // We have a session but we stay on the auth screen unless we check settings
           // If we want to skip auth if they are already logged in:
           checkExistingSetup()
        }
      })
    }
  }, [])

  const checkExistingSetup = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setStep('pin')
      return
    }
    const { data } = await supabase.from('tottube_settings').select('*').maybeSingle()
    if (data?.isSetup) {
      // If we have settings and kids, we are done
      if (data.kids && data.kids.length > 0) {
        onComplete(data.email, data.adminPin)
      } else {
        // Have settings but no kids? Go to profile
        setPin(data.adminPin)
        setStep('profile')
      }
    } else {
      // New account or partially finished setup
      setStep('pin')
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Basic validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.')
      setIsLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setIsLoading(false)
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      // Offline fallback
      setStep('pin')
      setIsLoading(false)
      return
    }

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
      }
      
      // Successfully authenticated
      await checkExistingSetup()
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSetup = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.')
      return
    }
    if (pin !== confirmPin) {
      setError('PINs do not match. Please try again.')
      return
    }

    setStep('profile')
  }

  const handleFinishSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kidName.trim()) {
      setError('Please enter your child\'s name.')
      return
    }
    setIsLoading(true)
    try {
      await onAddKid(kidName.trim(), kidAvatar, kidPasscodeId)
      onComplete(email, pin)
    } catch (err: any) {
      setError(err.message || 'Failed to create profile.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in relative z-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 glass-card p-8 md:p-10 border border-slate-700/50 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40 animate-slide-up">
            <span className="text-4xl">🎬</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {step === 'auth' ? 'Welcome to TotTube' : step === 'pin' ? 'Master PIN' : 'Create First Profile'}
        </h1>
        <p className="text-slate-400 text-center mb-8 font-medium text-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {step === 'auth' ? 'Create or sign in to your parent account.' : step === 'pin' ? 'Set up a Master PIN to protect the digital sandbox.' : 'Pick a name and picture for your little one.'}
        </p>

        {step === 'auth' ? (
          <form onSubmit={handleAuth} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Parent Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="input-field w-full pl-10"
                  autoFocus
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input-field w-full pl-10"
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-900/50 text-red-400 text-sm font-medium flex items-center gap-2 animate-fade-in">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50"
              disabled={!email || password.length < 6 || isLoading}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In Vault' : 'Create Vault Account')}
              {!isLoading && <ChevronRight className="w-5 h-5 ml-1" />}
            </button>

            <p className="text-center text-sm text-slate-400 mt-4">
              {isLogin ? "Don't have an account?" : "Already have a vault?"}{' '}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-red-400 font-bold hover:text-red-300 underline underline-offset-4 cursor-pointer"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </form>
        ) : step === 'pin' ? (
          <form onSubmit={handlePinSetup} className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Create PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4 digits"
                  className="input-field w-full text-center text-xl tracking-widest placeholder:text-sm placeholder:tracking-normal font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4 digits"
                  className="input-field w-full text-center text-xl tracking-widest placeholder:text-sm placeholder:tracking-normal font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-900/50 text-red-400 text-sm font-medium flex items-center gap-2 animate-fade-in">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg mt-4 disabled:opacity-50"
              disabled={pin.length !== 4 || confirmPin.length !== 4}
            >
              Continue to Profiles
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinishSetup} className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-red-500/50 overflow-hidden shadow-xl">
                  <img src={kidAvatar} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-red-600 border-2 border-slate-900 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                      {/* Avatar Picker */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Pick your Profile Character</p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {KID_AVATARS.map((ava) => (
                            <button
                              key={'setup_ava_'+ava.id}
                              onClick={() => setKidAvatar(ava.url)}
                              className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${
                                kidAvatar === ava.url ? 'border-red-500 scale-110 shadow-lg shadow-red-900/20' : 'border-transparent opacity-40 hover:opacity-100'
                              }`}
                            >
                              <img src={ava.url} alt={ava.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Passcode Picker */}
                      <div className="space-y-3 pt-4 border-t border-slate-800">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Pick your Secret Unlock Character</p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {PASSCODE_CHARACTERS.map((ava) => (
                            <button
                              key={'setup_pass_'+ava.id}
                              onClick={() => setKidPasscodeId(ava.id)}
                              className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${
                                kidPasscodeId === ava.id ? 'border-blue-500 scale-110 shadow-lg shadow-blue-900/20' : 'border-transparent opacity-40 hover:opacity-100'
                              }`}
                            >
                              <img src={ava.url} alt={ava.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Kid's Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                  placeholder="e.g. Leo"
                  className="input-field w-full pl-10"
                  autoFocus
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-900/50 text-red-400 text-sm font-medium flex items-center gap-2 animate-fade-in">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg mt-4 disabled:opacity-50"
              disabled={!kidName.trim() || isLoading}
            >
              {isLoading ? 'Creating Profile...' : 'Finish & Enter TotTube'}
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
