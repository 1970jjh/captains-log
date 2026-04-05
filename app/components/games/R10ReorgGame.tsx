'use client';

import React, { useState } from 'react';
import { R10_STORY, R10_MISSION_IMAGE, MISSIONS } from '../../constants';
import { TeamMember } from '../../types';
import ImagePopup from '../ImagePopup';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
  teamMembers: TeamMember[];
}

export default function R10ReorgGame({ onComplete, onBack, startTime, teamMembers }: Props) {
  const [timeInput, setTimeInput] = useState('');
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState('');
  const [showImage, setShowImage] = useState(true);
  const [popupImage, setPopupImage] = useState(false);
  const mission = MISSIONS[9];

  const handleSubmit = () => {
    const seconds = parseInt(timeInput, 10);
    if (isNaN(seconds) || seconds <= 0) {
      setError('올바른 시간(초)을 입력해주세요.');
      return;
    }
    if (seconds > 3600) {
      setError('시간이 너무 큽니다. 관리자에게 확인해주세요.');
      return;
    }
    setCleared(true);
    setError('');
  };

  const handleClear = () => {
    const seconds = parseInt(timeInput, 10);
    onComplete(mission.score, seconds);
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
          <p className="text-cl-text/70 text-sm mb-4 leading-relaxed">{R10_STORY}</p>

          <button
            onClick={() => setShowImage(!showImage)}
            className="w-full mb-4 py-2 border border-cl-purple/30 rounded-xl text-cl-purple hover:bg-cl-purple/10 transition-all text-sm font-[family-name:var(--font-mono)]"
          >
            {showImage ? '지령 이미지 닫기' : '지령 이미지 보기'}
          </button>

          {showImage && (
            <div className="mb-4">
              <button onClick={() => setPopupImage(true)} className="w-full">
                <img src={R10_MISSION_IMAGE} alt="조직 재편 미션" className="w-full rounded-xl border border-cl-navy/20 cursor-pointer hover:opacity-90" />
              </button>
              <p className="text-[10px] text-cl-text/30 text-center mt-1">이미지를 터치하면 크게 볼 수 있습니다</p>
            </div>
          )}
          {popupImage && (
            <ImagePopup src={R10_MISSION_IMAGE} alt="조직 재편 미션" onClose={() => setPopupImage(false)} />
          )}

          {/* Team members display */}
          {teamMembers.length > 0 && (
            <div className="mb-4 p-3 border border-cl-navy/10 rounded-xl">
              <div className="text-xs text-cl-navy/60 font-[family-name:var(--font-mono)] mb-2">참여 팀원</div>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((m, i) => (
                  <span key={i} className="text-xs bg-cl-navy/10 text-cl-navy px-2 py-1 rounded-lg font-[family-name:var(--font-mono)]">
                    {m.name} ({m.role})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 p-4 border border-cl-gold/20 rounded-xl bg-cl-gold/5">
            <p className="text-cl-gold text-sm font-bold mb-1 font-[family-name:var(--font-mono)]">
              미션 완료 방법
            </p>
            <p className="text-cl-text/60 text-sm">
              오프라인 칠교 퍼즐을 완성한 후, 관리자가 알려준 소요 시간(초)을 아래에 입력하세요.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={timeInput}
              onChange={e => { setTimeInput(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="소요 시간(초) 입력"
              className="flex-1 nb-input px-4 py-3 text-cl-text font-[family-name:var(--font-mono)] tracking-widest"
              min="1"
              max="3600"
            />
            <button onClick={handleSubmit} className="px-6 py-3 nb-btn bg-cl-navy text-white">
              SUBMIT
            </button>
          </div>
          {error && <p className="text-cl-red text-sm mt-2 font-[family-name:var(--font-mono)]">{error}</p>}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl font-black text-cl-green mb-4 font-[family-name:var(--font-space)]">ACCESS GRANTED</div>
          <p className="text-cl-text/60 mb-2">소요 시간: {timeInput}초</p>
          <p className="text-cl-text/60 mb-6">MISSION CLEAR - {mission.score}점 획득!</p>
          <button onClick={handleClear} className="px-8 py-3 nb-btn bg-cl-navy text-white">
            NEXT MISSION →
          </button>
        </div>
      )}
    </div>
  );
}
