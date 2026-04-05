'use client';

import React, { useState, useRef } from 'react';
import { R5_STORY, R5_SAMPLE_IMAGE, MISSIONS } from '../../constants';
import { geminiService } from '../../lib/geminiService';
import ImagePopup from '../ImagePopup';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

export default function R5TeamBuildGame({ onComplete, onBack, startTime }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; message: string } | null>(null);
  const [cleared, setCleared] = useState(false);
  const [popupImage, setPopupImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mission = MISSIONS[4];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!imagePreview) return;
    setVerifying(true);
    setResult(null);

    const base64 = imagePreview.split(',')[1];
    const mimeType = imagePreview.split(';')[0].split(':')[1];
    const res = await geminiService.verifyPlantInPhoto(base64, mimeType);
    setResult(res);
    if (res.pass) setCleared(true);
    setVerifying(false);
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
          <p className="text-cl-text/70 text-sm mb-4 leading-relaxed">{R5_STORY}</p>

          <div className="mb-4">
            <button onClick={() => setPopupImage(true)} className="w-full">
              <img src={R5_SAMPLE_IMAGE} alt="예시 사진" className="w-full rounded-xl border border-cl-navy/20 opacity-60 cursor-pointer hover:opacity-80" />
            </button>
            <p className="text-xs text-cl-text/40 text-center mt-1">예시 이미지 (터치하면 크게 보기)</p>
          </div>
          {popupImage && (
            <ImagePopup src={R5_SAMPLE_IMAGE} alt="예시 사진" onClose={() => setPopupImage(false)} />
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

          {imagePreview ? (
            <div className="mb-4">
              <img src={imagePreview} alt="촬영한 사진" className="w-full rounded-xl border border-cl-navy/30" />
            </div>
          ) : null}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-3 bg-cl-purple/20 border border-cl-purple/30 rounded-xl text-cl-purple hover:bg-cl-purple/30 transition-all font-[family-name:var(--font-mono)] text-sm"
            >
              사진 찍기
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 border border-cl-navy/30 rounded-xl text-cl-navy hover:bg-cl-navy/10 transition-all font-[family-name:var(--font-mono)] text-sm"
            >
              사진 업로드
            </button>
            {imagePreview && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1 py-3 nb-btn bg-cl-navy text-white disabled:opacity-50"
              >
                {verifying ? 'AI VERIFYING...' : 'VERIFY'}
              </button>
            )}
          </div>

          {result && (
            <div className={`p-4 rounded-xl border ${result.pass ? 'border-cl-green/30 bg-cl-green/10 text-cl-green' : 'border-cl-red/30 bg-cl-red/10 text-cl-red'}`}>
              <p className="font-bold font-[family-name:var(--font-mono)]">{result.pass ? 'VERIFIED' : 'REJECTED'}</p>
              <p className="text-sm mt-1">{result.message}</p>
            </div>
          )}
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
