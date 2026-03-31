import { useState } from 'react'
import { Lock, Delete } from 'lucide-react'

interface PinEntryProps {
  correctPin: string
  onSuccess: () => void
}

export function PinEntry({ correctPin, onSuccess }: PinEntryProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handlePress = (num: string) => {
    if (pin.length >= 4) return
    setError(false)
    const newPin = pin + num
    setPin(newPin)

    if (newPin.length === 4) {
      if (newPin === correctPin) {
        onSuccess()
      } else {
        setError(true)
        setTimeout(() => setPin(''), 500)
      }
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-fade-in bg-slate-900">
      <div className="text-center space-y-2">
        <div className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300
                        ${error ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-red-500/20'}`}>
          <Lock className={`w-8 h-8 ${error ? 'text-white' : 'text-red-500'}`} />
        </div>
        <h2 className="text-2xl font-black text-white mt-4">Parental Lock</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Enter your 4-digit PIN to enter</p>
      </div>

      <div className="flex gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200
                       ${pin.length > i ? 'bg-red-500 border-red-500 scale-125' : 'border-slate-700'}
                       ${error ? 'animate-bounce border-red-500' : ''}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            className="aspect-square flex items-center justify-center bg-slate-800 rounded-2xl text-2xl font-black text-white
                       hover:bg-slate-700 active:scale-90 transition-all border border-slate-700/50 shadow-sm"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handlePress('0')}
          className="aspect-square flex items-center justify-center bg-slate-800 rounded-2xl text-2xl font-black text-white
                     hover:bg-slate-700 active:scale-90 transition-all border border-slate-700/50 shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="aspect-square flex items-center justify-center text-slate-500 hover:text-white transition-colors"
        >
          <Delete className="w-8 h-8" />
        </button>
      </div>
      
      {error && (
        <p className="text-red-500 font-black text-sm uppercase tracking-widest animate-pulse">Wrong PIN!</p>
      )}
    </div>
  )
}
