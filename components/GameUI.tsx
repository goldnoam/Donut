
import React from 'react';
import { DonutConfig, DonutShape, Topping, Filling, Sprinkles, DoughFlavor, GameState } from '../types';
import { Circle, Square, Droplet, Star, Check, Pause, Play, Cookie, Flame } from 'lucide-react';

interface GameUIProps {
  currentDonut: DonutConfig;
  updateDonut: (updates: Partial<DonutConfig>) => void;
  gameState: GameState;
  onServe: () => void;
  onTogglePause: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ currentDonut, updateDonut, gameState, onServe, onTogglePause }) => {
  const isRing = currentDonut.shape === DonutShape.RING;

  return (
    <>
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 z-10">
      
      {/* HUD Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border-b-4 border-pink-400 max-w-[200px] sm:max-w-xs">
          <h2 className="text-lg font-bold text-pink-600 mb-1">Order</h2>
          <div className="text-xs sm:text-sm text-gray-700 space-y-1 font-medium">
            {gameState.currentOrder ? (
              <>
                 <div>🍩 {gameState.currentOrder.dough} {gameState.currentOrder.shape}</div>
                 <div>🍯 {gameState.currentOrder.topping.replace('NONE', 'NO GLAZE').replace('_', ' ')}</div>
                 <div>🍓 {gameState.currentOrder.filling === Filling.NONE ? 'NO FILLING' : gameState.currentOrder.filling}</div>
                 <div>✨ {gameState.currentOrder.sprinkles.replace('NONE', 'NO SPRINKLES')}</div>
              </>
            ) : (
              <span>Relax...</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
             <div className="flex gap-2 items-center">
                {gameState.streak > 2 && (
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center gap-1 shadow-lg">
                        <Flame size={16} fill="currentColor" /> {gameState.streak}
                    </div>
                )}
                
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-yellow-400 relative">
                    <span className="text-xl font-black text-yellow-500 flex items-center gap-2">
                        🪙 {gameState.score}
                    </span>
                    {gameState.multiplier > 1 && (
                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full border-2 border-white animate-bounce">
                            x{gameState.multiplier}
                        </div>
                    )}
                </div>
                <button 
                    onClick={onTogglePause}
                    className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white p-2 rounded-full shadow-lg transition-all"
                >
                    {gameState.isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                </button>
            </div>

            <div className={`px-4 py-1 rounded-full shadow-lg border-2 font-mono text-xl font-bold transition-colors ${gameState.timeLeft < 10 ? 'bg-red-100 border-red-500 text-red-600 animate-pulse' : 'bg-white/90 border-blue-400 text-blue-600'}`}>
                ⏳ {gameState.timeLeft}s
            </div>
             <div className="bg-purple-100/90 backdrop-blur-md px-3 py-1 rounded-lg border border-purple-300 text-purple-800 text-xs font-bold">
                Lvl {gameState.level}
            </div>
        </div>
      </div>

      {/* Controls Container */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t-4 border-pink-400 mx-auto max-w-5xl w-full max-h-[50vh] overflow-y-auto sm:overflow-visible">
        
        {/* Scrollable controls for mobile */}
        <div className="flex flex-col gap-3">
            
            {/* Row 1: Base Dough & Shape */}
            <div className="flex flex-wrap gap-2 items-center justify-center border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase mr-2">Base</span>
                
                {/* Shapes */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => updateDonut({ shape: DonutShape.RING, filling: Filling.NONE })} className={`p-2 rounded-md transition-all active:scale-95 ${currentDonut.shape === DonutShape.RING ? 'bg-white shadow text-pink-500 ring-2 ring-pink-200' : 'text-gray-400'}`}><Circle size={18} /></button>
                    <button onClick={() => updateDonut({ shape: DonutShape.FILLED })} className={`p-2 rounded-md transition-all active:scale-95 ${currentDonut.shape === DonutShape.FILLED ? 'bg-white shadow text-pink-500 ring-2 ring-pink-200' : 'text-gray-400'}`}><Square size={18} className="rounded-full" /></button>
                </div>

                {/* Dough Flavors */}
                <div className="flex gap-1 overflow-x-auto">
                    {Object.values(DoughFlavor).map(f => (
                         <button 
                            key={f}
                            onClick={() => updateDonut({ dough: f })}
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${currentDonut.dough === f ? 'bg-amber-700 text-white shadow-lg ring-2 ring-offset-1 ring-amber-700 scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                         >
                            {f.charAt(0) + f.slice(1).toLowerCase().replace('_', ' ')}
                         </button>
                    ))}
                </div>
            </div>

            {/* Row 2: Toppings & Fillings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-gray-100 pb-2">
                 {/* Toppings */}
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase text-center">Glaze</span>
                    <div className="grid grid-cols-2 gap-1">
                        {Object.values(Topping).map((t) => (
                            <button 
                                key={t}
                                onClick={() => updateDonut({ topping: t })}
                                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border-2 ${currentDonut.topping === t ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md ring-1 ring-indigo-200' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                {t.replace('NONE', 'NO').replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                 </div>
                 
                 {/* Fillings */}
                 <div className={`flex flex-col gap-1 transition-opacity ${isRing ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <span className="text-xs font-bold text-gray-400 uppercase text-center">Filling</span>
                    <div className="grid grid-cols-3 gap-1">
                        {Object.values(Filling).map((f) => (
                            <button 
                                key={f}
                                disabled={isRing}
                                onClick={() => updateDonut({ filling: f })}
                                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 truncate border-2 ${currentDonut.filling === f ? 'bg-red-50 border-red-500 text-red-700 shadow-md ring-1 ring-red-200' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                {f.replace('NONE', 'NO')}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

            {/* Row 3: Sprinkles & Serve */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                     <span className="text-xs font-bold text-gray-400 uppercase block text-center mb-1">Sprinkles</span>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                        {Object.values(Sprinkles).map((s) => (
                            <button 
                                key={s}
                                onClick={() => updateDonut({ sprinkles: s })}
                                className={`p-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 border-2 ${currentDonut.sprinkles === s ? 'bg-green-50 border-green-500 text-green-700 shadow-md ring-1 ring-green-200' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                            >
                                {s.replace('NONE', 'NO').replace('_', ' ')}
                            </button>
                        ))}
                     </div>
                </div>

                <button 
                    onClick={onServe}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 active:from-yellow-500 active:to-orange-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-xl active:scale-90 transition-all flex items-center justify-center gap-2 min-h-[50px] transform duration-100 hover:shadow-2xl hover:-translate-y-1"
                >
                    SERVE <Check size={28} />
                </button>
            </div>
        </div>
      </div>
    </div>

    {/* Visual Feedback Overlay */}
    {gameState.lastFeedback && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {gameState.lastFeedback === 'success' ? (
                <div className="animate-bounce text-6xl font-black text-green-500 drop-shadow-[0_4px_0_rgba(255,255,255,1)]">
                    TASTY!
                </div>
            ) : (
                <div className="animate-shake text-6xl font-black text-red-500 drop-shadow-[0_4px_0_rgba(255,255,255,1)]">
                    OOPS!
                </div>
            )}
        </div>
    )}

    {/* Bonus Feedback */}
    {gameState.bonusMessage && (
        <div className="absolute top-1/4 left-0 right-0 pointer-events-none flex items-center justify-center z-50">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></div>
            <div className="text-4xl font-black text-yellow-500 drop-shadow-[0_4px_0_rgba(255,255,255,1)] animate-bounce relative">
                {gameState.bonusMessage}
            </div>
        </div>
    )}

    {/* Pause Overlay */}
    {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center">
                <h2 className="text-4xl font-black text-blue-600 mb-6">PAUSED</h2>
                <button 
                    onClick={onTogglePause}
                    className="bg-blue-500 text-white text-xl font-bold py-3 px-12 rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95"
                >
                    RESUME
                </button>
            </div>
        </div>
    )}

    <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        .animate-shake {
            animation: shake 0.3s ease-in-out;
        }
    `}</style>
    </>
  );
};
