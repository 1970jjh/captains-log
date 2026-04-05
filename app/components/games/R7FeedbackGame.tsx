'use client';

import React, { useState } from 'react';
import { R7_STORY, R7_MISSION_IMAGE, R7_QUIZ, R7_CLEAR_MESSAGE, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

type Phase = 'intro' | 'quiz' | 'result';

const FEEDBACK_MESSAGES = [
  { min: 18, label: 'PERFECT / EXCELLENT', emoji: '&#127775;', text: '탁월합니다! 당신은 이미 원온원의 본질을 체득하고 있습니다. 준비부터 마무리까지, 팀원의 마음을 여는 대화의 기술을 갖추고 있네요. 이 감각을 하반기 실전에서도 그대로 발휘하세요.' },
  { min: 13, label: 'GREAT', emoji: '&#128170;', text: '훌륭합니다! 대부분의 상황에서 올바른 판단을 내렸습니다. 다만, 틀린 문제를 다시 살펴보세요. \'그럴싸하지만 핵심을 놓친\' 선택지에 넘어간 순간이 있었습니다. 그 미묘한 차이가 실전에서는 큰 차이를 만듭니다.' },
  { min: 9, label: 'GOOD', emoji: '&#128077;', text: '절반 이상 맞추셨습니다! 기본적인 감각은 있지만, 원온원의 세부 원칙에서 보완이 필요합니다. 특히 \'경청과 코칭\'의 차이, \'공감과 해결\'의 순서를 다시 한 번 되짚어 보세요.' },
  { min: 0, label: 'NEEDS WORK', emoji: '&#128218;', text: '솔직한 점수가 오히려 좋은 출발점입니다. 오늘 틀린 문제 하나하나가 당신이 하반기에 반드시 개선해야 할 리더십 과제입니다. 해설을 꼼꼼히 읽고, 다음 원온원부터 하나씩 적용해보세요.' },
];

const ONEONONE_PROCESS = [
  { step: '1. 사전 준비', icon: '&#128203;', tips: ['팀원에게 사전에 일정 공유 (최소 2~3일 전)', '면담 주제를 팀원이 먼저 정하도록 안내', '팀원의 상반기 성과 데이터/KPI를 미리 정리', '프라이버시가 보장되는 장소 확보'] },
  { step: '2. 오프닝', icon: '&#9749;', tips: ['안부/컨디션으로 시작 (업무 이야기 금지)', '핸드폰 무음, 노트북 덮기 → 100% 집중', '편안한 분위기 조성 (커피, 간식 등)', '"오늘 시간은 00님을 위한 시간입니다"'] },
  { step: '3. 경청과 질문', icon: '&#128066;', tips: ['팀원 70~80%, 팀장 20~30% 발언 비율', '열린 질문(Open-ended)으로 깊은 사고 유도', '침묵을 두려워하지 말 것 → 생각 정리 시간', '메모는 최소한으로 (눈 마주치기 우선)'] },
  { step: '4. 피드백', icon: '&#127919;', tips: ['SBI 법칙: 상황(S) + 행동(B) + 영향(I)', '칭찬은 구체적 행동을, 지적은 사실 기반으로', '타 팀원과 절대 비교 금지', '불편한 진실은 팀장 본인의 언어로 직접'] },
  { step: '5. 코칭', icon: '&#127793;', tips: ['답을 주지 말고, 답을 찾게 하라', '"어떻게 하면 좋을 것 같아요?" 질문 활용', '번아웃 호소 → 실질적 업무 조정(Action)', '리더십 비판 → 방어 대신 수용 + 개선 약속'] },
  { step: '6. 마무리', icon: '&#9989;', tips: ['합의한 액션 아이템(Action Item) 반드시 기록', '팀장과 팀원 모두의 실천 과제 명확히', '다음 점검 일정 즉시 잡기', '"감사합니다" 진심으로 마무리'] },
];

export default function R7FeedbackGame({ onComplete, onBack, startTime }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<Array<{ selected: 'A' | 'B'; correct: boolean }>>([]);
  const mission = MISSIONS[6];

  const quiz = R7_QUIZ[currentQ];
  const isCorrect = selected === quiz?.correct;

  const handleSelect = (choice: 'A' | 'B') => {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
    const correct = choice === quiz.correct;
    if (correct) setCorrectCount(prev => prev + 1);
    setAnswers(prev => [...prev, { selected: choice, correct }]);
  };

  const handleNext = () => {
    if (currentQ < R7_QUIZ.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setPhase('result');
    }
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const ratio = correctCount / R7_QUIZ.length;
    const finalScore = Math.round(mission.score * (ratio * 0.9 + 0.1));
    onComplete(finalScore, elapsed);
  };

  const getFeedback = () => {
    for (const fb of FEEDBACK_MESSAGES) {
      if (correctCount >= fb.min) return fb;
    }
    return FEEDBACK_MESSAGES[FEEDBACK_MESSAGES.length - 1];
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
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R7_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R7_MISSION_IMAGE} alt="7월 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-5">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#127919; 미션 규칙</h3>
          <ul className="text-xs text-cl-text/70 space-y-1 leading-relaxed">
            <li>&bull; <strong>20문제</strong>를 순서대로 풀기 (5 Phase, 시간 흐름 순)</li>
            <li>&bull; 각 문제에서 <strong>A / B</strong> 카드 중 정답 선택</li>
            <li>&bull; 선택 후 즉시 <strong>정답 + 해설</strong> 확인 &rarr; 다음 문제</li>
            <li>&bull; 재도전 없음 &mdash; 한 번에 20문제 완주</li>
            <li>&bull; 정답 수에 따라 점수 차등 (전부 틀려도 최소 점수 보장)</li>
          </ul>
        </div>

        <button onClick={() => setPhase('quiz')} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#9989; 퀴즈 시작!
        </button>
      </div>
    );
  }

  // ============ QUIZ ============
  if (phase === 'quiz' && quiz) {
    const prevPhase = currentQ > 0 ? R7_QUIZ[currentQ - 1].phase : '';
    const showPhaseHeader = quiz.phase !== prevPhase;

    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between mb-3">
          <span className="nb-badge bg-cl-navy text-white text-[10px]">{currentQ + 1} / {R7_QUIZ.length}</span>
          <span className="text-xs text-cl-green font-[family-name:var(--font-mono)] font-bold">&#10003; {correctCount}개 정답</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full mb-4 border border-cl-border/20">
          <div className="h-full bg-cl-navy rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / R7_QUIZ.length) * 100}%` }} />
        </div>

        {/* Phase Header */}
        {showPhaseHeader && (
          <div className="nb-badge bg-cl-gold/30 text-cl-navy border-cl-gold w-full text-center py-1.5 mb-3 text-xs">
            {quiz.phase}
          </div>
        )}

        {/* Question */}
        <h3 className="text-base font-bold text-cl-navy mb-2">{quiz.title}</h3>
        <p className="text-sm text-cl-text/70 leading-relaxed mb-5">{quiz.question}</p>

        {/* Option Cards */}
        <div className="space-y-3 mb-4">
          {(['A', 'B'] as const).map(opt => {
            const text = opt === 'A' ? quiz.optionA : quiz.optionB;
            const isThis = selected === opt;
            const isCorrectOpt = quiz.correct === opt;

            let cardStyle = 'bg-white border-cl-border hover:border-cl-navy/50 hover:bg-cl-navy/5 cursor-pointer';
            if (answered) {
              if (isCorrectOpt) {
                cardStyle = 'bg-cl-green/10 border-cl-green';
              } else if (isThis && !isCorrectOpt) {
                cardStyle = 'bg-cl-red/10 border-cl-red';
              } else {
                cardStyle = 'bg-gray-50 border-cl-border/30 opacity-60';
              }
            } else if (isThis) {
              cardStyle = 'bg-cl-navy/10 border-cl-navy shadow-[4px_4px_0px_#1E3A5F]';
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={answered}
                className={`w-full p-4 rounded-xl border-3 text-left transition-all ${cardStyle}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-sm ${
                    answered && isCorrectOpt ? 'bg-cl-green border-cl-green text-white' :
                    answered && isThis && !isCorrectOpt ? 'bg-cl-red border-cl-red text-white' :
                    'border-cl-border text-cl-text/40'
                  }`}>
                    {answered && isCorrectOpt ? '&#10003;' : answered && isThis && !isCorrectOpt ? '&#10007;' : opt}
                  </span>
                  <p className="text-sm text-cl-text/80 leading-relaxed flex-1">{text}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && (
          <div className={`nb-card p-4 mb-4 animate-bounce-in ${isCorrect ? 'bg-cl-green/10 border-cl-green' : 'bg-cl-red/10 border-cl-red'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-bold ${isCorrect ? 'text-cl-green' : 'text-cl-red'}`}>
                {isCorrect ? '&#9989; 정답!' : '&#10060; 오답'}
              </span>
              <span className="text-xs text-cl-text/40">정답: {quiz.correct}</span>
            </div>
            <p className="text-sm text-cl-text/70 leading-relaxed">{quiz.explanation}</p>
          </div>
        )}

        {/* Next Button */}
        {answered && (
          <button onClick={handleNext} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
            {currentQ < R7_QUIZ.length - 1 ? `다음 문제 (${currentQ + 2}/${R7_QUIZ.length}) &rarr;` : '결과 확인 &rarr;'}
          </button>
        )}
      </div>
    );
  }

  // ============ RESULT ============
  const fb = getFeedback();
  const ratio = correctCount / R7_QUIZ.length;
  const finalScore = Math.round(mission.score * (ratio * 0.9 + 0.1));

  return (
    <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
      <div className="text-center mb-5">
        <div className="text-5xl mb-3">&#127942;</div>
        <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
      </div>

      {/* Score */}
      <div className="nb-card p-4 mb-4 text-center">
        <span className="text-4xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{correctCount}</span>
        <span className="text-cl-text/40 text-lg">/{R7_QUIZ.length} 정답</span>
        <div className="nb-badge bg-cl-gold text-cl-text border-cl-gold mt-2 text-xs" dangerouslySetInnerHTML={{ __html: `${fb.emoji} ${fb.label}` }} />
        <div className="mt-2 text-sm text-cl-text/50">
          미션 점수: <strong className="text-cl-navy text-lg">{finalScore}</strong>/{mission.score}점
        </div>
      </div>

      {/* Feedback Message */}
      <div className="nb-card p-4 mb-4 bg-cl-gold/10 border-cl-gold">
        <p className="text-sm text-cl-text/70 leading-relaxed">{fb.text}</p>
      </div>

      {/* Answer Review */}
      <details className="nb-card p-4 mb-4">
        <summary className="text-sm font-bold text-cl-navy cursor-pointer">&#128196; 전체 답안 확인 ({correctCount}개 정답 / {R7_QUIZ.length - correctCount}개 오답)</summary>
        <div className="mt-3 space-y-2">
          {R7_QUIZ.map((q, i) => {
            const ans = answers[i];
            return (
              <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${ans?.correct ? 'bg-cl-green/10' : 'bg-cl-red/10'}`}>
                <span className={`font-bold ${ans?.correct ? 'text-cl-green' : 'text-cl-red'}`}>{ans?.correct ? '&#10003;' : '&#10007;'}</span>
                <span className="text-cl-text/60">{q.title}</span>
                {!ans?.correct && <span className="text-cl-red text-[10px] ml-auto">정답: {q.correct}</span>}
              </div>
            );
          })}
        </div>
      </details>

      {/* Leadership Insight */}
      <div className="nb-card p-4 bg-cl-navy/5 mb-4">
        <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R7_CLEAR_MESSAGE}</p>
      </div>

      {/* 원온원 프로세스 & 팁 */}
      <div className="nb-card p-4 mb-5">
        <h3 className="text-sm font-bold text-cl-navy mb-3">&#128203; 상반기 리뷰 원온원 면담 프로세스 &amp; 팁</h3>
        <div className="space-y-4">
          {ONEONONE_PROCESS.map((p, i) => (
            <div key={i} className="rounded-lg bg-cl-bg p-3 border border-cl-border/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" dangerouslySetInnerHTML={{ __html: p.icon }} />
                <span className="font-bold text-cl-navy text-sm">{p.step}</span>
              </div>
              <ul className="text-[11px] text-cl-text/60 space-y-1 ml-7">
                {p.tips.map((tip, ti) => (
                  <li key={ti}>&bull; {tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
        NEXT MISSION &rarr;
      </button>
    </div>
  );
}
