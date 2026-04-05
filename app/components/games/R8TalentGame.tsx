'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { R8_STORY, R8_MISSION_IMAGE, R8_BELBIN_ROLES, R8_EVIDENCE_CARDS, R8_CLEAR_MESSAGE, R8_RESULT_TABLE, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

type Phase = 'intro' | 'playing' | 'result';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function R8TalentGame({ onComplete, onBack, startTime }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [cards, setCards] = useState(R8_EVIDENCE_CARDS);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({}); // roleId → cardId
  const [errorSlot, setErrorSlot] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState<Record<string, number>>({}); // cardId → consecutive error count
  const mission = MISSIONS[7];

  const resetGame = useCallback(() => {
    setCards(shuffleArray(R8_EVIDENCE_CARDS));
    setFlipped({});
    setSelectedCard(null);
    setPlaced({});
    setErrorSlot(null);
    setConsecutiveErrors({});
  }, []);

  useEffect(() => {
    if (phase === 'playing') resetGame();
  }, [phase, resetGame]);

  // Check completion
  const matchedCount = Object.keys(placed).length;
  useEffect(() => {
    if (matchedCount === R8_EVIDENCE_CARDS.length && phase === 'playing') {
      setTimeout(() => setPhase('result'), 600);
    }
  }, [matchedCount, phase]);

  const handleCardClick = (cardId: string) => {
    if (Object.values(placed).includes(cardId)) return;

    if (!flipped[cardId]) {
      setFlipped(prev => ({ ...prev, [cardId]: true }));
      setSelectedCard(cardId);
    } else {
      setSelectedCard(selectedCard === cardId ? null : cardId);
    }
  };

  const handleSlotClick = (roleId: string) => {
    if (!selectedCard || placed[roleId]) return;

    const card = cards.find(c => c.id === selectedCard);
    if (!card) return;

    if (card.targetRole === roleId) {
      // Correct!
      setPlaced(prev => ({ ...prev, [roleId]: selectedCard }));
      setSelectedCard(null);
      setConsecutiveErrors(prev => ({ ...prev, [card.id]: 0 }));
    } else {
      // Wrong!
      setMistakes(prev => prev + 1);
      setErrorSlot(roleId);
      const newConsec = (consecutiveErrors[card.id] || 0) + 1;
      setConsecutiveErrors(prev => ({ ...prev, [card.id]: newConsec }));

      setTimeout(() => {
        setErrorSlot(null);
        if (newConsec >= 3) {
          // Force reset this card
          setFlipped(prev => ({ ...prev, [card.id]: false }));
          setSelectedCard(null);
          setConsecutiveErrors(prev => ({ ...prev, [card.id]: 0 }));
          setMistakes(prev => prev + 1); // extra penalty
        }
      }, 800);
      setSelectedCard(null);
    }
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const penalty = mistakes * 5;
    const finalScore = Math.max(Math.round(mission.score * 0.3), mission.score - penalty);
    onComplete(finalScore, elapsed);
  };

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr; BACK</button>
          <span className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">배점: {mission.score}점</span>
        </div>
        <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-2">{mission.month}: {mission.title}</h2>
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R8_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R8_MISSION_IMAGE} alt="8월 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-5">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#127919; 미션 규칙</h3>
          <ul className="text-xs text-cl-text/70 space-y-1 leading-relaxed">
            <li>&bull; 5장의 <strong>증거 카드</strong>를 클릭하여 뒤집기</li>
            <li>&bull; 뒤집힌 카드를 <strong>선택</strong> &rarr; <strong>벨빈 9가지 역할 슬롯</strong> 중 정답에 배치</li>
            <li>&bull; 9개 슬롯 중 <strong>4개는 함정</strong> (정답은 5개)</li>
            <li>&bull; 오답 1회당 <strong>-5점</strong> / 같은 카드 3회 연속 오답 시 <strong>카드 리셋 + 추가 -5점</strong></li>
            <li>&bull; 5명 모두 정답 슬롯에 배치하면 <strong>클리어!</strong></li>
          </ul>
        </div>

        <button onClick={() => setPhase('playing')} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#128269; 수사 보드 열기!
        </button>
      </div>
    );
  }

  // ============ RESULT ============
  if (phase === 'result') {
    const penalty = mistakes * 5;
    const finalScore = Math.max(Math.round(mission.score * 0.3), mission.score - penalty);

    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">&#127942;</div>
          <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
          <p className="text-sm text-cl-text/50">모든 잠재력 각성 완료!</p>
        </div>

        {/* Score */}
        <div className="nb-card p-4 mb-4 text-center">
          <div className="flex justify-center items-baseline gap-2">
            <span className="text-4xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{finalScore}</span>
            <span className="text-cl-text/40 text-lg">/{mission.score}점</span>
          </div>
          <div className="text-xs text-cl-text/40 mt-1">오답 {mistakes}회 (감점 -{penalty}점)</div>
          {mistakes === 0 && (
            <div className="nb-badge bg-cl-gold text-cl-text border-cl-gold mt-2 text-xs">&#127775; PERFECT! 한 번도 틀리지 않았습니다!</div>
          )}
        </div>

        {/* Result Table */}
        <div className="nb-card p-4 mb-4">
          <h3 className="text-sm font-bold text-cl-navy mb-3">&#128204; 단점 &rarr; 역량 전환표</h3>
          <div className="space-y-2">
            {R8_RESULT_TABLE.map((row, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-cl-bg border border-cl-border/20">
                <span className="font-bold text-cl-navy w-20 shrink-0">{row.member}</span>
                <span className="text-cl-red line-through w-24 shrink-0">{row.flaw}</span>
                <span className="text-cl-green font-bold">&rarr;</span>
                <span className="text-cl-green font-bold flex-1">{row.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div className="nb-card p-4 bg-cl-navy/5 mb-5">
          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R8_CLEAR_MESSAGE}</p>
        </div>

        <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          NEXT MISSION &rarr;
        </button>
      </div>
    );
  }

  // ============ PLAYING ============
  const unplacedCards = cards.filter(c => !Object.values(placed).includes(c.id));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="nb-card rounded-2xl p-3 mb-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr;</button>
          <div className="flex items-center gap-3">
            <span className="nb-badge bg-cl-green/20 text-cl-green border-cl-green text-[10px]">&#10003; {matchedCount}/5 배치</span>
            <span className="text-xs text-cl-red font-[family-name:var(--font-mono)] font-bold">&times; {mistakes}회 오답</span>
            <span className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">배점: {mission.score}점</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left: Evidence Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="nb-card p-3 bg-cl-gold/10 border-cl-gold">
            <h3 className="text-sm font-bold text-cl-navy mb-1">&#128270; 1. 증거 카드 뒤집기</h3>
            <p className="text-[10px] text-cl-text/50">카드를 클릭하여 단서를 확인 &rarr; 다시 클릭하여 선택</p>
          </div>

          {unplacedCards.map(card => {
            const isFlipped = flipped[card.id];
            const isSelected = selectedCard === card.id;

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="cursor-pointer"
                style={{ perspective: '1000px' }}
              >
                <div
                  className="relative transition-transform duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: '140px',
                  }}
                >
                  {/* Front (unflipped) */}
                  <div
                    className="absolute inset-0 nb-card p-4 flex flex-col items-center justify-center text-cl-text/40 hover:border-cl-navy/50"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-3xl mb-2">&#128196;</span>
                    <span className="font-bold text-sm">미확인 증거 자료</span>
                    <span className="text-[10px] mt-1 text-cl-text/30">클릭하여 뒤집기</span>
                  </div>

                  {/* Back (flipped) */}
                  <div
                    className={`absolute inset-0 nb-card p-4 ${isSelected ? 'border-cl-gold shadow-[4px_4px_0px_#D4A017] -translate-x-0.5 -translate-y-0.5' : 'border-cl-navy/40'}`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-cl-border/20">
                      <span className="text-lg">{card.icon}</span>
                      <span className="font-bold text-cl-navy text-sm">{card.member}</span>
                      <span className="nb-badge text-[9px] bg-cl-red/10 text-cl-red border-cl-red ml-auto">{card.flaw}</span>
                    </div>
                    <p className="text-xs text-cl-text/70 leading-relaxed italic">&ldquo;{card.clue}&rdquo;</p>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 nb-badge bg-cl-gold text-cl-text border-cl-gold text-[9px] animate-pulse">선택됨</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {unplacedCards.length === 0 && (
            <div className="nb-card p-6 text-center text-cl-text/30">
              <span className="text-2xl">&#10003;</span>
              <p className="text-sm mt-2">모든 증거 매칭 완료</p>
            </div>
          )}
        </div>

        {/* Right: Belbin Role Slots */}
        <div className="lg:col-span-7 space-y-3">
          <div className="nb-card p-3 bg-cl-navy/5 border-cl-navy">
            <h3 className="text-sm font-bold text-cl-navy mb-1">&#127919; 2. 벨빈 역할 매칭 보드</h3>
            <p className="text-[10px] text-cl-text/50">선택된 증거 카드를 알맞은 역할 슬롯에 배치하세요 (9개 중 4개는 함정!)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {R8_BELBIN_ROLES.map(role => {
              const placedCardId = placed[role.id];
              const placedCard = placedCardId ? cards.find(c => c.id === placedCardId) : null;
              const isError = errorSlot === role.id;
              const isClickable = !!selectedCard && !placedCard;

              return (
                <div
                  key={role.id}
                  onClick={() => handleSlotClick(role.id)}
                  className={`nb-card p-3 transition-all ${
                    placedCard ? 'bg-cl-green/10 border-cl-green' :
                    isError ? 'bg-cl-red/10 border-cl-red animate-shake' :
                    isClickable ? 'hover:border-cl-gold hover:bg-cl-gold/5 cursor-pointer border-dashed' :
                    'opacity-60'
                  }`}
                >
                  <h4 className={`font-bold text-xs mb-1 ${placedCard ? 'text-cl-green' : 'text-cl-text/60'}`}>
                    {role.name}
                  </h4>
                  <p className="text-[10px] text-cl-text/40 leading-snug">{role.desc}</p>

                  {placedCard && (
                    <div className="mt-2 pt-2 border-t border-cl-green/30">
                      <span className="nb-badge text-[9px] bg-cl-green/20 text-cl-green border-cl-green">
                        {placedCard.icon} {placedCard.member}
                      </span>
                    </div>
                  )}

                  {isError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-cl-red/90 rounded-xl z-10">
                      <span className="text-white font-bold text-sm">&#10060; 역할 불일치!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hint */}
      {selectedCard && (
        <p className="text-[10px] text-cl-gold text-center mt-3 font-[family-name:var(--font-mono)] animate-pulse">
          &#9757; 카드가 선택되었습니다. 오른쪽 역할 슬롯을 클릭하여 배치하세요!
        </p>
      )}
    </div>
  );
}
