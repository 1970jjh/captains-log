'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { R4_STORY, R4_MISSION_IMAGE, R4_GAME_DATA, R4_CLEAR_MESSAGE, MISSIONS } from '../../constants';
import { geminiService } from '../../lib/geminiService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

type Phase = 'intro' | 'playing' | 'clear';

const TIME_LIMIT = 90; // 1분 30초

export default function R4AssignmentGame({ onComplete, onBack, startTime }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentSet, setCurrentSet] = useState(0);
  const [foundAnswers, setFoundAnswers] = useState<boolean[][]>(R4_GAME_DATA.map(s => s.answers.map(() => false)));
  const [mistakes, setMistakes] = useState(0);
  const [setRetries, setSetRetries] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalRetries, setTotalRetries] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [showError, setShowError] = useState(false);
  const [showReset, setShowReset] = useState<'mistakes' | 'timeout' | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const mission = MISSIONS[3];

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setShowReset('timeout');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShowReset('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  const resetCurrentSet = useCallback(() => {
    setFoundAnswers(prev => {
      const next = [...prev];
      next[currentSet] = R4_GAME_DATA[currentSet].answers.map(() => false);
      return next;
    });
    setMistakes(0);
    setTimeLeft(TIME_LIMIT);
    setShowReset(null);
    setSetRetries(prev => prev + 1);
    setTotalRetries(prev => prev + 1);
  }, [currentSet]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (phase !== 'playing' || showReset) return;
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const setData = R4_GAME_DATA[currentSet];
    let hit = false;

    for (let i = 0; i < setData.answers.length; i++) {
      if (foundAnswers[currentSet][i]) continue;
      const ans = setData.answers[i];
      const dist = Math.sqrt((xPct - ans.x) ** 2 + (yPct - ans.y) ** 2);
      if (dist <= ans.r) {
        hit = true;
        setFoundAnswers(prev => {
          const next = [...prev];
          next[currentSet] = [...next[currentSet]];
          next[currentSet][i] = true;
          return next;
        });
        break;
      }
    }

    if (!hit) {
      setMistakes(prev => prev + 1);
      setTotalMistakes(prev => prev + 1);
      setShowError(true);
      setTimeout(() => setShowError(false), 500);

      if (mistakes + 1 >= 3) {
        setShowReset('mistakes');
      }
    }
  };

  // Check if current set is complete
  const currentSetComplete = foundAnswers[currentSet]?.every(Boolean) ?? false;
  const foundCount = foundAnswers[currentSet]?.filter(Boolean).length ?? 0;
  const totalFoundAll = foundAnswers.flat().filter(Boolean).length;

  useEffect(() => {
    if (!currentSetComplete || phase !== 'playing') return;
    const timer = setTimeout(() => {
      if (currentSet < R4_GAME_DATA.length - 1) {
        setCurrentSet(prev => prev + 1);
        setMistakes(0);
        setTimeLeft(TIME_LIMIT);
      } else {
        geminiService.speakTTS('Mission Clear!');
        setPhase('clear');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [currentSetComplete, currentSet, phase]);

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mistakePenalty = totalMistakes * 3;
    const retryPenalty = totalRetries * 5;
    const finalScore = Math.max(Math.round(mission.score * 0.3), mission.score - mistakePenalty - retryPenalty);
    onComplete(finalScore, elapsed);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr; BACK</button>
          <span className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">배점: {mission.score}점</span>
        </div>
        <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-2">{mission.month}: {mission.title}</h2>
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R4_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R4_MISSION_IMAGE} alt="4월 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-5">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#127919; 미션 규칙</h3>
          <ul className="text-xs text-cl-text/70 space-y-1 leading-relaxed">
            <li>&bull; 3세트의 이미지에서 각 <strong>3개씩, 총 9개</strong>의 차이점 찾기</li>
            <li>&bull; 세트당 제한 시간: <strong>1분 30초</strong></li>
            <li>&bull; <strong>3회 오답</strong> 또는 <strong>시간 초과</strong> 시 &rarr; 해당 세트 처음부터!</li>
            <li>&bull; 오답 1회당 <strong>-3점</strong>, 세트 재시도 1회당 <strong>-5점</strong></li>
          </ul>
        </div>

        <button onClick={() => { setPhase('playing'); setTimeLeft(TIME_LIMIT); }} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#128269; 틀린 그림 찾기 시작!
        </button>
      </div>
    );
  }

  // ============ CLEAR ============
  if (phase === 'clear') {
    const mistakePenalty = totalMistakes * 3;
    const retryPenalty = totalRetries * 5;
    const finalScore = Math.max(Math.round(mission.score * 0.3), mission.score - mistakePenalty - retryPenalty);

    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">&#127942;</div>
          <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
        </div>

        <div className="nb-card p-4 bg-cl-navy/5 mb-5">
          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R4_CLEAR_MESSAGE}</p>
        </div>

        <div className="nb-card p-4 max-w-sm mx-auto mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-cl-text/60">오답 횟수</span>
            <span className="font-black text-cl-red font-[family-name:var(--font-mono)]">{totalMistakes}회 (-{mistakePenalty}점)</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-cl-text/60">재시도 횟수</span>
            <span className="font-black text-cl-orange font-[family-name:var(--font-mono)]">{totalRetries}회 (-{retryPenalty}점)</span>
          </div>
          <div className="border-t-2 border-cl-border/20 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-cl-text">최종 점수</span>
            <span className="text-2xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{finalScore}/{mission.score}</span>
          </div>
          {totalMistakes === 0 && totalRetries === 0 && (
            <div className="mt-2 nb-badge bg-cl-gold text-cl-text border-cl-gold w-full text-center py-1 text-xs">
              &#127775; PERFECT! 실수 없이 모두 찾았습니다!
            </div>
          )}
        </div>

        <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          NEXT MISSION &rarr;
        </button>
      </div>
    );
  }

  // ============ PLAYING ============
  const setData = R4_GAME_DATA[currentSet];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="nb-card rounded-2xl p-3 mb-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr;</button>
          <div className="flex items-center gap-3">
            <span className="nb-badge bg-cl-navy text-white text-[10px]">
              SET {currentSet + 1}/3
            </span>
            <span className="nb-badge text-[10px] bg-cl-green/20 text-cl-green border-cl-green">
              &#10003; {foundCount}/3
            </span>
            <span className="text-xs text-cl-red font-[family-name:var(--font-mono)] font-bold">
              &times; {mistakes}/3
            </span>
            <span className={`nb-badge text-sm font-black font-[family-name:var(--font-mono)] ${timeLeft <= 15 ? 'bg-cl-red text-white border-cl-red animate-pulse' : 'bg-cl-gold text-cl-text border-cl-gold'}`}>
              &#9201; {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-[10px] text-cl-text/30 font-[family-name:var(--font-mono)]">
            {totalFoundAll}/9
          </span>
        </div>
        <p className="text-xs text-cl-text/50 text-center mt-1">{setData.label}</p>
      </div>

      {/* Reset Overlay */}
      {showReset && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
          <div className="nb-card p-6 max-w-sm w-full text-center animate-bounce-in bg-cl-red/10 border-cl-red">
            <div className="text-4xl mb-3">{showReset === 'timeout' ? '&#9200;' : '&#9888;'}</div>
            <h3 className="text-lg font-black text-cl-red mb-2">
              {showReset === 'timeout' ? '시간 초과!' : '3회 오답!'}
            </h3>
            <p className="text-sm text-cl-text/60 mb-4">
              {showReset === 'timeout'
                ? '제한 시간 내에 찾지 못했습니다. 처음부터 다시 도전하세요!'
                : '3번 틀렸습니다. 처음부터 다시 시작합니다!'}
            </p>
            <button onClick={resetCurrentSet} className="nb-btn px-8 py-2.5 bg-cl-red text-white text-sm">
              다시 시작 (-5점)
            </button>
          </div>
        </div>
      )}

      {/* Error Flash */}
      {showError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 nb-badge bg-cl-red text-white border-cl-red px-4 py-2 text-sm animate-shake">
          &#10060; 틀렸습니다! ({mistakes}/3)
        </div>
      )}

      {/* Images - Side by Side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Left (원본) */}
        <div className="nb-card p-1.5">
          <div className="text-[10px] text-cl-text/40 text-center mb-1 font-[family-name:var(--font-mono)] font-bold">&#127912; 이상 (원본)</div>
          <img src={setData.left} alt="원본" className="w-full rounded-lg border border-cl-border/30" />
        </div>

        {/* Right (틀린 부분 - 클릭 가능) */}
        <div className="nb-card p-1.5">
          <div className="text-[10px] text-cl-text/40 text-center mb-1 font-[family-name:var(--font-mono)] font-bold">&#128161; 현실 (차이점 찾기)</div>
          <div className="relative">
            <img
              ref={imgRef}
              src={setData.right}
              alt="틀린 그림"
              className="w-full rounded-lg border border-cl-border/30 cursor-crosshair"
              onClick={handleImageClick}
              draggable={false}
            />
            {/* Found markers */}
            {setData.answers.map((ans, i) => (
              foundAnswers[currentSet][i] && (
                <div
                  key={i}
                  className="absolute border-3 border-cl-green rounded-full animate-bounce-in"
                  style={{
                    left: `${ans.x - ans.r}%`,
                    top: `${ans.y - ans.r}%`,
                    width: `${ans.r * 2}%`,
                    height: `${ans.r * 2}%`,
                    boxShadow: '0 0 8px rgba(74,222,128,0.6)',
                  }}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-cl-green text-xs font-black">&#10003;</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Set Complete Message */}
      {currentSetComplete && currentSet < R4_GAME_DATA.length - 1 && (
        <div className="mt-3 nb-card p-3 text-center bg-cl-green/10 border-cl-green animate-bounce-in">
          <span className="text-sm font-bold text-cl-green">&#10003; SET {currentSet + 1} 완료! 다음 세트로 이동합니다...</span>
        </div>
      )}

      {/* Instructions */}
      <p className="text-[10px] text-cl-text/30 text-center mt-2 font-[family-name:var(--font-mono)]">
        오른쪽(현실) 이미지에서 차이점을 클릭하세요
      </p>
    </div>
  );
}
