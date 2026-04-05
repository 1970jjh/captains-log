'use client';

import React, { useState } from 'react';
import { R8_STORY, R8_CORRECT_ANSWER, R8_MISSION_IMAGE, MISSIONS } from '../../constants';
import ImagePopup from '../ImagePopup';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

export default function R8TalentGame({ onComplete, onBack, startTime }: Props) {
  const [answer, setAnswer] = useState('');
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState('');
  const [showImage, setShowImage] = useState(true);
  const [popupImage, setPopupImage] = useState(false);
  const mission = MISSIONS[7];

  const handleSubmit = () => {
    const normalized = answer.replace(/\s/g, '').toUpperCase().trim();
    if (normalized === R8_CORRECT_ANSWER) {
      setCleared(true);
      setError('');
    } else {
      setError('ACCESS DENIED - 정답이 아닙니다.');
    }
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
          <p className="text-cl-text/70 text-sm mb-4 leading-relaxed">{R8_STORY}</p>

          <button
            onClick={() => setShowImage(!showImage)}
            className="w-full mb-4 py-2 border border-cl-purple/30 rounded-xl text-cl-purple hover:bg-cl-purple/10 transition-all text-sm font-[family-name:var(--font-mono)]"
          >
            {showImage ? '지령 이미지 닫기' : '지령 이미지 보기'}
          </button>

          {showImage && (
            <div className="mb-4">
              <button onClick={() => setPopupImage(true)} className="w-full">
                <img src={R8_MISSION_IMAGE} alt="역량 단서" className="w-full rounded-xl border border-cl-navy/20 cursor-pointer hover:opacity-90" />
              </button>
              <p className="text-[10px] text-cl-text/30 text-center mt-1">이미지를 터치하면 크게 볼 수 있습니다</p>
            </div>
          )}
          {popupImage && (
            <ImagePopup src={R8_MISSION_IMAGE} alt="역량 단서" onClose={() => setPopupImage(false)} />
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={answer}
              onChange={e => { setAnswer(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="숨겨진 역량 키워드를 영어로 입력"
              className="flex-1 nb-input px-4 py-3 text-cl-text font-[family-name:var(--font-mono)] uppercase tracking-widest"
            />
            <button onClick={handleSubmit} className="px-6 py-3 nb-btn bg-cl-navy text-white">
              IDENTIFY
            </button>
          </div>
          {error && <p className="text-cl-red text-sm mt-2 font-[family-name:var(--font-mono)]">{error}</p>}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl font-black text-cl-green mb-4 font-[family-name:var(--font-space)]">ACCESS GRANTED</div>
          <p className="text-cl-text/60 mb-6">MISSION CLEAR - {mission.score}점 획득!</p>
          <button onClick={handleClear} className="px-8 py-3 nb-btn bg-cl-navy text-white">
            NEXT MISSION →
          </button>
        </div>
      )}
    </div>
  );
}
