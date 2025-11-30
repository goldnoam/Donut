
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Instance, Instances } from '@react-three/drei';
import { GameState, DonutConfig, DonutShape, DoughFlavor, Topping, Sprinkles, Filling, Prize } from './types';
import { Donut3D } from './components/Donut3D';
import { GameUI } from './components/GameUI';
import { generatePrize } from './services/geminiService';
import * as THREE from 'three';

const INITIAL_DONUT: DonutConfig = {
  shape: DonutShape.RING,
  dough: DoughFlavor.CLASSIC,
  topping: Topping.NONE,
  sprinkles: Sprinkles.NONE,
  filling: Filling.NONE,
};

const INITIAL_STATE: GameState = {
  score: 0,
  level: 1,
  timeLeft: 60,
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  currentOrder: null,
  currentDonut: INITIAL_DONUT,
  prize: null,
  isLoadingPrize: false,
  lastFeedback: null,
  streak: 0,
  multiplier: 1,
  pendingTimeBonus: 0,
  bonusMessage: null,
  orderStartTime: 0
};

// 3D Confetti Particle System
const Confetti = () => {
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    return (
        <Instances range={100}>
            <boxGeometry args={[0.05, 0.05, 0.05]} />
            <meshBasicMaterial ref={materialRef} toneMapped={false} />
            {Array.from({ length: 50 }).map((_, i) => (
                <ConfettiParticle key={i} />
            ))}
        </Instances>
    )
}

