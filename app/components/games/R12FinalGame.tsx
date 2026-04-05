'use client';

import React, { useState } from 'react';
import { R12_STORY, MISSIONS } from '../../constants';
import { geminiService } from '../../lib/geminiService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
  teamId: number;
}

export default function R12FinalGame({ onComplete, onBack, startTime, teamId }: Props) {
  const [phase, setPhase] = useState<'jegi' | 'report' | 'result'>('jegi');
  const [jegiCount, setJegiCount] = useState('');
  const [jegiError, setJegiError] = useState('');
  const [report, setReport] = useState({ oneLine: '', bestMission: '', regret: '', futureHelp: '' });
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ pass: boolean; message: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [infographicUrl, setInfographicUrl] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const mission = MISSIONS[11];

  const handleJegiSubmit = () => {
    const count = parseInt(jegiCount);
    if (isNaN(count) || count < 0) {
      setJegiError('유효한 숫자를 입력하세요.');
      return;
    }
    setPhase('report');
  };

  const handleReportValidate = async () => {
    if (report.oneLine.length < 10 || report.bestMission.length < 5 || report.regret.length < 10 || report.futureHelp.length < 10) {
      setValidationResult({ pass: false, message: '각 항목을 10자 이상 성의 있게 작성해주세요.' });
      return;
    }
    setValidating(true);
    try {
      const result = await geminiService.validateReport(report);
      setValidationResult(result);
      if (result.pass) {
        setCleared(true);
        setPhase('result');
        // Generate infographic
        setGenerating(true);
        try {
          const imgResult = await geminiService.generateReportInfographic(report, teamId);
          if (imgResult.success && imgResult.imageData) {
            setInfographicUrl(`data:image/png;base64,${imgResult.imageData}`);
          }
        } catch {
          // Infographic generation is non-critical
        }
        setGenerating(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setValidationResult({ pass: false, message: `검증 중 오류: ${errorMsg}` });
    }
    setValidating(false);
  };

  const handleComplete = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onComplete(mission.score, elapsed);
  };

  const updateReport = (field: keyof typeof report, value: string) => {
    setReport(prev => ({ ...prev, [field]: value }));
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

      {phase === 'jegi' && (
        <>
          <p className="text-cl-text/70 text-sm mb-6 leading-relaxed">{R12_STORY}</p>
          <div className="bg-white rounded-xl p-4 mb-4 border border-cl-navy/20">
            <label className="text-xs text-cl-navy font-[family-name:var(--font-mono)] mb-2 block">제기차기 횟수 입력</label>
            <input
              type="number"
              value={jegiCount}
              onChange={e => { setJegiCount(e.target.value); setJegiError(''); }}
              placeholder="팀 전체 제기차기 횟수"
              min={0}
              className="w-full nb-input px-4 py-3 text-cl-text text-center text-2xl font-[family-name:var(--font-mono)]"
            />
            {jegiError && <p className="text-cl-red text-sm mt-2">{jegiError}</p>}
          </div>
          <button onClick={handleJegiSubmit} className="w-full py-3 nb-btn bg-cl-navy text-white">
            NEXT: 결과보고서 작성
          </button>
        </>
      )}

      {phase === 'report' && !cleared && (
        <>
          <div className="space-y-4 mb-4">
            <div>
              <label className="text-xs text-cl-navy font-[family-name:var(--font-mono)] mb-1 block">한줄 소감</label>
              <textarea
                value={report.oneLine}
                onChange={e => updateReport('oneLine', e.target.value)}
                placeholder="12개월의 리더십 여정을 한 줄로 표현한다면?"
                rows={2}
                className="w-full nb-input px-4 py-3 text-cl-text resize-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-cl-navy font-[family-name:var(--font-mono)] mb-1 block">리더십이 빛났던 미션</label>
              <input
                type="text"
                value={report.bestMission}
                onChange={e => updateReport('bestMission', e.target.value)}
                placeholder="가장 기억에 남는 미션은?"
                className="w-full nb-input px-4 py-3 text-cl-text text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-cl-navy font-[family-name:var(--font-mono)] mb-1 block">아쉬웠던 점</label>
              <textarea
                value={report.regret}
                onChange={e => updateReport('regret', e.target.value)}
                placeholder="다시 팀장이 된다면 어떻게 하고 싶은지?"
                rows={2}
                className="w-full nb-input px-4 py-3 text-cl-text resize-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-cl-navy font-[family-name:var(--font-mono)] mb-1 block">현업에 어떤 도움이 될까요?</label>
              <textarea
                value={report.futureHelp}
                onChange={e => updateReport('futureHelp', e.target.value)}
                placeholder="오늘 경험이 실제 리더십에 어떤 도움이 될지?"
                rows={2}
                className="w-full nb-input px-4 py-3 text-cl-text resize-none text-sm"
              />
            </div>
          </div>

          {validationResult && !validationResult.pass && (
            <div className="p-3 rounded-xl border border-cl-red/30 bg-cl-red/10 text-cl-red text-sm mb-4">
              {validationResult.message}
            </div>
          )}

          <button
            onClick={handleReportValidate}
            disabled={validating}
            className="w-full py-3 nb-btn bg-cl-navy text-white disabled:opacity-50"
          >
            {validating ? 'AI VALIDATING...' : 'SUBMIT REPORT'}
          </button>
        </>
      )}

      {phase === 'result' && (
        <div className="text-center py-6">
          <div className="text-4xl font-black text-cl-green mb-4 font-[family-name:var(--font-space)]">
            ALL MISSIONS COMPLETE
          </div>
          <p className="text-cl-text/60 mb-4">MISSION CLEAR - {mission.score}점 획득!</p>

          {generating && (
            <div className="flex items-center justify-center gap-2 text-cl-navy text-sm mb-4">
              <div className="w-4 h-4 border-2 border-cl-navy border-t-transparent rounded-full animate-spin" />
              AI 인포그래픽 생성 중...
            </div>
          )}

          {infographicUrl && (
            <div className="mb-4">
              <img src={infographicUrl} alt="팀 인포그래픽" className="w-full rounded-xl border border-cl-navy/20" />
            </div>
          )}

          <button onClick={handleComplete} className="px-8 py-3 nb-btn bg-cl-green text-white">
            FINAL COMPLETE
          </button>
        </div>
      )}
    </div>
  );
}
