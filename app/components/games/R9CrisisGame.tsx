'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { R9_STORY, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

const createAudioContext = () => new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

export default function R9CrisisGame({ onComplete, onBack, startTime }: Props) {
  const [gamePhase, setGamePhase] = useState<'intro' | 'step1' | 'step2' | 'step3' | 'result'>('intro');
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [bpm, setBpm] = useState(0);
  const [feedback, setFeedback] = useState('READY');
  const [feedbackColor, setFeedbackColor] = useState('#1E3A5F');
  const [perfectCount, setPerfectCount] = useState(0);
  const [heartBeat, setHeartBeat] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPass, setIsPass] = useState(false);

  const lastClickTime = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mission = MISSIONS[8];

  const playSound = useCallback((type: 'tick' | 'correct' | 'error') => {
    if (!audioCtxRef.current) audioCtxRef.current = createAudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    switch (type) {
      case 'correct':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        break;
      case 'error':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        break;
      default:
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    setGamePhase('result');
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setAiScore(0);
    setTimeLeft(30);
    setPerfectCount(0);
    setFeedback('START!');
    lastClickTime.current = 0;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { endGame(); return 0; }
        return prev - 1;
      });
    }, 1000);
    aiTimerRef.current = setInterval(() => {
      if (Math.random() < 0.88) {
        setAiScore(prev => prev + 95 + Math.floor(Math.random() * 20));
      } else {
        setAiScore(prev => prev + 30);
      }
    }, 650);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (gamePhase === 'result') setIsPass(score > aiScore);
  }, [gamePhase, score, aiScore]);

  const handleCompression = useCallback(() => {
    if (!isPlaying) return;
    const now = Date.now();
    if (lastClickTime.current !== 0 && now - lastClickTime.current < 200) return;
    setHeartBeat(true);
    setTimeout(() => setHeartBeat(false), 150);
    if (lastClickTime.current === 0) {
      lastClickTime.current = now;
      playSound('tick');
      return;
    }
    const delta = now - lastClickTime.current;
    lastClickTime.current = now;
    const currentBpm = Math.round(60000 / delta);
    setBpm(currentBpm);
    let scoreAdd = 0;
    if (currentBpm >= 100 && currentBpm <= 120) {
      setFeedback('PERFECT!'); setFeedbackColor('#16a34a'); playSound('correct');
      scoreAdd = 150 + (perfectCount * 20); setPerfectCount(prev => prev + 1);
    } else if ((currentBpm >= 85 && currentBpm < 100) || (currentBpm > 120 && currentBpm <= 140)) {
      setFeedback('GOOD'); setFeedbackColor('#1E3A5F'); playSound('tick');
      scoreAdd = 60; setPerfectCount(0);
    } else if (currentBpm < 85) {
      setFeedback('TOO SLOW!'); setFeedbackColor('#d97706'); playSound('error');
      setPerfectCount(0);
    } else if (currentBpm > 140 && currentBpm <= 200) {
      setFeedback('TOO FAST!'); setFeedbackColor('#dc2626'); playSound('error');
      setPerfectCount(0);
    } else {
      setFeedback('WRONG!'); setFeedbackColor('#dc2626'); playSound('error');
      scoreAdd = -50; setPerfectCount(0);
    }
    setScore(prev => Math.max(0, prev + scoreAdd));
  }, [isPlaying, perfectCount, playSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPlaying) { e.preventDefault(); handleCompression(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handleCompression]);

  const handleFinish = () => {
    if (isPass) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      onComplete(mission.score, elapsed);
    }
  };

  const bpmPercent = Math.min((bpm / 200) * 100, 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: '#FFFDF7' }}>
      <div className="absolute w-72 h-72 rounded-full opacity-20 -top-12 -left-12" style={{ background: '#1E3A5F', filter: 'blur(80px)' }} />
      <div className="absolute w-96 h-96 rounded-full opacity-20 -bottom-24 -right-24" style={{ background: '#A78BFA', filter: 'blur(80px)' }} />

      <div className="relative w-full max-w-md nb-card rounded-3xl overflow-hidden" style={{ maxHeight: '90vh' }}>
        <div className="p-4 text-center border-b border-cl-navy/20 bg-cl-bg">
          <h1 className="text-xl font-bold text-cl-text font-[family-name:var(--font-space)]">CPR MASTER : AI BATTLE</h1>
          <div className="text-xs text-cl-navy/60 font-[family-name:var(--font-mono)]">배점: {mission.score}점</div>
        </div>
        <button onClick={onBack} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-cl-red text-white font-bold flex items-center justify-center hover:opacity-80 z-10">X</button>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {gamePhase === 'intro' && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🚑</div>
              <h2 className="text-2xl font-bold text-cl-text font-[family-name:var(--font-space)]">MISSION START</h2>
              <p className="text-cl-text/70 text-sm leading-relaxed">{R9_STORY}</p>
              <p className="text-cl-navy text-sm border border-cl-navy/30 rounded-lg px-3 py-2 font-[family-name:var(--font-mono)]">
                PASS: AI 점수보다 높으면 승리 | 적정 BPM: 100-120
              </p>
              <button onClick={() => setGamePhase('step1')} className="w-full py-4 text-lg nb-btn bg-cl-navy text-white">
                START BATTLE
              </button>
            </div>
          )}

          {gamePhase === 'step1' && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-cl-text font-[family-name:var(--font-space)]">STEP 1: 의식 확인</h2>
              <p className="text-cl-text/70">쓰러진 동료를 발견! 어깨를 두드려 의식을 확인하세요.</p>
              <button onClick={() => setGamePhase('step2')} className="w-32 h-32 rounded-full bg-white/10 border-2 border-cl-navy/50 text-5xl mx-auto flex items-center justify-center hover:bg-white/20 transition-all">
                👆
              </button>
            </div>
          )}

          {gamePhase === 'step2' && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-cl-text font-[family-name:var(--font-space)]">STEP 2: 구조 요청</h2>
              <p className="text-cl-text/70">반응이 없습니다! 즉시 119에 신고하세요.</p>
              <button onClick={() => { setGamePhase('step3'); startGame(); }} className="w-24 h-24 rounded-3xl text-2xl font-bold text-white mx-auto flex items-center justify-center animate-pulse bg-cl-red">
                119
              </button>
            </div>
          )}

          {gamePhase === 'step3' && (
            <div className="space-y-4">
              <div className="flex justify-between bg-white rounded-xl p-3 text-cl-text font-bold font-[family-name:var(--font-mono)]">
                <span className="text-cl-navy">ME: {score}</span>
                <span>{timeLeft}s</span>
                <span className="text-cl-text/50">AI: {aiScore}</span>
              </div>
              <div className="text-center text-3xl font-black uppercase" style={{ color: feedbackColor }}>
                {feedback}
              </div>
              <div className="text-center py-4">
                <span className={`text-8xl inline-block transition-transform ${heartBeat ? 'scale-110' : 'scale-100'}`}>❤️</span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div className="absolute top-0 bottom-0 bg-cl-green/30 rounded" style={{ left: '50%', width: '10%' }} />
                <div className="h-full rounded-full transition-all" style={{
                  width: `${bpmPercent}%`,
                  background: bpm >= 100 && bpm <= 120 ? 'linear-gradient(90deg, #16a34a, #1E3A5F)' : bpm >= 85 && bpm <= 140 ? '#1E3A5F' : '#dc2626',
                }} />
              </div>
              <p className="text-center text-cl-navy font-bold text-lg font-[family-name:var(--font-mono)]">BPM: {bpm}</p>
              <button
                onPointerDown={e => { e.preventDefault(); handleCompression(); }}
                className="w-full py-8 nb-card rounded-xl text-cl-text font-bold text-xl border border-cl-navy/20 hover:bg-cl-bg active:scale-95 transition-all select-none"
                style={{ touchAction: 'manipulation' }}
              >
                TAP HERE!
              </button>
            </div>
          )}

          {gamePhase === 'result' && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-cl-text font-[family-name:var(--font-space)]">BATTLE RESULT</h2>
              <div className="bg-white rounded-2xl p-6 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className={`inline-block px-6 py-2 rounded-full text-xl font-black ${isPass ? 'bg-cl-green text-black' : 'bg-cl-red text-white'}`}>
                  {isPass ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                </span>
                <p className="text-cl-text/50 text-sm mt-4">최종 점수</p>
                <p className="text-4xl font-black text-cl-navy">{score}</p>
                <p className="text-cl-text font-bold mt-4">
                  {isPass ? `AI를 ${score - aiScore}점 차이로 이겼습니다!` : `AI에게 ${aiScore - score}점 차이로 졌습니다.`}
                </p>
              </div>
              {isPass ? (
                <button onClick={handleFinish} className="w-full py-4 text-lg nb-btn bg-cl-green text-white">
                  MISSION CLEAR
                </button>
              ) : (
                <>
                  <button onClick={() => { setGamePhase('step1'); setScore(0); setAiScore(0); setTimeLeft(30); setBpm(0); }} className="w-full py-4 text-lg nb-btn bg-cl-navy text-white">
                    RETRY
                  </button>
                  <button onClick={onBack} className="w-full py-3 text-cl-text/40 hover:text-cl-text">CLOSE</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-3 text-center text-cl-text/30 text-xs border-t border-white/5 bg-cl-bg font-[family-name:var(--font-mono)]">
          JJ CREATIVE Edu with AI
        </div>
      </div>
    </div>
  );
}
