'use client';

import React, { useState, useRef, useEffect } from 'react';
import { R3_STORY, R3_MISSION_IMAGE, R3_TEAM_MEMBERS, MISSIONS } from '../../constants';
import { geminiService } from '../../lib/geminiService';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

type Phase = 'select' | 'profile' | 'goal' | 'chat' | 'result';

const EVAL_LABELS = [
  { key: 'empathy', label: '공감', desc: '팀원의 감정을 이해하고 인정' },
  { key: 'listening', label: '경청', desc: '말을 끊지 않고 끝까지 경청' },
  { key: 'coaching', label: '코칭', desc: '답을 주기보다 스스로 찾도록 유도' },
  { key: 'solution', label: '해결책', desc: '현실적이고 구체적인 대안 제시' },
  { key: 'motivation', label: '동기부여', desc: '다시 힘을 낼 수 있게 북돋움' },
  { key: 'trust', label: '신뢰구축', desc: '안심하고 속마음을 열 수 있게' },
  { key: 'communication', label: '소통', desc: '명확하고 진심 어린 표현' },
  { key: 'decisiveness', label: '결단력', desc: '필요한 순간에 리더로서 약속' },
  { key: 'delegation', label: '위임/배려', desc: '팀원의 상황과 역량을 고려' },
  { key: 'vision', label: '비전', desc: '함께 나아갈 방향을 제시' },
];

