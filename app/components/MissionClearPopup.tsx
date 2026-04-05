'use client';

import React from 'react';
import { MISSIONS } from '../constants';

interface Props {
  missionId: number;
  score: number;
  timeBonus: number;
  totalScore: number;
  onNext: () => void;
}

export default function MissionClearPopup({ missionId, score, timeBonus, totalScore, onNext }: Props) {
  const mission = MISSIONS[missionId - 1];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="nb-card p-8 max-w-sm w-full text-center animate-bounce-in bg-cl-green/10 border-cl-green">
        <div className="text-5xl mb-3">&#127942;</div>
        <h2 className="text-2xl font-black text-cl-navy font-[family-name:var(--font-space)] mb-2">
          MISSION CLEAR!
        </h2>
        <p className="text-sm text-cl-text/60 mb-4">
          {mission.month} &middot; {mission.title}
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center nb-card p-3">
            <span className="text-sm text-cl-text/60 font-bold">SCORE</span>
            <span className="text-xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{score}</span>
          </div>
          {timeBonus > 0 && (
            <div className="flex justify-between items-center nb-card p-3 bg-cl-gold/10 border-cl-gold">
              <span className="text-sm text-cl-gold font-bold">TIME BONUS</span>
              <span className="text-xl font-black text-cl-gold font-[family-name:var(--font-mono)]">+{timeBonus}</span>
            </div>
          )}
          <div className="flex justify-between items-center nb-card p-3 bg-cl-navy/10 border-cl-navy">
            <span className="text-sm text-cl-navy font-bold">TOTAL</span>
            <span className="text-xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{totalScore}</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="nb-btn w-full py-3 bg-cl-navy text-white text-sm"
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
