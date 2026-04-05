'use client';

import React, { useState } from 'react';
import { R1_STORY, R1_PROFILES, R1_CORRECT_ANSWER, MISSIONS } from '../../constants';
import ImagePopup from '../ImagePopup';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

export default function R1VisionGame({ onComplete, onBack, startTime }: Props) {
  const [answer, setAnswer] = useState('');
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [popupImage, setPopupImage] = useState<{ src: string; alt: string } | null>(null);
  const mission = MISSIONS[0];

  const handleSubmit = () => {
    const normalized = answer.replace(/\s/g, '').trim();
    if (normalized === R1_CORRECT_ANSWER) {
      setCleared(true);
      setError('');
    } else {
      setError('ACCESS DENIED - 다시 시도하세요.');
    }
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onComplete(mission.score, elapsed);
  };

  return (
    <div className="nb-card rounded-2xl p-6 max-w-2xl mx-auto">
      {/* Header */}
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
          <p className="text-cl-text/70 text-sm mb-6 leading-relaxed whitespace-pre-line">{R1_STORY}</p>

          {/* Profiles */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {R1_PROFILES.map(p => (
              <div key={p.id} className="flex flex-col">
                <button
                  onClick={() => setPopupImage({ src: p.image, alt: p.name })}
                  className={`rounded-xl overflow-hidden border-2 transition-all ${
                    selectedProfile === p.id ? 'border-cl-navy' : 'border-cl-border/10 hover:border-cl-navy/30'
                  }`}
                >
                  <img src={p.image} alt={p.name} className="w-full aspect-[3/4] object-cover" />
                </button>
                <button
                  onClick={() => setSelectedProfile(p.id)}
                  className={`mt-1 p-2 rounded-lg text-center text-xs transition-all ${
                    selectedProfile === p.id ? 'bg-cl-navy/20 text-cl-navy' : 'bg-white text-cl-text/60 hover:text-cl-text'
                  }`}
                >
                  {p.name} 선택
                </button>
              </div>
            ))}
          </div>
          {popupImage && (
            <ImagePopup src={popupImage.src} alt={popupImage.alt} onClose={() => setPopupImage(null)} />
          )}

          {/* Answer */}
          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={e => { setAnswer(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="리더십 키워드를 입력하세요"
              className="flex-1 nb-input px-4 py-3 text-cl-text"
            />
            <button onClick={handleSubmit} className="px-6 py-3 nb-btn bg-cl-navy text-white">
              SUBMIT
            </button>
          </div>
          {error && <p className="text-cl-red text-sm mt-2 font-[family-name:var(--font-mono)]">{error}</p>}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl font-black text-cl-green mb-4 font-[family-name:var(--font-space)]">
            ACCESS GRANTED
          </div>
          <p className="text-cl-text/60 mb-6">MISSION CLEAR - {mission.score}점 획득!</p>
          <button onClick={handleClear} className="px-8 py-3 nb-btn bg-cl-navy text-white">
            NEXT MISSION →
          </button>
        </div>
      )}
    </div>
  );
}