export default function R3MeetingGame({ onComplete, onBack, startTime }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedMember, setSelectedMember] = useState<typeof R3_TEAM_MEMBERS[0] | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);
  const [score, setScore] = useState(0);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ overallGrade: string; summary: string; goodPoints: string[]; improvementPoints: string[]; practicalTips: string; scoreComment: string } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mission = MISSIONS[2];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSelectMember = (member: typeof R3_TEAM_MEMBERS[0]) => {
    setSelectedMember(member);
    setPhase('profile');
  };

  const handleConfirm = () => {
    setPhase('goal');
  };

  const handleStartChat = () => {
    setPhase('chat');
  };

  const handleSend = async () => {
    if (!userInput.trim() || sending || !selectedMember) return;
    const msg = userInput.trim();
    setUserInput('');
    setSending(true);

    const newHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...chatHistory,
      { role: 'user', content: msg },
    ];
    setChatHistory(newHistory);

    try {
      const systemPrompt = `${selectedMember.aiPrompt}

면담 목표: ${selectedMember.meetingGoal}

자연스러운 한국어로 감정을 실어 대화하세요.
리더의 공감, 경청, 해결 의지에 따라 당신의 마음이 점차 열립니다.
형식적이거나 무성의한 응대에는 더 벽을 세웁니다.
최소 5턴 이상 대화를 이어가세요.`;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: '네, 알겠습니다. 해당 팀원 역할로 면담에 임하겠습니다.' }] },
        ...newHistory.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: msg + '\n\n[시스템: 위 메시지에 대해 팀원 역할로 응답하고, JSON으로 현재 평가를 첨부하세요. 형식: {"response":"응답","satisfactionScore":0-100,"moodLevel":1-5,"conversationEnded":false,"evaluationScores":{"empathy":0-100,"listening":0-100,"coaching":0-100,"solution":0-100,"motivation":0-100,"trust":0-100,"communication":0-100,"decisiveness":0-100,"delegation":0-100,"vision":0-100}}]' }] },
      ];

      const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });
      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const json = text.match(/\{[\s\S]*\}/);

      if (json) {
        const parsed = JSON.parse(json[0]);
        setChatHistory([...newHistory, { role: 'assistant', content: parsed.response || text }]);
        setScore(parsed.satisfactionScore || 0);
        setEvalScores(parsed.evaluationScores || {});
      } else {
        setChatHistory([...newHistory, { role: 'assistant', content: text }]);
      }
    } catch (error) {
      setChatHistory([...newHistory, { role: 'assistant', content: `오류 발생: ${error}` }]);
    }
    setSending(false);
  };

  const handleEndChat = async () => {
    setFeedbackLoading(true);
    try {
      const result = await geminiService.generateCoachingFeedback(chatHistory, score, 12);
      if (result.success) setFeedback(result.feedback);
    } catch {
      setFeedback({ overallGrade: 'N/A', summary: '피드백 생성 실패', goodPoints: [], improvementPoints: [], practicalTips: '', scoreComment: '' });
    }
    setFeedbackLoading(false);
    setPhase('result');
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = Math.round(mission.score * (score / 100));
    onComplete(finalScore, elapsed);
  };

  // ============ STEP 1: SELECT ============
  if (phase === 'select') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr; BACK</button>
          <span className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">배점: {mission.score}점</span>
        </div>
        <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-2">{mission.month}: {mission.title}</h2>
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R3_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R3_MISSION_IMAGE} alt="1:1 면담 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        <h3 className="text-sm font-bold text-cl-navy mb-3">면담 대상자를 선택하세요</h3>
        <div className="space-y-2">
          {R3_TEAM_MEMBERS.map(member => (
            <button
              key={member.id}
              onClick={() => handleSelectMember(member)}
              className="w-full nb-card p-4 text-left nb-card-hover transition-all hover:border-cl-navy"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{member.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cl-text">{member.name}</span>
                    <span className="nb-badge text-[10px] bg-cl-gold/30 text-cl-text">{member.style}</span>
                  </div>
                  <p className="text-xs text-cl-text/50 mt-0.5">{member.summary}</p>
                </div>
                <span className="text-cl-navy text-sm">&rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ============ STEP 2: PROFILE ============
  if (phase === 'profile' && selectedMember) {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <button onClick={() => setPhase('select')} className="text-cl-text/40 hover:text-cl-text text-sm mb-3">&larr; 다른 팀원 선택</button>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{selectedMember.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-cl-navy font-[family-name:var(--font-space)]">{selectedMember.name}</h2>
            <span className="nb-badge text-xs bg-cl-gold/30 text-cl-text">{selectedMember.style}</span>
          </div>
        </div>

        <div className="nb-card p-4 bg-cl-bg mb-4 space-y-2 text-sm">
          <p><span className="text-cl-cyan font-bold">&#127919; 핵심 역량:</span> <span className="text-cl-text/70">{selectedMember.competency}</span></p>
          <p><span className="text-cl-purple font-bold">&#129517; 업무 성향:</span> <span className="text-cl-text/70">{selectedMember.tendency}</span></p>
          <p><span className="text-cl-green font-bold">&#128170; 강점:</span> <span className="text-cl-text/70">{selectedMember.strength}</span></p>
          <p><span className="text-cl-orange font-bold">&#128201; 약점:</span> <span className="text-cl-text/70">{selectedMember.weakness}</span></p>
          <div className="pt-2 mt-2 border-t border-cl-border/20">
            <p><span className="text-cl-red font-bold">&#128163; 숨겨진 진짜 불만:</span></p>
            <p className="text-cl-text/80 font-medium mt-1">{selectedMember.hiddenComplaint}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setPhase('select')} className="nb-btn flex-1 py-3 bg-white text-cl-text text-sm">다른 팀원</button>
          <button onClick={handleConfirm} className="nb-btn flex-1 py-3 bg-cl-navy text-white text-sm">이 팀원과 면담</button>
        </div>
      </div>
    );
  }

  // ============ STEP 3: GOAL ============
  if (phase === 'goal' && selectedMember) {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-3">&#127919; 면담 목표</h2>

        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{selectedMember.icon}</span>
            <span className="font-bold text-cl-navy">{selectedMember.name}</span>
            <span className="nb-badge text-[10px] bg-cl-gold/30 text-cl-text">{selectedMember.style}</span>
          </div>
          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{selectedMember.meetingGoal}</p>
        </div>

        {/* 평가 항목 안내 */}
        <div className="nb-card p-4 mb-5">
          <h3 className="text-sm font-bold text-cl-navy mb-2">&#128202; AI 실시간 평가 항목 (10가지)</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {EVAL_LABELS.map(e => (
              <div key={e.key} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-cl-navy shrink-0" />
                <span className="font-bold text-cl-text">{e.label}</span>
                <span className="text-cl-text/40">{e.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 면담 팁 */}
        <div className="nb-card p-4 bg-cl-navy/5 mb-5">
          <h3 className="text-sm font-bold text-cl-navy mb-2">&#128161; 면담 팁</h3>
          <ul className="text-xs text-cl-text/60 space-y-1 leading-relaxed">
            <li>&bull; 먼저 안부를 물어보세요</li>
            <li>&bull; &ldquo;왜?&rdquo;보다 &ldquo;어떤 마음이었어요?&rdquo;라고 물어보세요</li>
            <li>&bull; 팀원의 감정에 먼저 반응하고, 해결책은 나중에</li>
            <li>&bull; 구체적으로 무엇을 이해했는지 말해주세요</li>
            <li>&bull; 약속은 반드시 지킬 수 있는 것만 하세요</li>
          </ul>
        </div>

        <button onClick={handleStartChat} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#128172; 면담 시작
        </button>
      </div>
    );
  }

  // ============ STEP 4: CHAT ============
  if (phase === 'chat' && selectedMember) {
    return (
      <div className="nb-card rounded-2xl p-0 max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
        {/* Chat Header */}
        <div className="p-4 border-b-3 border-cl-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedMember.icon}</span>
            <div>
              <span className="font-bold text-cl-navy text-sm">{selectedMember.name}</span>
              <span className="text-[10px] text-cl-text/40 ml-2">1:1 면담</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`nb-badge text-xs ${score >= 70 ? 'bg-cl-green text-white border-cl-green' : score >= 40 ? 'bg-cl-gold text-cl-text border-cl-gold' : 'bg-cl-red/20 text-cl-red border-cl-red'}`}>
              &#128202; {score}점
            </div>
            {score >= 70 && (
              <button onClick={handleEndChat} disabled={feedbackLoading} className="nb-btn px-3 py-1.5 bg-cl-green text-white text-xs">
                {feedbackLoading ? '분석중...' : '면담 종료'}
              </button>
            )}
          </div>
        </div>

        {/* Eval Scores Bar */}
        <div className="px-4 py-2 bg-cl-bg border-b border-cl-border/20 shrink-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {EVAL_LABELS.map(e => {
              const val = evalScores[e.key] || 0;
              return (
                <div key={e.key} className="text-center" style={{ minWidth: '52px' }}>
                  <div className="text-[9px] text-cl-text/40 font-bold truncate">{e.label}</div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-0.5">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, background: val >= 70 ? '#4ADE80' : val >= 40 ? '#D4A017' : '#F87171' }} />
                  </div>
                  <div className="text-[8px] font-mono font-bold" style={{ color: val >= 70 ? '#4ADE80' : val >= 40 ? '#D4A017' : '#F87171' }}>{val}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatHistory.length === 0 && (
            <div className="text-center text-cl-text/30 text-sm py-8">
              {selectedMember.name}에게 먼저 말을 건네보세요.
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cl-navy text-white rounded-br-sm'
                  : 'nb-card rounded-bl-sm'
              }`}>
                <div className="text-[10px] font-bold mb-1 opacity-60">
                  {msg.role === 'user' ? 'YOU (팀장)' : `${selectedMember.icon} ${selectedMember.name}`}
                </div>
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="nb-card p-3 rounded-2xl rounded-bl-sm">
                <div className="text-sm text-cl-text/40 animate-pulse">입력 중...</div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t-3 border-cl-border shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="팀장으로서 팀원에게 말해보세요..."
              className="nb-input flex-1 py-2.5 text-sm"
              disabled={sending}
            />
            <button onClick={handleSend} disabled={sending || !userInput.trim()} className="nb-btn px-5 py-2.5 bg-cl-navy text-white text-sm disabled:opacity-40">
              전송
            </button>
          </div>
          {score < 70 && chatHistory.length > 0 && (
            <p className="text-[10px] text-cl-text/30 text-center mt-1.5 font-[family-name:var(--font-mono)]">
              면담 스킬 70점 이상 달성 시 면담을 종료할 수 있습니다
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============ STEP 5: RESULT ============
  return (
    <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">&#127942;</div>
        <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">면담 완료!</h2>
        <p className="text-sm text-cl-text/50">{selectedMember?.icon} {selectedMember?.name}과(와)의 1:1 면담</p>
      </div>

      {/* Score */}
      <div className="nb-card p-4 mb-4 text-center">
        <span className="text-4xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{score}</span>
        <span className="text-cl-text/40 text-lg">/100점</span>
        {feedback && <span className="ml-3 nb-badge bg-cl-gold text-cl-text">{feedback.overallGrade}</span>}
      </div>

      {/* Eval Bars */}
      <div className="nb-card p-4 mb-4">
        <h3 className="text-xs font-bold text-cl-text/60 mb-3">항목별 점수</h3>
        <div className="space-y-1.5">
          {EVAL_LABELS.map(e => {
            const val = evalScores[e.key] || 0;
            return (
              <div key={e.key} className="flex items-center gap-2">
                <span className="text-[11px] text-cl-text/60 font-bold w-16 shrink-0">{e.label}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: val >= 70 ? '#4ADE80' : val >= 40 ? '#D4A017' : '#F87171' }} />
                </div>
                <span className="text-[11px] font-mono font-bold w-8 text-right" style={{ color: val >= 70 ? '#4ADE80' : val >= 40 ? '#D4A017' : '#F87171' }}>{val}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="nb-card p-4 mb-4 bg-cl-bg">
          <p className="text-sm text-cl-text/70 mb-3 leading-relaxed">{feedback.summary}</p>
          {feedback.goodPoints.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-bold text-cl-green">&#128077; 잘한 점</span>
              <ul className="text-xs text-cl-text/60 mt-1 space-y-0.5">{feedback.goodPoints.map((s, i) => <li key={i}>&bull; {s}</li>)}</ul>
            </div>
          )}
          {feedback.improvementPoints.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-bold text-cl-orange">&#128736; 개선 포인트</span>
              <ul className="text-xs text-cl-text/60 mt-1 space-y-0.5">{feedback.improvementPoints.map((s, i) => <li key={i}>&bull; {s}</li>)}</ul>
            </div>
          )}
          {feedback.practicalTips && (
            <div>
              <span className="text-xs font-bold text-cl-navy">&#128161; 실전 팁</span>
              <p className="text-xs text-cl-text/60 mt-1">{feedback.practicalTips}</p>
            </div>
          )}
        </div>
      )}

      <div className="text-center text-cl-text/40 text-xs mb-3">
        미션 점수: <strong className="text-cl-navy text-base">{Math.round(mission.score * (score / 100))}</strong>/{mission.score}점
      </div>

      <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
        NEXT MISSION &rarr;
      </button>
    </div>
  );
}
