'use client';

import React, { useState } from 'react';
import { R1_STORY, MISSIONS } from '../../constants';
import { geminiService } from '../../lib/geminiService';
import { gasService } from '../../lib/gasService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
  roomId: string;
  teamId: number;
}

export default function R1VisionGame({ onComplete, onBack, startTime, roomId, teamId }: Props) {
  const [speech, setSpeech] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: string; strengths: string[]; improvements: string[] } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const mission = MISSIONS[0];

  const handleSubmit = async () => {
    if (speech.length < 100) return;
    setEvaluating(true);
    setResult(null);

    const evaluation = await geminiService.evaluateInaugural(speech);
    setResult(evaluation);
    setAttempts(prev => prev + 1);
    setEvaluating(false);
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = result ? Math.round(mission.score * (result.score / 100)) : mission.score;
    // Save mission data to GAS (non-blocking)
    if (result) {
      const missionData = {
        speech,
        aiScore: result.score,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
      };
      gasService.saveMissionData(roomId, teamId, 1, JSON.stringify(missionData)).catch(() => {});
    }
    onComplete(finalScore, elapsed);
  };

  const charCount = speech.length;
  const isLongEnough = charCount >= 100;

  return (
    <div className="nb-card rounded-2xl p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&#8592; BACK</button>
        <div className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">
          배점: {mission.score}점 | 시간 보너스: {mission.timeLimit}분 이내 +{mission.timeBonus}점
        </div>
      </div>

      <h2 className="text-xl font-bold text-cl-navy font-[family-name:var(--font-space)] mb-2">
        {mission.month}: {mission.title}
      </h2>

      {/* Story */}
          <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R1_STORY}</p>

          {/* Mission Image */}
          <div className="nb-card p-2 mb-5">
            <img
              src="/images/mission1.jpg"
              alt="부임 인사 미션 안내"
              className="w-full rounded-lg border-2 border-cl-border"
            />
          </div>

          {/* Guide */}
          <div className="nb-card p-4 mb-5 bg-cl-gold/10 border-cl-gold">
            <h3 className="text-sm font-black text-cl-navy mb-2">&#128221; 부임 인사 작성 가이드</h3>
            <ul className="text-xs text-cl-text/70 space-y-1.5 leading-relaxed">
              <li>&#10003; <strong>비전 제시</strong> &mdash; 팀이 함께 나아갈 방향과 목표를 제시하세요</li>
              <li>&#10003; <strong>진정성</strong> &mdash; 형식적인 인사가 아닌, 진심이 담긴 표현을 사용하세요</li>
              <li>&#10003; <strong>팀원 존중</strong> &mdash; 팀원 한 사람 한 사람의 역할과 가치를 인정하세요</li>
              <li>&#10003; <strong>소통 의지</strong> &mdash; 열린 소통과 투명한 협업에 대한 의지를 보여주세요</li>
              <li>&#10003; <strong>동기부여</strong> &mdash; 팀원들이 기대감을 갖고 함께하고 싶도록 영감을 주세요</li>
            </ul>
            <p className="text-[10px] text-cl-text/40 mt-3 font-[family-name:var(--font-mono)]">
              AI가 위 5가지 기준(각 20점, 총 100점)으로 평가합니다. 80점 이상이면 PASS!
            </p>
          </div>

          {/* Speech Input */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-cl-text/60 font-[family-name:var(--font-mono)] font-bold">
                부임 인사 작성
              </label>
              <span className={`text-xs font-[family-name:var(--font-mono)] font-bold ${isLongEnough ? 'text-cl-green' : 'text-cl-red'}`}>
                {charCount}/100자 {isLongEnough ? '&#10003;' : '(최소 100자)'}
              </span>
            </div>
            <textarea
              value={speech}
              onChange={e => { setSpeech(e.target.value); setResult(null); }}
              placeholder="팀원들 앞에서 할 부임 인사를 100자 이상으로 작성하세요.&#10;&#10;예시: &quot;안녕하세요, 오늘부터 여러분과 함께하게 된 팀장 OOO입니다. 저는 이 팀이 단순히 업무를 처리하는 곳이 아니라, 서로의 성장을 돕고 함께 도전하는 팀이 되었으면 합니다...&quot;"
              className="nb-input w-full h-40 text-sm resize-none leading-relaxed"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isLongEnough || evaluating}
            className="nb-btn w-full py-3 bg-cl-navy text-white text-sm disabled:opacity-40"
          >
            {evaluating ? 'AI 평가 중...' : attempts > 0 ? '다시 평가받기' : 'AI에게 평가받기'}
          </button>

          {/* Evaluation Result */}
          {result && (
            <div className={`mt-5 nb-card p-5 ${result.score >= 80 ? 'bg-cl-green/10 border-cl-green' : 'bg-cl-red/10 border-cl-red'}`}>
              {/* Score */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-cl-text">AI 평가 결과</span>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-black font-[family-name:var(--font-mono)] ${result.score >= 80 ? 'text-cl-green' : 'text-cl-red'}`}>
                    {result.score}
                  </span>
                  <span className="text-sm text-cl-text/40">/100점</span>
                </div>
              </div>

              {/* Feedback */}
              <p className="text-sm text-cl-text/70 mb-3 leading-relaxed">{result.feedback}</p>

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-bold text-cl-green">&#128077; 잘한 점</span>
                  <ul className="text-xs text-cl-text/60 mt-1 space-y-0.5">
                    {result.strengths.map((s, i) => <li key={i}>&bull; {s}</li>)}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {result.improvements.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-bold text-cl-orange">&#128736; 개선 포인트</span>
                  <ul className="text-xs text-cl-text/60 mt-1 space-y-0.5">
                    {result.improvements.map((s, i) => <li key={i}>&bull; {s}</li>)}
                  </ul>
                </div>
              )}

              {/* Pass/Fail + Action */}
              {result.score >= 80 ? (
                <div className="space-y-3">
                  <div className="nb-badge bg-cl-green text-white border-cl-green w-full text-center py-2 text-sm">
                    &#127942; PASS! 훌륭한 부임 인사입니다!
                  </div>
                  <div className="text-center text-cl-text/40 text-xs">
                    미션 점수: <strong className="text-cl-navy text-base">{Math.round(mission.score * (result.score / 100))}</strong>/{mission.score}점
                  </div>
                  <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
                    NEXT MISSION &#8594;
                  </button>
                </div>
              ) : (
                <div className="nb-badge bg-cl-red/20 text-cl-red border-cl-red w-full text-center py-2 text-sm">
                  &#9888; 80점 이상이 필요합니다. 개선 포인트를 참고하여 다시 작성해보세요!
                </div>
              )}
            </div>
          )}
    </div>
  );
}
