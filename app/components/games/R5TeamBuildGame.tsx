'use client';

import React, { useState, useRef } from 'react';
import { R5_STORY, R5_MISSION_IMAGE, R5_CLEAR_MESSAGE, MISSIONS } from '../../constants';
import { geminiService } from '../../lib/geminiService';
import { gasService } from '../../lib/gasService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
  roomId: string;
  teamId: number;
}

type Phase = 'intro' | 'upload' | 'verifying' | 'result';

const SCORE_TABLE = [
  { min: 6, score: 100, stars: 5, label: 'PERFECT' },
  { min: 5, score: 80, stars: 4, label: 'EXCELLENT' },
  { min: 4, score: 70, stars: 3, label: 'GREAT' },
  { min: 3, score: 60, stars: 2, label: 'GOOD' },
];

export default function R5TeamBuildGame({ onComplete, onBack, startTime, roomId, teamId }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ pass: boolean; participantCount: number; message: string; score: number } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const mission = MISSIONS[4];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      const base64 = result.split(',')[1];
      setImageData({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!imageData) return;
    setPhase('verifying');
    setAttempts(prev => prev + 1);

    const result = await geminiService.verifyHeartPhoto(imageData.base64, imageData.mimeType);
    setVerifyResult(result);
    setPhase('result');
  };

  const handleRetry = () => {
    setPreview(null);
    setImageData(null);
    setVerifyResult(null);
    setPhase('upload');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const aiScore = verifyResult?.score || 60;
    const finalScore = Math.round(mission.score * (aiScore / 100));
    // Upload photo to Drive + save mission data (non-blocking)
    if (imageData && verifyResult?.pass) {
      gasService.uploadTeamFile(roomId, teamId, 'photo', imageData.base64, imageData.mimeType).catch(() => {});
      const missionData = {
        participantCount: verifyResult.participantCount,
        aiMessage: verifyResult.message,
        aiScore: verifyResult.score,
      };
      gasService.saveMissionData(roomId, teamId, 5, JSON.stringify(missionData)).catch(() => {});
    }
    onComplete(finalScore, elapsed);
  };

  const getStarInfo = (count: number) => {
    for (const tier of SCORE_TABLE) {
      if (count >= tier.min) return tier;
    }
    return null;
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
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R5_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R5_MISSION_IMAGE} alt="팀빌딩 워크숍 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        {/* Rules */}
        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-4">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#127919; 미션 규칙</h3>
          <ul className="text-xs text-cl-text/70 space-y-1 leading-relaxed">
            <li>&bull; 강의장 밖 <strong>야외</strong>에서 촬영 (실내 불가)</li>
            <li>&bull; 최소 <strong>3명 이상</strong>이 <strong>몸(팔/전신)</strong>으로 하트(&#9825;) 모양 제작</li>
            <li>&bull; 손가락 하트 &#10060; / 소품 하트 &#10060;</li>
            <li>&bull; AI가 사진을 분석하여 통과 여부와 참여 인원을 판정</li>
          </ul>
        </div>

        {/* Score Table */}
        <div className="nb-card p-4 mb-5">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#128202; 점수 배점표</h3>
          <div className="space-y-1.5">
            {SCORE_TABLE.map(tier => (
              <div key={tier.min} className="flex items-center justify-between text-xs">
                <span className="text-cl-text/60">{tier.min}명{tier.min === 6 ? ' 이상' : ''} 참여</span>
                <div className="flex items-center gap-2">
                  <span className="text-cl-gold">{'&#11088;'.repeat(tier.stars)}</span>
                  <span className="font-bold text-cl-navy font-[family-name:var(--font-mono)]">{Math.round(mission.score * tier.score / 100)}점</span>
                  <span className="nb-badge text-[9px] bg-cl-green/20 text-cl-green border-cl-green">{tier.label}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-cl-border/20">
              <span className="text-cl-red">2명 이하</span>
              <span className="text-cl-red font-bold">&#10060; 불통과 (재촬영)</span>
            </div>
          </div>
        </div>

        <button onClick={() => setPhase('upload')} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#128247; 사진 촬영하러 가기!
        </button>
      </div>
    );
  }

  // ============ UPLOAD ============
  if (phase === 'upload') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <button onClick={() => setPhase('intro')} className="text-cl-text/40 hover:text-cl-text text-sm mb-3">&larr; BACK</button>
        <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-4">&#128247; 하트 사진 업로드</h2>

        <div className="nb-card p-4 bg-cl-bg mb-4 text-center">
          {preview ? (
            <img src={preview} alt="미리보기" className="max-h-80 mx-auto rounded-lg border-2 border-cl-border mb-3" />
          ) : (
            <div className="py-12">
              <div className="text-4xl mb-3">&#128247;</div>
              <p className="text-sm text-cl-text/40">팀원들과 함께 만든 하트 사진을 업로드하세요</p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="nb-btn px-6 py-2.5 bg-white text-cl-text text-sm"
          >
            {preview ? '&#128260; 다시 선택' : '&#128247; 사진 선택 / 촬영'}
          </button>
        </div>

        {preview && (
          <button onClick={handleVerify} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
            &#129302; AI 검증 받기
          </button>
        )}

        {attempts > 0 && (
          <p className="text-[10px] text-cl-text/30 text-center mt-2 font-[family-name:var(--font-mono)]">
            시도 횟수: {attempts}회
          </p>
        )}
      </div>
    );
  }

  // ============ VERIFYING ============
  if (phase === 'verifying') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto text-center py-16">
        <div className="text-4xl mb-4 animate-pulse">&#129302;</div>
        <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-2">AI가 사진을 분석하고 있습니다...</h2>
        <p className="text-sm text-cl-text/40">하트 모양, 참여 인원, 야외 여부를 확인 중</p>
      </div>
    );
  }

  // ============ RESULT ============
  const starInfo = verifyResult ? getStarInfo(verifyResult.participantCount) : null;
  const finalScore = verifyResult ? Math.round(mission.score * (verifyResult.score / 100)) : 0;

  return (
    <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
      {verifyResult?.pass ? (
        <>
          {/* SUCCESS */}
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">&#127942;</div>
            <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
          </div>

          {/* Photo */}
          {preview && (
            <div className="nb-card p-2 mb-4">
              <img src={preview} alt="팀 하트" className="w-full max-h-64 object-contain rounded-lg" />
            </div>
          )}

          {/* Score Card */}
          <div className="nb-card p-4 mb-4 bg-cl-green/10 border-cl-green">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-cl-text">AI 검증 결과</span>
              {starInfo && <span className="nb-badge bg-cl-gold text-cl-text border-cl-gold">{starInfo.label}</span>}
            </div>
            <p className="text-sm text-cl-text/70 mb-3">{verifyResult.message}</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-cl-text/40">참여 인원</span>
                <span className="text-xl font-black text-cl-navy font-[family-name:var(--font-mono)] ml-2">{verifyResult.participantCount}명</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-cl-text/40">점수</span>
                <span className="text-2xl font-black text-cl-navy font-[family-name:var(--font-mono)] ml-2">{finalScore}/{mission.score}</span>
              </div>
            </div>
          </div>

          {/* Leadership Insight */}
          <div className="nb-card p-4 bg-cl-navy/5 mb-5">
            <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R5_CLEAR_MESSAGE}</p>
          </div>

          <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
            NEXT MISSION &rarr;
          </button>
        </>
      ) : (
        <>
          {/* FAIL */}
          <div className="text-center mb-5">
            <div className="text-5xl mb-3">&#128683;</div>
            <h2 className="text-xl font-black text-cl-red font-[family-name:var(--font-space)] mb-1">검증 실패</h2>
          </div>

          {preview && (
            <div className="nb-card p-2 mb-4 border-cl-red/30">
              <img src={preview} alt="검증 실패" className="w-full max-h-48 object-contain rounded-lg opacity-70" />
            </div>
          )}

          <div className="nb-card p-4 mb-5 bg-cl-red/10 border-cl-red">
            <p className="text-sm text-cl-text/70 mb-2">{verifyResult?.message}</p>
            <ul className="text-xs text-cl-text/50 space-y-1">
              <li>&#10003; 야외(실외)에서 촬영했나요?</li>
              <li>&#10003; 3명 이상이 몸으로 하트를 만들었나요?</li>
              <li>&#10003; 손가락 하트가 아닌 전신/팔 하트인가요?</li>
            </ul>
          </div>

          <button onClick={handleRetry} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
            &#128247; 다시 촬영하기
          </button>
        </>
      )}
    </div>
  );
}
