'use client';

import React, { useState } from 'react';
import { R10_STORY, R10_MISSION_IMAGE, R10_CLEAR_MESSAGE, MISSIONS } from '../../constants';
import { TeamMember } from '../../types';
import { geminiService } from '../../lib/geminiService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
  teamMembers: TeamMember[];
}

type Phase = 'intro' | 'mission' | 'clear';

const SCORE_TABLE = [
  { maxSec: 30, score: 100, label: 'PERFECT', stars: 5 },
  { maxSec: 40, score: 85, label: 'EXCELLENT', stars: 4 },
  { maxSec: 50, score: 70, label: 'GREAT', stars: 3 },
  { maxSec: 60, score: 55, label: 'GOOD', stars: 2 },
  { maxSec: 9999, score: 40, label: 'KEEP GOING', stars: 1 },
];

function getScoreTier(seconds: number) {
  for (const tier of SCORE_TABLE) {
    if (seconds <= tier.maxSec) return tier;
  }
  return SCORE_TABLE[SCORE_TABLE.length - 1];
}

export default function R10ReorgGame({ onComplete, onBack, startTime, teamMembers }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [timeInput, setTimeInput] = useState('');
  const [confirmedTime, setConfirmedTime] = useState(0);
  const [error, setError] = useState('');
  const mission = MISSIONS[9];

  const handleSubmit = () => {
    const seconds = parseInt(timeInput);
    if (isNaN(seconds) || seconds < 1) {
      setError('올바른 초 단위 숫자를 입력하세요.');
      return;
    }
    setConfirmedTime(seconds);
    geminiService.speakTTS('Mission Clear!');
    setPhase('clear');
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const tier = getScoreTier(confirmedTime);
    onComplete(tier.score, elapsed);
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
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R10_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R10_MISSION_IMAGE} alt="10월 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        {/* Rules */}
        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-4">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#127919; 미션 규칙</h3>
          <ul className="text-xs text-cl-text/70 space-y-1 leading-relaxed">
            <li>&bull; 팀원 전원이 <strong>릴레이</strong>로 칠교 퍼즐 완성</li>
            <li>&bull; 제한 시간: <strong>1분 (60초)</strong></li>
            <li>&bull; 완성 후 강사가 알려주는 <strong>초 단위 시간</strong>을 입력</li>
            <li>&bull; 빠를수록 높은 점수!</li>
          </ul>
        </div>

        {/* Score Table */}
        <div className="nb-card p-4 mb-4">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#128202; 점수 배점</h3>
          <div className="space-y-1.5">
            {SCORE_TABLE.map((tier, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-cl-text/60">
                  {tier.maxSec <= 60 ? `${i === 0 ? '1' : SCORE_TABLE[i-1].maxSec + 1}~${tier.maxSec}초` : '60초 초과'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-cl-gold">{'⭐'.repeat(tier.stars)}</span>
                  <span className="font-bold text-cl-navy font-[family-name:var(--font-mono)]">{tier.score}점</span>
                  <span className="nb-badge text-[9px] bg-cl-green/20 text-cl-green border-cl-green">{tier.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="nb-card p-4 mb-5">
            <h3 className="text-sm font-black text-cl-navy mb-2">&#128101; 참여 팀원</h3>
            <div className="flex flex-wrap gap-1.5">
              {teamMembers.map((m, i) => (
                <span key={i} className="nb-badge text-[10px] bg-cl-navy/10 text-cl-navy border-cl-navy/30">{m.name} ({m.role})</span>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setPhase('mission')} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#129513; 칠교 퍼즐 도전!
        </button>
      </div>
    );
  }

  // ============ CLEAR ============
  if (phase === 'clear') {
    const tier = getScoreTier(confirmedTime);

    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">&#127942;</div>
          <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
          <p className="text-sm text-cl-text/50">너와 나에서 우리로!</p>
        </div>

        {/* Score */}
        <div className="nb-card p-4 mb-4 text-center">
          <div className="text-cl-text/40 text-xs mb-1">완성 시간</div>
          <span className="text-3xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{confirmedTime}</span>
          <span className="text-cl-text/40 text-lg">초</span>
          <div className="mt-2">
            <span className="nb-badge bg-cl-gold text-cl-text border-cl-gold text-xs">{'⭐'.repeat(tier.stars)} {tier.label}</span>
          </div>
          <div className="mt-2 text-sm text-cl-text/50">
            미션 점수: <strong className="text-cl-navy text-lg">{tier.score}</strong>/{mission.score}점
          </div>
        </div>

        {/* Insight */}
        <div className="nb-card p-4 bg-cl-navy/5 mb-5">
          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R10_CLEAR_MESSAGE}</p>
        </div>

        <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          NEXT MISSION &rarr;
        </button>
      </div>
    );
  }

  // ============ MISSION ============
  return (
    <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setPhase('intro')} className="text-cl-text/40 hover:text-cl-text text-sm">&larr; 안내로 돌아가기</button>
        <span className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">배점: {mission.score}점</span>
      </div>

      <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-4">&#129513; 칠교 퍼즐 진행 중</h2>

      {/* Status */}
      <div className="nb-card p-6 mb-5 bg-cl-gold/5 border-cl-gold/30 text-center">
        <div className="text-5xl mb-3">&#129513;</div>
        <p className="text-sm text-cl-text/70 mb-2">팀원 전원이 릴레이로 칠교 퍼즐을 완성하세요!</p>
        <p className="text-xs text-cl-text/40">완성 후 강사가 알려주는 <strong>초 단위 시간</strong>을 아래에 입력하세요</p>
      </div>

      {/* Time Input */}
      <div className="nb-card p-5 mb-4">
        <h3 className="text-sm font-bold text-cl-navy mb-3">&#9201; 강사가 알려준 완성 시간 입력</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={timeInput}
            onChange={e => { setTimeInput(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && timeInput.trim() && handleSubmit()}
            placeholder="예: 35"
            min={1}
            max={120}
            className="nb-input flex-1 py-3 text-center text-2xl font-black text-cl-navy font-[family-name:var(--font-mono)]"
          />
          <span className="text-lg font-bold text-cl-text/40">초</span>
          <button onClick={handleSubmit} disabled={!timeInput.trim()} className="nb-btn px-6 py-3 bg-cl-navy text-white text-sm disabled:opacity-40">
            확인
          </button>
        </div>
        {error && <p className="text-cl-red text-xs mt-2 font-bold">{error}</p>}
      </div>

      {/* Score Preview */}
      {timeInput && parseInt(timeInput) > 0 && (
        <div className="nb-card p-3 text-center bg-cl-bg">
          <span className="text-xs text-cl-text/40">예상 점수: </span>
          <span className="font-bold text-cl-navy font-[family-name:var(--font-mono)]">{getScoreTier(parseInt(timeInput)).score}점</span>
          <span className="text-xs text-cl-text/40 ml-1">({getScoreTier(parseInt(timeInput)).label})</span>
        </div>
      )}
    </div>
  );
}
