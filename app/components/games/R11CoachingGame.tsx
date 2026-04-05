'use client';

import React, { useState, useRef, useEffect } from 'react';
import { R11_STORIES, CUSTOMER_SCENARIOS, MISSIONS } from '../../constants';
import { IndustryType } from '../../types';
import { geminiService } from '../../lib/geminiService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
  industryType: IndustryType;
}

const EVAL_LABELS: Record<string, string> = {
  empathy: '공감',
  listening: '경청',
  coaching: '코칭',
  solution: '해결책',
  motivation: '동기부여',
  trust: '신뢰구축',
  communication: '의사소통',
  decisiveness: '결단력',
  delegation: '위임',
  vision: '비전제시',
};

const MOOD_LABELS = ['', '매우 화남', '화남', '보통', '긍정적', '만족'];
const MOOD_COLORS = ['', '#dc2626', '#f97316', '#d97706', '#16a34a', '#1E3A5F'];

export default function R11CoachingGame({ onComplete, onBack, startTime, industryType }: Props) {
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [satisfactionScore, setSatisfactionScore] = useState(0);
  const [moodLevel, setMoodLevel] = useState(1);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<{ overallGrade: string; summary: string; goodPoints: string[]; improvementPoints: string[]; practicalTips: string; scoreComment: string } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mission = MISSIONS[10];

  const scenario = CUSTOMER_SCENARIOS[industryType] || CUSTOMER_SCENARIOS[IndustryType.IT_SOLUTION];
  const story = R11_STORIES[industryType] || R11_STORIES[0];

  // Auto scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory]);

  // Initialize with first message
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{ role: 'assistant', content: scenario.scenario }]);
    }
  }, [chatHistory.length, scenario.scenario]);

  const handleSend = async () => {
    if (!userInput.trim() || sending) return;
    const msg = userInput.trim();
    setUserInput('');
    setSending(true);

    const newHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [...chatHistory, { role: 'user', content: msg }];
    setChatHistory(newHistory);

    try {
      const result = await geminiService.chatWithCustomer(industryType, newHistory, msg);
      const updatedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [...newHistory, { role: 'assistant', content: result.response }];
      setChatHistory(updatedHistory);
      setSatisfactionScore(result.satisfactionScore);
      setMoodLevel(result.moodLevel);
      setEvalScores(result.evaluationScores);

      if (result.conversationEnded || result.satisfactionScore >= 80) {
        setChatEnded(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI 응답 실패';
      setChatHistory(prev => [...prev, { role: 'assistant', content: `[시스템 오류] ${errorMsg}` }]);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleEndChat = async () => {
    setFeedbackLoading(true);
    try {
      const result = await geminiService.generateCoachingFeedback(chatHistory, satisfactionScore, industryType);
      if (result.success) setFeedback(result.feedback);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setFeedback({
        overallGrade: 'N/A',
        summary: `피드백 생성 중 오류가 발생했습니다: ${errorMsg}`,
        goodPoints: [],
        improvementPoints: [],
        practicalTips: '',
        scoreComment: '',
      });
    }
    setFeedbackLoading(false);
    setShowFeedback(true);
    setCleared(true);
  };

  const handleComplete = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = Math.min(mission.score, Math.round((satisfactionScore / 100) * mission.score));
    onComplete(finalScore, elapsed);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-cl-bg">
      {/* Header */}
      <div className="nb-card p-3 flex items-center justify-between border-b border-cl-navy/20">
        <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm px-3 py-1">← BACK</button>
        <div className="text-center">
          <div className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">{mission.month}: {mission.title}</div>
          <div className="text-[10px] text-cl-text/40 font-[family-name:var(--font-mono)]">배점: {mission.score}점 | {mission.timeLimit}분 이내 +{mission.timeBonus}점</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-[family-name:var(--font-mono)]" style={{ color: MOOD_COLORS[moodLevel] }}>
            {MOOD_LABELS[moodLevel]}
          </div>
          <div className="text-sm font-bold text-cl-navy font-[family-name:var(--font-mono)]">{satisfactionScore}점</div>
        </div>
      </div>

      {/* Evaluation bar */}
      <div className="px-3 py-2 bg-white overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {Object.entries(EVAL_LABELS).map(([key, label]) => (
            <div key={key} className="text-center">
              <div className="text-[8px] text-cl-text/40">{label}</div>
              <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-cl-navy rounded-full transition-all" style={{ width: `${evalScores[key] || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Story panel (collapsed) */}
      <details className="px-3 py-1 bg-cl-bg text-cl-text/50 text-xs">
        <summary className="cursor-pointer hover:text-cl-text/80">미션 스토리 보기</summary>
        <p className="mt-2 leading-relaxed">{story}</p>
        <p className="mt-1 text-cl-navy">[{scenario.title}] 상대: {scenario.customerName}</p>
      </details>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-cl-navy/20 text-cl-text border border-cl-navy/20 rounded-br-none'
                : 'bg-cl-purple/10 text-cl-text border border-cl-purple/20 rounded-bl-none'
            }`}>
              <div className="text-[10px] text-cl-text/40 mb-1 font-[family-name:var(--font-mono)]">
                {msg.role === 'user' ? 'YOU (팀장)' : scenario.customerName}
              </div>
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-cl-purple/10 rounded-2xl rounded-bl-none px-4 py-3 text-cl-text/40 text-sm border border-cl-purple/20 animate-pulse">
              입력 중...
            </div>
          </div>
        )}
      </div>

      {/* Feedback overlay */}
      {showFeedback && feedback && (
        <div className="absolute inset-0 bg-black/90 z-50 overflow-y-auto p-4">
          <div className="nb-card rounded-2xl p-6 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-cl-navy font-[family-name:var(--font-space)] text-center mb-4">COACHING REPORT</h3>
            <div className="text-center mb-4">
              <span className={`inline-block px-6 py-2 rounded-full text-2xl font-black ${
                feedback.overallGrade <= 'B' ? 'bg-cl-green text-black' : feedback.overallGrade <= 'D' ? 'bg-cl-gold text-black' : 'bg-cl-red text-white'
              }`}>
                Grade: {feedback.overallGrade}
              </span>
            </div>
            <p className="text-cl-text/70 text-sm mb-4">{feedback.summary}</p>
            {feedback.goodPoints.length > 0 && (
              <div className="mb-3">
                <h4 className="text-cl-green text-xs font-[family-name:var(--font-mono)] mb-1">STRENGTHS</h4>
                <ul className="text-sm text-cl-text/60 space-y-1">
                  {feedback.goodPoints.map((p, i) => <li key={i}>+ {p}</li>)}
                </ul>
              </div>
            )}
            {feedback.improvementPoints.length > 0 && (
              <div className="mb-3">
                <h4 className="text-cl-gold text-xs font-[family-name:var(--font-mono)] mb-1">IMPROVEMENTS</h4>
                <ul className="text-sm text-cl-text/60 space-y-1">
                  {feedback.improvementPoints.map((p, i) => <li key={i}>- {p}</li>)}
                </ul>
              </div>
            )}
            {feedback.practicalTips && (
              <div className="mb-3">
                <h4 className="text-cl-navy text-xs font-[family-name:var(--font-mono)] mb-1">PRACTICAL TIPS</h4>
                <p className="text-sm text-cl-text/60">{feedback.practicalTips}</p>
              </div>
            )}
            <button onClick={handleComplete} className="w-full mt-4 py-4 nb-btn bg-cl-navy text-white">
              MISSION CLEAR
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      {!cleared && (
        <div className="p-3 nb-card border-t border-cl-navy/20">
          {chatEnded ? (
            <button
              onClick={handleEndChat}
              disabled={feedbackLoading}
              className="w-full py-3 nb-btn bg-cl-green text-white disabled:opacity-50"
            >
              {feedbackLoading ? 'ANALYZING...' : 'END CONVERSATION & GET FEEDBACK'}
            </button>
          ) : (
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="코칭 메시지를 입력하세요..."
                rows={2}
                className="flex-1 nb-input px-4 py-2 text-cl-text resize-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={sending || !userInput.trim()}
                className="px-6 nb-btn bg-cl-navy text-white disabled:opacity-50"
              >
                SEND
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
