'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { R4_STORY, R4_GAME_DATA, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioCtx;
};

const R4Sounds = {
  playTick: (rate: number) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400 + (rate * 400), ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },
  playError: () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  },
  playCorrect: () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  },
  playAlarm: () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  },
};

export default function R4AssignmentGame({ onComplete, onBack, startTime }: Props) {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentSet, setCurrentSet] = useState(0);
  const [foundDiffs, setFoundDiffs] = useState<Record<number, number[]>>({});
  const [cleared, setCleared] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const [wrongMarkers, setWrongMarkers] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const wrongMarkerIdRef = useRef(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mission = MISSIONS[3];

  // Timer
  useEffect(() => {
    if (!gameStarted || cleared || failed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setFailed(true);
          R4Sounds.playAlarm();
          return 0;
        }
        if (prev <= 10) {
          R4Sounds.playTick(1 - prev / 60);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, cleared, failed]);

  // Ticking sound
  useEffect(() => {
    if (gameStarted && !cleared && !failed) {
      soundIntervalRef.current = setInterval(() => {
        R4Sounds.playTick(1 - timeLeft / 60);
      }, 1000);
    }
    return () => { if (soundIntervalRef.current) clearInterval(soundIntervalRef.current); };
  }, [gameStarted, cleared, failed, timeLeft]);

  // Retry countdown
  useEffect(() => {
    if (!failed) return;
    setRetryCountdown(5);
    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          handleRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  const handleRetry = useCallback(() => {
    setFailed(false);
    setTimeLeft(60);
    setCurrentSet(0);
    setFoundDiffs({});
    setWrongMarkers([]);
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || cleared || failed) return;
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const currentAnswers = R4_GAME_DATA[currentSet].answers;
    const found = foundDiffs[currentSet] || [];

    let matched = false;
    currentAnswers.forEach((ans, idx) => {
      if (found.includes(idx)) return;
      const dist = Math.sqrt((clickX - ans.x) ** 2 + (clickY - ans.y) ** 2);
      if (dist <= ans.r) {
        matched = true;
        R4Sounds.playCorrect();
        const newFound = { ...foundDiffs, [currentSet]: [...found, idx] };
        setFoundDiffs(newFound);

        if (newFound[currentSet]?.length === currentAnswers.length) {
          if (currentSet < R4_GAME_DATA.length - 1) {
            setTimeout(() => setCurrentSet(prev => prev + 1), 500);
          } else {
            setCleared(true);
          }
        }
      }
    });

    if (!matched) {
      R4Sounds.playError();
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
      const markerId = wrongMarkerIdRef.current++;
      setWrongMarkers(prev => [...prev, { x: clickX, y: clickY, id: markerId }]);
      setTimeout(() => {
        setWrongMarkers(prev => prev.filter(m => m.id !== markerId));
      }, 1000);
    }
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onComplete(mission.score, elapsed);
  };

  if (!gameStarted) {
    return (
      <div className="nb-card rounded-2xl p-6 max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-bold text-cl-navy font-[family-name:var(--font-space)] mb-4">
          {mission.month}: {mission.title}
        </h2>
        <div className="text-xs text-cl-navy/60 font-[family-name:var(--font-mono)] mb-4">
          배점: {mission.score}점 | 시간 보너스: {mission.timeLimit}분 이내 +{mission.timeBonus}점
        </div>
        <p className="text-cl-text/70 text-sm mb-6 leading-relaxed">{R4_STORY}</p>
        <p className="text-cl-gold text-sm mb-4">3세트 x 3개 오류 / 제한 시간: 60초</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="px-6 py-3 border border-cl-border/20 rounded-xl text-cl-text/60 hover:text-cl-text transition-all">
            BACK
          </button>
          <button onClick={() => setGameStarted(true)} className="px-8 py-3 nb-btn bg-cl-navy text-white">
            START
          </button>
        </div>
      </div>
    );
  }

  if (cleared) {
    return (
      <div className="nb-card rounded-2xl p-6 max-w-2xl mx-auto text-center py-8">
        <div className="text-4xl font-black text-cl-green mb-4 font-[family-name:var(--font-space)]">ACCESS GRANTED</div>
        <p className="text-cl-text/60 mb-6">MISSION CLEAR - {mission.score}점 획득!</p>
        <button onClick={handleClear} className="px-8 py-3 nb-btn bg-cl-navy text-white">
          NEXT MISSION →
        </button>
      </div>
    );
  }

  return (
    <div className={`nb-card rounded-2xl p-4 max-w-2xl mx-auto ${screenShake ? 'animate-shake' : ''}`}>
      {/* HUD */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-cl-navy font-[family-name:var(--font-mono)] text-sm">
          SET {currentSet + 1}/{R4_GAME_DATA.length} | FOUND: {(foundDiffs[currentSet] || []).length}/3
        </div>
        <div className={`font-bold font-[family-name:var(--font-mono)] text-lg ${timeLeft <= 10 ? 'text-cl-red animate-pulse' : 'text-cl-text'}`}>
          {timeLeft}s
        </div>
      </div>

      {failed ? (
        <div className="text-center py-8">
          <div className="text-3xl font-black text-cl-red mb-4 font-[family-name:var(--font-space)]">ACCESS DENIED</div>
          <p className="text-cl-text/60 mb-4">{retryCountdown}초 후 재시작...</p>
        </div>
      ) : (
        <div className="relative">
          <img
            ref={imageRef}
            src={R4_GAME_DATA[currentSet].img}
            alt={`업무 분장표 오류 찾기 세트 ${currentSet + 1}`}
            className="w-full rounded-xl cursor-crosshair"
            onClick={handleImageClick}
          />
          {/* Found markers */}
          {(foundDiffs[currentSet] || []).map(idx => {
            const ans = R4_GAME_DATA[currentSet].answers[idx];
            return (
              <div
                key={idx}
                className="absolute border-2 border-cl-green rounded-full pointer-events-none"
                style={{ left: `${ans.x - ans.r}%`, top: `${ans.y - ans.r}%`, width: `${ans.r * 2}%`, height: `${ans.r * 2}%` }}
              />
            );
          })}
          {/* Wrong markers */}
          {wrongMarkers.map(m => (
            <div key={m.id} className="absolute text-cl-red text-2xl font-bold pointer-events-none" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%, -50%)' }}>
              X
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
