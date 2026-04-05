'use client';

import React from 'react';
import { GameEvent } from '../types';
import { EVENTS } from '../constants';

interface Props {
  event: GameEvent;
}

export default function EventOverlay({ event }: Props) {
  const config = EVENTS.find(e => e.type === event.eventType);
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4">
      <div className="nb-card p-8 max-w-md w-full text-center bg-cl-gold/10 border-cl-gold animate-bounce-in">
        <div className="text-5xl mb-4">&#9889;</div>
        <h2 className="text-2xl font-black text-cl-navy font-[family-name:var(--font-space)] mb-3">
          {config.label}
        </h2>
        {config.instruction && (
          <p className="text-sm text-cl-text/70 leading-relaxed mb-4">{config.instruction}</p>
        )}
        <div className="nb-badge bg-cl-gold text-cl-text animate-pulse text-sm">
          EVENT IN PROGRESS
        </div>
      </div>
    </div>
  );
}