const ConfettiParticle = () => {
    const ref = useRef<any>(null);
    const [speed] = useState(() => Math.random() * 0.2 + 0.1);
    const [offset] = useState(() => new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3));
    const [color] = useState(() => new THREE.Color().setHSL(Math.random(), 1, 0.5));

    useFrame((state) => {
        if (!ref.current) return;
        const time = state.clock.getElapsedTime();
        // Explosion effect
        ref.current.position.x = offset.x * (time * 2 % 3);
        ref.current.position.y = offset.y * (time * 2 % 3) + 2 - (time * 2 % 3) * (time * 2 % 3); // Gravity-ish
        ref.current.position.z = offset.z * (time * 2 % 3);
        ref.current.rotation.x += speed;
        ref.current.rotation.y += speed;
        ref.current.scale.setScalar(Math.max(0, 1 - (time % 1.5)));
        ref.current.color = color;
    });

    return <Instance ref={ref} color={color} />
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const isMusicPlayingRef = useRef<boolean>(false);
  
  // Feedback cleanup timer
  useEffect(() => {
    if (gameState.lastFeedback) {
        const timer = setTimeout(() => {
            setGameState(prev => ({ ...prev, lastFeedback: null }));
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [gameState.lastFeedback]);

  // Bonus message cleanup
  useEffect(() => {
      if (gameState.bonusMessage) {
          const timer = setTimeout(() => {
              setGameState(prev => ({ ...prev, bonusMessage: null }));
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [gameState.bonusMessage]);

  // Audio System
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      musicGainRef.current = audioContextRef.current.createGain();
      musicGainRef.current.gain.value = 0.05; // Low volume for background
      musicGainRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const playSound = (type: 'win' | 'fail' | 'tick' | 'pop' | 'serve' | 'click' | 'dough' | 'glaze' | 'sprinkles' | 'filling' | 'success' | 'gameover' | 'prize' | 'bonus') => {
    if (gameState.isPaused && type !== 'click') return; // Allow click sound even when paused for resume button

    initAudio();
    const ctx = audioContextRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'dough':
        // Soft, dull thud for dough
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'glaze':
        // Liquid, glossy sweep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'sprinkles':
        // High pitched, short texture
        osc.type = 'square';
        osc.frequency.setValueAtTime(1400, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
        // Second little particle
        const oscS2 = ctx.createOscillator();
        const gainS2 = ctx.createGain();
        oscS2.connect(gainS2);
        gainS2.connect(ctx.destination);
        oscS2.type = 'square';
        oscS2.frequency.setValueAtTime(1600, now + 0.04);
        gainS2.gain.setValueAtTime(0.02, now + 0.04);
        gainS2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        oscS2.start(now + 0.04);
        oscS2.stop(now + 0.07);
        break;
      case 'filling':
        // Bloop/injection sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'success':
        // Celebratory chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      case 'win': // Level Up
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
        osc.start(now);
        osc.stop(now + 1.0);
        break;
      case 'prize': // Prize Reveal
        osc.type = 'sine';
        // Magical arpeggio
        [440, 554, 659, 880, 1108].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.05, now + i*0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 1);
            o.start(now + i*0.1);
            o.stop(now + i*0.1 + 1);
        });
        break;
      case 'fail':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'gameover':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 1);
        osc.start(now);
        osc.stop(now + 1);
        break;
      case 'pop': // General UI
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'tick':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'serve':
        // Whoosh
        const noiseBufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < noiseBufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(400, now);
        noiseFilter.frequency.linearRampToValueAtTime(1000, now + 0.2);
        noise.connect(noiseFilter);
        noiseFilter.connect(gain);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        noise.start(now);
        break;
      case 'bonus':
         // Powerup sound
         osc.type = 'triangle';
         osc.frequency.setValueAtTime(600, now);
         osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
         gain.gain.setValueAtTime(0.2, now);
         gain.gain.linearRampToValueAtTime(0, now + 0.3);
         osc.start(now);
         osc.stop(now + 0.3);
         break;
    }
  };

  // Background Music Loop
  const scheduleMusic = useCallback(() => {
    if (!isMusicPlayingRef.current || !audioContextRef.current || !musicGainRef.current) return;
    if (audioContextRef.current.state === 'suspended') return;

    const ctx = audioContextRef.current;
    const lookahead = 25.0; 
    const scheduleAheadTime = 0.1; 

    if (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      // Hanukkah-ish scale (Minor harmonic)
      const notes = [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 493.88];
      const note = notes[Math.floor(Math.random() * notes.length)];
      
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      osc.connect(noteGain);
      noteGain.connect(musicGainRef.current);
      
      osc.frequency.value = note;
      osc.type = 'triangle'; // Softer
      
      noteGain.gain.setValueAtTime(0, nextNoteTimeRef.current);
      noteGain.gain.linearRampToValueAtTime(0.05, nextNoteTimeRef.current + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.001, nextNoteTimeRef.current + 1.5);
      
      osc.start(nextNoteTimeRef.current);
      osc.stop(nextNoteTimeRef.current + 1.5);

      nextNoteTimeRef.current += 0.5; 
    }
    
    setTimeout(scheduleMusic, lookahead);
  }, []);

  const startMusic = () => {
     if (isMusicPlayingRef.current && audioContextRef.current?.state === 'running') return;
     initAudio();
     isMusicPlayingRef.current = true;
     nextNoteTimeRef.current = audioContextRef.current!.currentTime + 0.1;
     scheduleMusic();
  };

  const stopMusic = () => {
      isMusicPlayingRef.current = false;
  };

  const togglePause = () => {
      playSound('click');
      setGameState(prev => {
          const newPaused = !prev.isPaused;
          if (newPaused) {
              audioContextRef.current?.suspend();
          } else {
              audioContextRef.current?.resume();
              nextNoteTimeRef.current = audioContextRef.current!.currentTime + 0.1;
          }
          return { ...prev, isPaused: newPaused };
      });
  };

  // Generate a random order based on level
  const generateOrder = useCallback((level: number): DonutConfig => {
    const isComplex = level > 2;
    // const isVeryComplex = level > 4;

    const shapes = Object.values(DonutShape);
    const doughs = Object.values(DoughFlavor);
    const toppings = Object.values(Topping);
    const fillings = Object.values(Filling);
    const sprinklesList = Object.values(Sprinkles);
    
    // Level-gated random generation
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    // Dough flavor mostly classic early on, random later
    let dough = DoughFlavor.CLASSIC;
    if (level > 1 && Math.random() > 0.5) {
        dough = doughs[Math.floor(Math.random() * doughs.length)];
    }

    let topping = Topping.NONE;
    if (Math.random() > 0.3) {
        topping = toppings[Math.floor(Math.random() * toppings.length)];
    }

    let filling = Filling.NONE;
    if (shape === DonutShape.FILLED) {
       filling = fillings[Math.floor(Math.random() * (fillings.length - 1)) + 1]; 
       if(Math.random() > 0.8) filling = Filling.NONE; 
    }

    let sprinkles = Sprinkles.NONE;
    if (isComplex || Math.random() > 0.6) {
       sprinkles = sprinklesList[Math.floor(Math.random() * sprinklesList.length)];
       // Remove NONE from choice if we decided to add sprinkles
       if (sprinkles === Sprinkles.NONE) sprinkles = Sprinkles.RAINBOW;
    }

    return { shape, dough, topping, sprinkles, filling };
  }, []);

  // Timer
  useEffect(() => {
    let interval: number;
    if (gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver && gameState.timeLeft > 0 && !gameState.prize) {
      interval = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
             playSound('gameover');
             stopMusic();
             return { ...prev, timeLeft: 0, isGameOver: true, isPlaying: false };
          }
          if(prev.timeLeft <= 10) playSound('tick');
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.timeLeft, gameState.prize]);

  const startGame = () => {
    playSound('success');
    const firstOrder = generateOrder(1);
    setGameState({
      ...INITIAL_STATE,
      isPlaying: true,
      currentOrder: firstOrder,
      timeLeft: 60,
      orderStartTime: Date.now()
    });
    startMusic();
  };

  const nextLevel = async () => {
     stopMusic(); 
     playSound('prize');
     setGameState(prev => ({ ...prev, isLoadingPrize: true }));
     
     const prize = await generatePrize();
     
     if (prize) {
         setGameState(prev => ({
             ...prev,
             prize: prize,
             isLoadingPrize: false
         }));
         playSound('win');
     } else {
         setGameState(prev => ({
            ...prev,
            prize: { name: "Mystery Token", description: "A strange glitch in the matrix...", image: "https://picsum.photos/500" },
            isLoadingPrize: false
        }));
     }
  };

  const continueGame = () => {
      playSound('click');
      startMusic();
      const nextLvl = gameState.level + 1;
      const addedTime = gameState.pendingTimeBonus;
      
      setGameState(prev => ({
          ...prev,
          level: nextLvl,
          timeLeft: Math.max(20, 60 - (nextLvl * 5)) + addedTime, 
          prize: null,
          currentOrder: generateOrder(nextLvl),
          currentDonut: INITIAL_DONUT,
          lastFeedback: null,
          pendingTimeBonus: 0,
          orderStartTime: Date.now()
      }));
  };

  const updateDonut = (updates: Partial<DonutConfig>) => {
    if (gameState.isPaused) return;
    
    // Play specific sounds based on what is being updated
    if (updates.dough) playSound('dough');
    else if (updates.topping) playSound('glaze');
    else if (updates.sprinkles) playSound('sprinkles');
    else if (updates.filling) playSound('filling');
    else playSound('click');

    setGameState(prev => ({
      ...prev,
      currentDonut: { ...prev.currentDonut, ...updates }
    }));
  };

  const handleServe = () => {
    if (gameState.isPaused) return;

    const { currentDonut, currentOrder, score, level, streak, multiplier, timeLeft, orderStartTime } = gameState;
    if (!currentOrder) return;

    const isCorrect = 
        currentDonut.shape === currentOrder.shape &&
        currentDonut.dough === currentOrder.dough &&
        currentDonut.topping === currentOrder.topping &&
        currentDonut.sprinkles === currentOrder.sprinkles &&
        currentDonut.filling === currentOrder.filling;

    if (isCorrect) {
        playSound('serve');
        setTimeout(() => playSound('success'), 200);

        const newStreak = streak + 1;
        
        // Multiplier Logic
        let newMultiplier = 1;
        if (newStreak >= 10) newMultiplier = 4;
        else if (newStreak >= 6) newMultiplier = 3;
        else if (newStreak >= 3) newMultiplier = 2;

        // Speed Bonus Logic
        const timeTaken = (Date.now() - orderStartTime) / 1000;
        let speedBonus = 0;
        let bonusMsg = null;
        
        if (timeTaken < 5) {
            speedBonus = 5;
            bonusMsg = "⚡ SPEED BONUS! +5s";
            playSound('bonus');
        } else if (timeTaken < 8) {
            speedBonus = 2;
            bonusMsg = "⚡ FAST! +2s";
            playSound('bonus');
        }

        const baseScore = (10 * level);
        const timeScore = Math.floor(timeLeft / 2);
        const orderScore = (baseScore + timeScore) * newMultiplier;
        const newScore = score + orderScore;

        setGameState(prev => ({ 
            ...prev, 
            score: newScore,
            lastFeedback: 'success',
            streak: newStreak,
            multiplier: newMultiplier,
            pendingTimeBonus: prev.pendingTimeBonus + speedBonus,
            bonusMessage: bonusMsg
        }));
        setTimeout(() => nextLevel(), 1000); 
    } else {
        playSound('fail');
        setGameState(prev => ({ 
            ...prev, 
            timeLeft: Math.max(0, prev.timeLeft - 5),
            lastFeedback: 'error',
            streak: 0,
            multiplier: 1
        }));
    }
  };

  // --- RENDERERS ---

  if (!gameState.isPlaying && !gameState.isGameOver && !gameState.prize) {
    return (
      <div className="h-screen w-screen bg-pink-100 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-xl animate-bounce"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-300 rounded-full blur-xl animate-pulse"></div>
        </div>
        
        <h1 className="text-6xl font-black text-pink-600 mb-4 drop-shadow-white relative z-10">Donut Dash 3D</h1>
        <p className="text-xl text-gray-700 mb-8 max-w-md relative z-10">
            Bake Hanukkah treats, beat the clock, and win magical AI-generated prizes!
        </p>
        <button 
            onClick={startGame}
            className="relative z-10 bg-gradient-to-tr from-pink-500 to-purple-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-xl hover:scale-105 transition-transform"
        >
            Start Baking
        </button>
      </div>
    );
  }

  if (gameState.isGameOver) {
      return (
        <div className="h-screen w-screen bg-red-50 flex flex-col items-center justify-center p-4 text-center">
            <h2 className="text-5xl font-black text-red-500 mb-4">Out of Time!</h2>
            <p className="text-2xl text-gray-800 mb-6">You reached Level {gameState.level}</p>
            <p className="text-xl text-gray-600 mb-8">Final Score: {gameState.score}</p>
            <button 
                onClick={startGame}
                className="bg-red-500 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg hover:bg-red-600"
            >
                Try Again
            </button>
        </div>
      );
  }

  if (gameState.isLoadingPrize || gameState.prize) {
      return (
          <div className="h-screen w-screen bg-indigo-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
              
              {gameState.isLoadingPrize ? (
                  <div className="text-white flex flex-col items-center z-20">
                      <div className="w-20 h-20 border-t-4 border-yellow-400 border-r-4 border-purple-500 border-l-pink-500 rounded-full animate-spin mb-6"></div>
                      <h2 className="text-3xl font-bold animate-bounce text-yellow-300">Summoning Prize...</h2>
                      <p className="text-indigo-200 mt-2 italic">Consulting the AI spirits...</p>
                  </div>
              ) : (
                  <div className="z-20 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl max-w-md w-full relative overflow-hidden">
                          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-b from-transparent via-white/5 to-transparent rotate-45 animate-pulse pointer-events-none"></div>

                          <div className="text-yellow-400 text-lg font-bold tracking-widest uppercase mb-2">Level {gameState.level} Complete!</div>
                          
                          <h2 className="text-3xl font-extrabold text-white mb-2 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                              {gameState.prize?.name}
                          </h2>
                          
                          <div className="relative aspect-square w-full bg-black/40 rounded-2xl overflow-hidden mb-6 shadow-2xl ring-4 ring-white/10 group">
                            <img 
                                src={gameState.prize?.image} 
                                alt={gameState.prize?.name} 
                                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110 hover:rotate-1" 
                            />
                             <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"></div>
                          </div>

                          <p className="text-gray-200 mb-8 italic text-lg leading-relaxed font-serif">
                              "{gameState.prize?.description}"
                          </p>

                          <button 
                            onClick={continueGame}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-black py-4 rounded-xl text-xl hover:shadow-orange-500/50 shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
                          >
                              Next Order <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  return (
    <div className="h-screen w-screen bg-blue-50 relative overflow-hidden font-sans select-none">
      <GameUI 
        currentDonut={gameState.currentDonut} 
        updateDonut={updateDonut}
        gameState={gameState}
        onServe={handleServe}
        onTogglePause={togglePause}
      />
      
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 2, 4], fov: 45 }}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={[1024, 1024]} castShadow />
          
          <Donut3D config={gameState.currentDonut} isPaused={gameState.isPaused} />
          {gameState.lastFeedback === 'success' && <Confetti />}
          
          <ContactShadows position={[0, -0.4, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color="#EAA" />
          <OrbitControls 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2.2} 
            enableZoom={false} 
            enablePan={false}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default App;
