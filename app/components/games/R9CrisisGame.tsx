'use client';

import React, { useState } from 'react';
import { R9_STORY, R9_MISSION_IMAGE, R9_CORRECT_ANSWER, R9_CLEAR_MESSAGE, MISSIONS } from '../../constants';
import { geminiService } from '../../lib/geminiService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

type Phase = 'intro' | 'mission' | 'clear';

export default function R9CrisisGame({ onComplete, onBack, startTime }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const mission = MISSIONS[8];

  const handleSubmit = () => {
    const normalized = answer.trim().replace(/\s/g, '');
    setAttempts(prev => prev + 1);

    if (normalized === R9_CORRECT_ANSWER) {
      geminiService.speakTTS('Mission Clear!');
      setPhase('clear');
      setError('');
    } else {
      setError('키워드가 일치하지 않습니다. 고객(강사)을 설득하여 정확한 4글자를 받아오세요!');
    }
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onComplete(mission.score, elapsed); // 정답 입력 = 무조건 만점
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
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R9_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R9_MISSION_IMAGE} alt="9월 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        {/* Mission Rules */}
        <div className="nb-card p-4 bg-cl-red/10 border-cl-red mb-4">
          <h3 className="text-sm font-black text-cl-red mb-2">&#128680; 긴급 미션</h3>
          <ul className="text-xs text-cl-text/70 space-y-1.5 leading-relaxed">
            <li>&bull; 고객(강사)에게 <strong>직접 전화</strong>를 걸어 클레임에 대응하세요</li>
            <li>&bull; 진심 어린 공감과 구체적 해결책으로 고객을 설득하세요</li>
            <li>&bull; 목표: 고객으로부터 <strong>&ldquo;네네, 그럼 2주 안에는 처리해주세요&rdquo;</strong> 라는 응답을 이끌어내기</li>
            <li>&bull; 고객이 설득에 응하면 알려주는 <strong>4글자 키워드</strong>를 입력하면 클리어!</li>
          </ul>
        </div>

        {/* 설득 가이드 */}
        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-5">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#128222; 고객 설득 가이드</h3>
          <div className="space-y-2 text-xs text-cl-text/70">
            <div className="flex gap-2"><span className="text-cl-navy font-bold shrink-0">1. 공감</span><span>&ldquo;정말 큰 피해를 입으셨군요&rdquo; &mdash; 고객의 감정을 먼저 인정</span></div>
            <div className="flex gap-2"><span className="text-cl-navy font-bold shrink-0">2. 사과</span><span>&ldquo;저희의 부족함으로...&rdquo; &mdash; 진심 어린 사과</span></div>
            <div className="flex gap-2"><span className="text-cl-navy font-bold shrink-0">3. 원인</span><span>&ldquo;확인 결과 OO 부분에서...&rdquo; &mdash; 투명한 원인 공유</span></div>
            <div className="flex gap-2"><span className="text-cl-navy font-bold shrink-0">4. 해결책</span><span>&ldquo;2주 내에 이렇게 조치하겠습니다&rdquo; &mdash; 구체적 일정+방법</span></div>
            <div className="flex gap-2"><span className="text-cl-navy font-bold shrink-0">5. 방지</span><span>&ldquo;이런 일이 다시는...&rdquo; &mdash; 재발 방지 약속</span></div>
          </div>
        </div>

        <div className="nb-card p-3 mb-5 bg-cl-navy/5 text-center">
          <p className="text-xs text-cl-text/50">
            &#9888; 4글자 키워드는 <strong>고객(강사)만</strong> 알고 있습니다.<br />
            고객을 설득하지 못하면 키워드를 받을 수 없고, 미션을 클리어할 수 없습니다!
          </p>
        </div>

        <button onClick={() => setPhase('mission')} className="nb-btn w-full py-3 bg-cl-red text-white text-sm">
          &#128222; 고객에게 전화 걸기!
        </button>
      </div>
    );
  }

  // ============ CLEAR ============
  if (phase === 'clear') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">&#127942;</div>
          <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
          <p className="text-sm text-cl-text/50">고객 클레임 대응 성공!</p>
        </div>

        {/* Score */}
        <div className="nb-card p-4 mb-4 text-center">
          <span className="text-4xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{mission.score}</span>
          <span className="text-cl-text/40 text-lg">/{mission.score}점 (만점)</span>
          <div className="nb-badge bg-cl-gold text-cl-text border-cl-gold mt-2 text-xs">&#127775; 고객의 신뢰를 되찾았습니다!</div>
        </div>

        {/* Insight */}
        <div className="nb-card p-4 bg-cl-navy/5 mb-5">
          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R9_CLEAR_MESSAGE}</p>
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

      <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-4">&#128222; 고객 클레임 대응 진행 중</h2>

      {/* Status */}
      <div className="nb-card p-5 mb-5 bg-cl-red/5 border-cl-red/30">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">&#128241;</div>
          <p className="text-sm text-cl-text/70">고객(강사)에게 <strong>직접 전화</strong>를 걸어 설득하세요!</p>
          <p className="text-xs text-cl-text/40 mt-1">공감 &rarr; 사과 &rarr; 원인 &rarr; 해결책 &rarr; 재발 방지</p>
        </div>

        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold text-center mb-4">
          <p className="text-sm text-cl-text/70 font-bold mb-1">&#127919; 목표</p>
          <p className="text-base text-cl-navy font-black">&ldquo;네네, 그럼 2주 안에는 처리해주세요&rdquo;</p>
          <p className="text-[10px] text-cl-text/40 mt-1">이 응답을 이끌어내면, 고객이 <strong>4글자 키워드</strong>를 알려줍니다</p>
        </div>
      </div>

      {/* Answer Input */}
      <div className="nb-card p-5 mb-4">
        <h3 className="text-sm font-bold text-cl-navy mb-3">&#128273; 고객(강사)이 알려준 키워드 입력</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={e => { setAnswer(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && answer.trim() && handleSubmit()}
            placeholder="4글자를 입력하세요"
            maxLength={10}
            className="nb-input flex-1 py-3 text-center text-lg font-black text-cl-navy tracking-widest"
          />
          <button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="nb-btn px-6 py-3 bg-cl-navy text-white text-sm disabled:opacity-40"
          >
            확인
          </button>
        </div>
        {error && (
          <p className="text-cl-red text-xs mt-2 font-bold animate-shake">{error}</p>
        )}
        {attempts > 0 && !error && (
          <p className="text-cl-text/30 text-[10px] mt-2 font-[family-name:var(--font-mono)] text-center">시도: {attempts}회</p>
        )}
      </div>

      {/* Hint */}
      <div className="text-center">
        <p className="text-[10px] text-cl-text/30">
          &#128161; 힌트: 아직 고객을 설득하지 못했다면, 다시 전화를 걸어보세요!<br />
          진심 어린 공감과 구체적 해결책이 핵심입니다.
        </p>
      </div>
    </div>
  );
}
