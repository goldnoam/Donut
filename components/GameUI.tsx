
import React from 'react';
import { DonutConfig, DonutShape, Topping, Filling, Sprinkles, DoughFlavor, GameState, PowerupType, Language } from '../types';
import { Circle, Square, Check, Pause, Play, Flame, Volume2, VolumeX, Snowflake, Zap, Coins, Globe } from 'lucide-react';

interface GameUIProps {
  currentDonut: DonutConfig;
  updateDonut: (updates: Partial<DonutConfig>) => void;
  gameState: GameState;
  onServe: () => void;
  onTogglePause: () => void;
  onVolumeChange: (volume: number) => void;
  onActivatePowerup: (type: PowerupType) => void;
  onLanguageChange: (lang: Language) => void;
  t: (key: string) => string;
}

export const GameUI: React.FC<GameUIProps> = ({ currentDonut, updateDonut, gameState, onServe, onTogglePause, onVolumeChange, onActivatePowerup, onLanguageChange, t }) => {
  const isRing = currentDonut.shape === DonutShape.RING;
  const isRTL = gameState.language === Language.HE;

  // Streak/Multiplier Logic
  // Tiers: 0-2 (x1), 3-5 (x2), 6-9 (x3), 10+ (x4)
  let nextThreshold = 3;
  let prevThreshold = 0;
  if (gameState.streak >= 10) { prevThreshold = 10; nextThreshold = 20; } // Maxed out basically
  else if (gameState.streak >= 6) { prevThreshold = 6; nextThreshold = 10; }
  else if (gameState.streak >= 3) { prevThreshold = 3; nextThreshold = 6; }
  
  const streakProgress = Math.min(100, ((gameState.streak - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

  return (
    <>
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 z-10" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* HUD Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border-b-4 border-pink-400 max-w-[200px] sm:max-w-xs transition-transform hover:scale-105">
          <h2 className="text-lg font-bold text-pink-600 mb-1">{t('order')}</h2>
          <div className="text-xs sm:text-sm text-gray-700 space-y-1 font-medium">
            {gameState.currentOrder ? (
              <>
                 <div className="flex items-center gap-1">🍩 <span className="uppercase tracking-tight text-xs">{t(gameState.currentOrder.dough)} {gameState.currentOrder.shape === DonutShape.FILLED ? "" : ""}</span></div>
                 <div className="flex items-center gap-1">🍯 <span className="uppercase tracking-tight text-xs">{t(gameState.currentOrder.topping.replace('NONE', 'no_glaze').replace('_', ' '))}</span></div>
                 <div className="flex items-center gap-1">🍓 <span className="uppercase tracking-tight text-xs">{gameState.currentOrder.filling === Filling.NONE ? t('no_filling') : t(gameState.currentOrder.filling)}</span></div>
                 <div className="flex items-center gap-1">✨ <span className="uppercase tracking-tight text-xs">{t(gameState.currentOrder.sprinkles.replace('NONE', 'no_sprinkles'))}</span></div>
              </>
            ) : (
              <span>{t('relax')}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
             <div className="flex gap-2 items-center">
                {/* Streak/Multiplier Badge */}
                <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border-2 border-orange-400 relative flex items-center gap-2">
                    <div className="flex flex-col items-center leading-none">
                         <div className="flex items-center text-orange-600 font-black text-sm">
                             <Flame size={14} fill="currentColor" className={gameState.streak > 0 ? "animate-pulse" : ""} />
                             <span className="ml-0.5">{gameState.streak}</span>
                         </div>
                         {/* Streak Bar */}
                         <div className="w-10 h-1 bg-gray-200 rounded-full mt-0.5 overflow-hidden">
                             <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${streakProgress}%` }}></div>
                         </div>
                    </div>
                    {gameState.multiplier > 1 && (
                         <div className="bg-red-500 text-white text-xs font-black px-1.5 py-0.5 rounded ml-1 animate-bounce shadow-sm">
                             x{gameState.multiplier}
                         </div>
                    )}
                </div>
                
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-yellow-400 relative">
                    <span className="text-xl font-black text-yellow-500 flex items-center gap-2 drop-shadow-sm">
                        🪙 {gameState.score}
                    </span>
                </div>
                <button 
                    onClick={onTogglePause}
                    className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white p-2 rounded-full shadow-lg transition-all border-2 border-blue-400"
                >
                    {gameState.isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                </button>
            </div>

            <div className={`px-4 py-1 rounded-full shadow-lg border-2 font-mono text-xl font-bold transition-all transform flex flex-row-reverse gap-1 ${gameState.timeLeft < 10 ? 'bg-red-100 border-red-500 text-red-600 animate-pulse scale-110' : 'bg-white/90 border-blue-400 text-blue-600'}`}>
                <span>s</span><span>{gameState.timeLeft}</span><span>⏳</span>
            </div>
             <div className="bg-purple-100/90 backdrop-blur-md px-3 py-1 rounded-lg border border-purple-300 text-purple-800 text-xs font-bold shadow-sm">
                {t('level')} {gameState.level}
            </div>
        </div>
      </div>

      {/* Center: Power-up Bar */}
      <div className={`pointer-events-auto absolute top-1/2 transform -translate-y-1/2 flex flex-col gap-4 ${isRTL ? 'left-2 sm:left-4' : 'right-2 sm:right-4'}`}>
          {/* Time Freeze */}
          <button 
            onClick={() => onActivatePowerup(PowerupType.TIME_FREEZE)}
            disabled={gameState.inventory[PowerupType.TIME_FREEZE] <= 0}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center border-2 transition-all duration-300 relative group
                ${gameState.activeEffects[PowerupType.TIME_FREEZE] > Date.now() 
                    ? 'bg-blue-500 border-blue-200 ring-4 ring-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110' 
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-110 active:scale-95'
                }
                ${gameState.inventory[PowerupType.TIME_FREEZE] <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
            `}
          >
              <Snowflake size={24} className={`transition-all duration-1000 ${gameState.activeEffects[PowerupType.TIME_FREEZE] > Date.now() ? "text-white animate-spin" : "text-blue-500 group-hover:text-blue-600"}`} />
              <div className={`absolute -bottom-1 bg-gray-800 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm ${isRTL ? '-left-1' : '-right-1'}`}>
                  {gameState.inventory[PowerupType.TIME_FREEZE]}
              </div>
          </button>

          {/* Double Points */}
          <button 
            onClick={() => onActivatePowerup(PowerupType.DOUBLE_POINTS)}
            disabled={gameState.inventory[PowerupType.DOUBLE_POINTS] <= 0}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center border-2 transition-all duration-300 relative group
                ${gameState.activeEffects[PowerupType.DOUBLE_POINTS] > Date.now() 
                    ? 'bg-yellow-400 border-yellow-200 ring-4 ring-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.6)] scale-110 animate-bounce' 
                    : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:scale-110 active:scale-95'
                }
                ${gameState.inventory[PowerupType.DOUBLE_POINTS] <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
            `}
          >
              <Coins size={24} className={`transition-colors ${gameState.activeEffects[PowerupType.DOUBLE_POINTS] > Date.now() ? "text-white" : "text-yellow-600 group-hover:text-yellow-700"}`} />
              <div className={`absolute -bottom-1 bg-gray-800 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm ${isRTL ? '-left-1' : '-right-1'}`}>
                  {gameState.inventory[PowerupType.DOUBLE_POINTS]}
              </div>
          </button>

           {/* Instant Cook */}
           <button 
            onClick={() => onActivatePowerup(PowerupType.INSTANT_COOK)}
            disabled={gameState.inventory[PowerupType.INSTANT_COOK] <= 0}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center border-2 transition-all duration-300 relative group
                bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-110 active:scale-95
                ${gameState.inventory[PowerupType.INSTANT_COOK] <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
            `}
          >
              <Zap size={24} className="text-purple-500 group-hover:text-purple-600 group-hover:fill-current transition-colors" />
              <div className={`absolute -bottom-1 bg-gray-800 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm ${isRTL ? '-left-1' : '-right-1'}`}>
                  {gameState.inventory[PowerupType.INSTANT_COOK]}
              </div>
          </button>
      </div>

      {/* Controls Container */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t-4 border-pink-400 mx-auto max-w-5xl w-full max-h-[50vh] overflow-y-auto sm:overflow-visible">
        
        {/* Scrollable controls for mobile */}
        <div className="flex flex-col gap-3">
            
            {/* Row 1: Base Dough & Shape */}
            <div className="flex flex-wrap gap-2 items-center justify-center border-b border-gray-100 pb-2">
                <span className={`text-xs font-bold text-gray-400 uppercase ${isRTL ? 'ml-2' : 'mr-2'}`}>{t('base')}</span>
                
                {/* Shapes */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    <button 
                        onClick={() => updateDonut({ shape: DonutShape.RING, filling: Filling.NONE })} 
                        className={`p-2 rounded-md transition-all active:scale-95 duration-200 ${currentDonut.shape === DonutShape.RING ? 'bg-white shadow text-pink-500 ring-2 ring-pink-400 scale-105 z-10' : 'text-gray-400 hover:bg-gray-200'}`}
                    >
                        <Circle size={18} />
                    </button>
                    <button 
                        onClick={() => updateDonut({ shape: DonutShape.FILLED })} 
                        className={`p-2 rounded-md transition-all active:scale-95 duration-200 ${currentDonut.shape === DonutShape.FILLED ? 'bg-white shadow text-pink-500 ring-2 ring-pink-400 scale-105 z-10' : 'text-gray-400 hover:bg-gray-200'}`}
                    >
                        <Square size={18} className="rounded-full" />
                    </button>
                </div>

                {/* Dough Flavors */}
                <div className="flex gap-1 overflow-x-auto p-1">
                    {Object.values(DoughFlavor).map(f => (
                         <button 
                            key={f}
                            onClick={() => updateDonut({ dough: f })}
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 
                                ${currentDonut.dough === f 
                                    ? 'bg-[#8B4513] text-white shadow-[0_0_0_2px_#fff,0_0_0_4px_#8B4513] scale-105 z-10' 
                                    : 'bg-[#E5D3B3] text-[#5D4037] hover:bg-[#D7C2A2]'
                                }
                            `}
                         >
                            {t(f)}
                         </button>
                    ))}
                </div>
            </div>

            {/* Row 2: Toppings & Fillings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-gray-100 pb-2">
                 {/* Toppings */}
                 <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase text-center">{t('glaze')}</span>
                    <div className="grid grid-cols-2 gap-1 p-1">
                        {Object.values(Topping).map((tVal) => (
                            <button 
                                key={tVal}
                                onClick={() => updateDonut({ topping: tVal })}
                                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 active:scale-95 border-2
                                    ${currentDonut.topping === tVal 
                                        ? 'bg-pink-100 border-pink-400 text-pink-600 shadow-[0_4px_0_0_rgba(236,72,153,0.4)] -translate-y-0.5' 
                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-200'
                                    }
                                `}
                            >
                                {t(tVal.replace('NONE', 'no_glaze').replace('_', ' '))}
                            </button>
                        ))}
                    </div>
                 </div>
                 
                 {/* Fillings */}
                 <div className={`flex flex-col gap-1 transition-opacity ${isRing ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <span className="text-xs font-bold text-gray-400 uppercase text-center">{t('filling')}</span>
                    <div className="grid grid-cols-3 gap-1 p-1">
                        {Object.values(Filling).map((f) => (
                            <button 
                                key={f}
                                disabled={isRing}
                                onClick={() => updateDonut({ filling: f })}
                                className={`p-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 active:scale-95 truncate border-2
                                    ${currentDonut.filling === f 
                                        ? 'bg-red-50 border-red-400 text-red-700 shadow-[inset_0_2px_4px_rgba(220,38,38,0.15)] ring-2 ring-red-200' 
                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {t(f.replace('NONE', 'no_filling'))}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

            {/* Row 3: Sprinkles & Serve */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                     <span className="text-xs font-bold text-gray-400 uppercase block text-center mb-1">{t('sprinkles')}</span>
                     {/* Sprinkles */}
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1">
                        {Object.values(Sprinkles).map((s) => (
                            <button 
                                key={s}
                                onClick={() => updateDonut({ sprinkles: s })}
                                className={`p-2 rounded-lg text-[10px] font-bold transition-all duration-200 active:scale-95 border-2
                                    ${currentDonut.sprinkles === s 
                                        ? 'bg-white border-blue-400 text-blue-600 shadow-[2px_2px_0_0_#60A5FA] border-dashed scale-[1.02]' 
                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {t(s.replace('NONE', 'no_sprinkles').replace('_', ' '))}
                            </button>
                        ))}
                     </div>
                </div>

                <button 
                    onClick={onServe}
                    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 active:from-yellow-500 active:to-orange-600 text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_4px_0_0_#d97706] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 min-h-[50px] transform duration-100"
                >
                    {t('serve')} <Check size={28} className="drop-shadow-md" />
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
                    {t('tasty')}
                </div>
            ) : (
                <div className="animate-shake text-6xl font-black text-red-500 drop-shadow-[0_4px_0_rgba(255,255,255,1)]">
                    {t('oops')}
                </div>
            )}
        </div>
    )}

    {/* Bonus Feedback */}
    {gameState.bonusMessage && (
        <div className="absolute top-1/4 left-0 right-0 pointer-events-none flex items-center justify-center z-50">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></div>
            <div className="text-4xl font-black text-yellow-500 drop-shadow-[0_4px_0_rgba(255,255,255,1)] animate-bounce relative text-center">
                {t(gameState.bonusMessage.replace(/[\s!]/g, '')) || gameState.bonusMessage} 
                {/* Fallback to original string if key not found (simple mapping for bonus) */}
            </div>
        </div>
    )}

    {/* Pause Overlay */}
    {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center min-w-[300px] max-w-sm w-full mx-4">
                <h2 className="text-4xl font-black text-blue-600 mb-6">{t('pause')}</h2>
                
                {/* Settings */}
                <div className="bg-gray-50 p-4 rounded-xl mb-6 flex flex-col gap-4">
                    <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider border-b border-gray-200 pb-2">{t('settings')}</h3>
                    
                    {/* Volume */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">{t('musicVol')}</label>
                        <div className="flex items-center gap-4">
                            <VolumeX size={20} className="text-gray-400" />
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={gameState.musicVolume} 
                                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <Volume2 size={20} className="text-blue-500" />
                        </div>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">{t('language')}</label>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
                            <Globe size={18} className="text-gray-400" />
                            <select 
                                value={gameState.language} 
                                onChange={(e) => onLanguageChange(e.target.value as Language)}
                                className="w-full bg-transparent font-medium text-gray-700 focus:outline-none"
                            >
                                <option value={Language.EN}>English</option>
                                <option value={Language.HE}>עברית (Hebrew)</option>
                                <option value={Language.ES}>Español (Spanish)</option>
                                <option value={Language.FR}>Français (French)</option>
                                <option value={Language.ZH}>中文 (Chinese)</option>
                                <option value={Language.RU}>Русский (Russian)</option>
                                <option value={Language.HI}>हिन्दी (Hindi)</option>
                                <option value={Language.DE}>Deutsch (German)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onTogglePause}
                    className="bg-blue-500 text-white text-xl font-bold py-3 px-12 rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95 w-full"
                >
                    {t('resume')}
                </button>

                 <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center gap-1 text-xs text-gray-400 font-medium w-full">
                    <span>(C) Noam Gold AI 2025</span>
                    <a href="mailto:gold.noam@gmail.com" className="hover:text-blue-500 hover:underline transition-all">Send Feedback</a>
                </div>
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
