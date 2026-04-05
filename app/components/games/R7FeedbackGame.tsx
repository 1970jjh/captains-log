'use client';

import React, { useState } from 'react';
import { R7_STORY, R7_VIDEO_URL, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

export default function R7FeedbackGame({ onComplete, onBack, startTime }: Props) {
  const [answer, setAnswer] = useState('');
  const [cleared, setCleared] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const mission = MISSIONS[6];

  const handleSubmit = () => {
    if (answer.trim().length < 10) return;
    setSubmitted(true);
    setCleared(true);
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onComplete(mission.score, elapsed);
  };

  return (
    <div className="nb-card rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">← BACK</button>
        <div className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">
          배점: {mission.score}점 | 시간 보너스: {mission.timeLimit}분 이내 +{mission.timeBonus}점
        </div>
      </div>

      <h2 className="text-xl font-bold text-cl-navy font-[family-name:var(--font-space)] mb-2">
        {mission.month}: {mission.title}
      </h2>

      {!cleared ? (
        <>
          <p className="text-cl-text/70 text-sm mb-4 leading-relaxed">{R7_STORY}</p>

          <div className="mb-4 rounded-xl overflow-hidden border border-cl-navy/20">
            <video controls className="w-full">
              <source src={R7_VIDEO_URL} type="video/mp4" />
            </video>
          </div>

          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="팀원이 진짜 원하는 것은? (When/What 형식으로 작성)"
            rows={4}
            className="w-full nb-input px-4 py-3 text-cl-text resize-none mb-4"
          />

          <button
            onClick={handleSubmit}
            disabled={answer.trim().length < 10}
            className="w-full py-3 nb-btn bg-cl-navy text-white disabled:opacity-50"
          >
            ANALYZE & SUBMIT
          </button>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl font-black text-cl-green mb-4 font-[family-name:var(--font-space)]">ACCESS GRANTED</div>
          {submitted && (
            <div className="bg-white rounded-xl p-4 mb-4 text-left text-sm text-cl-text/70">
              <p className="text-cl-navy text-xs font-[family-name:var(--font-mono)] mb-2">YOUR ANALYSIS:</p>
              <p>{answer}</p>
            </div>
          )}
          <p className="text-cl-text/60 mb-6">MISSION CLEAR - {mission.score}점 획득!</p>
          <button onClick={handleClear} className="px-8 py-3 nb-btn bg-cl-navy text-white">
            NEXT MISSION →
          </button>
        </div>
      )}
    </div>
  );
}
