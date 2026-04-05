'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { R2_STORY, R2_IMAGE, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

interface TeamMemberData {
  id: number;
  name: string;
  style: string;
  icon: string;
}

interface DescriptionData {
  id: number;
  text: string;
  competency: string;
  tendency: string;
  strength: string;
  weakness: string;
  hiddenComplaint: string;
}

const TEAM_MEMBERS: TeamMemberData[] = [
  { id: 1, name: '박태호 수석', style: '방어적', icon: '\uD83D\uDEE1\uFE0F' },
  { id: 2, name: '이수아 사원', style: '수동적', icon: '\uD83D\uDC40' },
  { id: 3, name: '김윤진 선임', style: '과부하', icon: '\uD83D\uDD25' },
  { id: 4, name: '최지훈 대리', style: '회의적', icon: '\uD83D\uDE12' },
  { id: 5, name: '정민우 주임', style: '고립형', icon: '\uD83E\uDDF1' },
];

const DESCRIPTIONS: DescriptionData[] = [
  {
    id: 1,
    text: '과거의 성공 경험과 방식에 갇혀 새로운 변화나 지시를 자신에 대한 공격으로 받아들이며, 늘 "그건 안 돼"라는 말을 방패로 씁니다.',
    competency: '프로젝트 위기 관리, 레거시 시스템 완벽 이해 및 도메인 전문성',
    tendency: '안정성 추구, 검증된 절차와 매뉴얼 중시',
    strength: '조직 내 폭넓은 업무 네트워크, 신중한 의사결정',
    weakness: '새로운 기술 및 트렌드 수용 거부, 유연성 부족',
    hiddenComplaint: '잦은 조직 개편과 사내 정치 속에서 자신의 15년 노하우가 낡은 것으로 치부되고 무시당한다는 깊은 소외감과 피로감',
  },
  {
    id: 2,
    text: '실패에 대한 두려움 때문에 스스로 결정하는 것을 극도로 꺼리며, 명확하고 세세한 가이드라인이 주어지지 않으면 한 발짝도 움직이지 못합니다.',
    competency: '지시받은 업무에 대한 완벽하고 정확한 처리 능력, 꼼꼼한 문서화',
    tendency: '의존적, 지시 기반의 수직적 상명하복 선호',
    strength: '높은 책임감과 성실함, 오차 없는 디테일',
    weakness: '주도성 부족, 문제 발생 시 스스로 해결 시도 회피',
    hiddenComplaint: '이전 부서에서 겪은 실수에 대한 가혹한 징계 트라우마. "아무도 날 보호해주지 않으니 책임질 일은 절대 만들지 않겠다"는 리더십에 대한 불신',
  },
  {
    id: 3,
    text: '뛰어난 업무 능력과 강한 책임감 때문에 타인의 일까지 떠안고 거절하지 못해, 조용히 번아웃에 빠져 퇴사를 준비하고 있습니다.',
    competency: '높은 수준의 실무 스킬, 다중 프로젝트 동시 처리 능력',
    tendency: '완벽주의, 팀의 구원투수를 자처하는 희생형',
    strength: '뛰어난 이타심, 팀을 위한 헌신과 강한 책임감',
    weakness: '거절하지 못함, 자신의 컨디션 관리 실패 (번아웃 고위험군)',
    hiddenComplaint: '무능하거나 태만한 동료들의 몫까지 감당해야 하는 불공정한 업무 분배 구조와, 이를 알면서도 방관하는 회사의 시스템에 대한 깊은 실망',
  },
  {
    id: 4,
    text: '잦은 부서 이동과 리더의 교체로 인해 조직에 대한 신뢰를 완전히 잃었으며, 상처받지 않기 위해 냉소적인 태도로 팀 분위기를 겉돌고 있습니다.',
    competency: '데이터 기반 논리적 분석, 잠재적 리스크 도출 및 방어 논리 구축',
    tendency: '비판적, 데이터와 논리를 기반으로 한 방어적 사고',
    strength: '날카로운 인사이트, 객관적인 시각 유지',
    weakness: '팀 사기 저하 유발, 대안 없는 비판으로 회의 시간 지연',
    hiddenComplaint: '과거 주도하던 핵심 프로젝트가 일방적으로 드랍된 것에 대한 상실감. "어차피 또 리더가 바뀌면 엎어질 텐데 열심히 할 필요 없다"는 짙은 허무함',
  },
  {
    id: 5,
    text: '자신의 개인적인 성과와 전문성 향상에만 관심이 있을 뿐, 팀의 공통 목표나 동료들과의 협업에는 철저히 선을 긋고 소통을 차단합니다.',
    competency: '최신 기술 스택 활용, 압도적으로 빠른 단기 업무 처리 속도',
    tendency: '독고다이, 철저한 개인 성과 및 효율주의',
    strength: '탁월한 자기 주도 학습 능력, 목표 달성을 위한 무서운 집중력',
    weakness: '협업 절대 불가, 정보 독점, 팀워크 파괴의 주범',
    hiddenComplaint: '타 팀에서 정치적 마찰로 밀려났다는 억울함. 현재 팀원들의 업무 수준이 낮아 자신의 커리어 발전에 방해만 된다는 오만함 섞인 불만',
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function R2DiagnosisGame({ onComplete, onBack, startTime }: Props) {
  const [shuffledDescs, setShuffledDescs] = useState<DescriptionData[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<number, number>>({});
  const [errorIds, setErrorIds] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const mission = MISSIONS[1];

  const resetBoard = useCallback(() => {
    setShuffledDescs(shuffleArray(DESCRIPTIONS));
    setSelectedMemberId(null);
    setMatchedPairs({});
    setErrorIds([]);
    setConsecutiveErrors(0);
    setShowReset(false);
  }, []);

  useEffect(() => {
    resetBoard();
  }, [resetBoard]);

  useEffect(() => {
    if (Object.keys(matchedPairs).length === TEAM_MEMBERS.length) {
      setTimeout(() => setIsCompleted(true), 500);
    }
  }, [matchedPairs]);

  const handleMemberClick = (id: number) => {
    if (matchedPairs[id] || showReset) return;
    setSelectedMemberId(id === selectedMemberId ? null : id);
    setErrorIds([]);
  };

  const handleDescriptionClick = (descId: number) => {
    if (!selectedMemberId || Object.values(matchedPairs).includes(descId) || showReset) return;

    if (selectedMemberId === descId) {
      // Correct
      setMatchedPairs(prev => ({ ...prev, [selectedMemberId]: descId }));
      setSelectedMemberId(null);
      setErrorIds([]);
      setConsecutiveErrors(0);
    } else {
      // Wrong
      setErrorIds([selectedMemberId, descId]);
      setMistakes(prev => prev + 1);
      const newConsecutive = consecutiveErrors + 1;
      setConsecutiveErrors(newConsecutive);

      setTimeout(() => {
        setErrorIds([]);
        if (newConsecutive >= 2) {
          setShowReset(true);
        }
      }, 800);
      setSelectedMemberId(null);
    }
  };

  const handleForceReset = () => {
    resetBoard();
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const penalty = mistakes * 5;
    const finalScore = Math.max(Math.round(mission.score * 0.3), mission.score - penalty);
    onComplete(finalScore, elapsed);
  };

  const matchedCount = Object.keys(matchedPairs).length;

  return (
    <div className="nb-card rounded-2xl p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr; BACK</button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cl-red font-[family-name:var(--font-mono)] font-bold">
            &times; {mistakes}회 오답
          </span>
          <span className="nb-badge bg-cl-navy text-white text-[10px]">
            {matchedCount}/5 매칭
          </span>
          <span className="text-xs text-cl-navy font-[family-name:var(--font-mono)]">
            배점: {mission.score}점
          </span>
        </div>
      </div>

      <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-2">
        {mission.month}: {mission.title}
      </h2>

      {!isCompleted ? (
        <>
          {/* Story */}
          <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R2_STORY}</p>

          {/* Mission Image */}
          <div className="nb-card p-2 mb-4">
            <img src={R2_IMAGE} alt="팀 진단 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
          </div>

          {/* Reset Warning */}
          {showReset && (
            <div className="mb-4 nb-card p-4 bg-cl-red/10 border-cl-red text-center animate-bounce-in">
              <p className="text-sm text-cl-red font-bold mb-2">&#9888; 연속 2회 오답! 매칭을 처음부터 다시 시작합니다.</p>
              <p className="text-xs text-cl-text/40 mb-3">순서가 다시 섞입니다. 신중하게 선택하세요!</p>
              <button onClick={handleForceReset} className="nb-btn px-6 py-2 bg-cl-red text-white text-sm">
                다시 시작
              </button>
            </div>
          )}

          {/* Instruction */}
          <p className="text-xs text-cl-text/40 text-center mb-4 font-[family-name:var(--font-mono)]">
            &#9757; 왼쪽에서 팀원을 먼저 선택 &rarr; 오른쪽에서 알맞은 설명을 클릭 &nbsp;|&nbsp; 연속 2회 오답 시 리셋 &nbsp;|&nbsp; 오답 1회당 -5점
          </p>

          {/* Game Board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left: Team Members */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-cl-text/60 mb-2">&#128100; 팀원 (표면적 스타일)</h3>
              {TEAM_MEMBERS.map(member => {
                const isMatched = !!matchedPairs[member.id];
                const isSelected = selectedMemberId === member.id;
                const isError = errorIds.includes(member.id);

                return (
                  <button
                    key={member.id}
                    onClick={() => handleMemberClick(member.id)}
                    disabled={isMatched}
                    className={`w-full p-3 rounded-xl border-3 text-left transition-all flex items-center justify-between ${
                      isMatched ? 'bg-cl-green/10 border-cl-green opacity-50 cursor-not-allowed' :
                      isSelected ? 'bg-cl-navy/10 border-cl-navy shadow-[4px_4px_0px_#1E3A5F] -translate-x-0.5 -translate-y-0.5' :
                      isError ? 'bg-cl-red/10 border-cl-red animate-shake' :
                      'bg-white border-cl-border hover:border-cl-navy/50 hover:bg-cl-navy/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{member.icon}</span>
                      <span className="font-bold text-cl-text text-sm">{member.name}</span>
                    </div>
                    <span className={`nb-badge text-[10px] ${
                      isMatched ? 'bg-cl-green/20 text-cl-green border-cl-green' :
                      isSelected ? 'bg-cl-navy text-white border-cl-navy' :
                      'bg-gray-100 text-cl-text/60'
                    }`}>
                      {isMatched ? '\u2713 매칭됨' : member.style}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Descriptions */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-cl-text/60 mb-2">&#128196; 이면의 단서 (진짜 문제)</h3>
              {shuffledDescs.map(desc => {
                const isMatched = Object.values(matchedPairs).includes(desc.id);
                const isError = errorIds.includes(desc.id);
                const isClickable = !!selectedMemberId && !isMatched;

                return (
                  <button
                    key={desc.id}
                    onClick={() => handleDescriptionClick(desc.id)}
                    disabled={isMatched || !selectedMemberId}
                    className={`w-full p-4 rounded-xl border-3 text-left transition-all ${
                      isMatched ? 'bg-cl-green/10 border-cl-green opacity-50 cursor-not-allowed' :
                      isError ? 'bg-cl-red/10 border-cl-red animate-shake' :
                      isClickable ? 'bg-white border-cl-navy/30 hover:bg-cl-navy/5 hover:border-cl-navy cursor-pointer' :
                      'bg-gray-50 border-cl-border/30 cursor-default opacity-70'
                    }`}
                  >
                    <p className={`text-sm leading-relaxed mb-3 font-medium ${isMatched ? 'text-cl-text/40' : 'text-cl-text/80'}`}>
                      &ldquo;{desc.text}&rdquo;
                    </p>
                    <div className="text-[11px] space-y-1 p-2.5 rounded-lg bg-cl-bg border border-cl-border/20">
                      <p><span className="text-cl-cyan font-bold">&#127919; 역량:</span> <span className="text-cl-text/60">{desc.competency}</span></p>
                      <p><span className="text-cl-purple font-bold">&#129517; 성향:</span> <span className="text-cl-text/60">{desc.tendency}</span></p>
                      <p><span className="text-cl-green font-bold">&#128170; 강점:</span> <span className="text-cl-text/60">{desc.strength}</span></p>
                      <p><span className="text-cl-orange font-bold">&#128201; 개선:</span> <span className="text-cl-text/60">{desc.weakness}</span></p>
                      <p className="pt-1 mt-1 border-t border-cl-border/20">
                        <span className="text-cl-red font-bold">&#128163; 숨겨진 불만:</span> <span className="text-cl-text/70 font-medium">{desc.hiddenComplaint}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* ===== CLEAR SCREEN ===== */
        <div className="text-center py-8">
          <div className="text-5xl mb-3">&#128275;</div>
          <div className="text-2xl font-black text-cl-green mb-3 font-[family-name:var(--font-space)]">
            &#128274; &#8594; &#128275; 암호 해독 완료!
          </div>
          <p className="text-sm text-cl-text/60 mb-6 max-w-lg mx-auto leading-relaxed">
            훌륭합니다, 팀장님. 우리 팀의 진짜 문제는 단순한 태도 불량이 아니라
            과거의 상처, 번아웃, 그리고 불안감이었습니다.
            이제 이 진단을 바탕으로 어떻게 처방을 내릴지 고민할 차례입니다.
          </p>

          {/* Score Summary */}
          <div className="nb-card p-4 max-w-sm mx-auto mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-cl-text/60">오답 횟수</span>
              <span className="font-black text-cl-red font-[family-name:var(--font-mono)]">{mistakes}회</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-cl-text/60">감점 (-5점 &times; {mistakes})</span>
              <span className="font-black text-cl-orange font-[family-name:var(--font-mono)]">-{mistakes * 5}점</span>
            </div>
            <div className="border-t-2 border-cl-border/20 pt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-cl-text">최종 점수</span>
              <span className="text-2xl font-black text-cl-navy font-[family-name:var(--font-mono)]">
                {Math.max(Math.round(mission.score * 0.3), mission.score - mistakes * 5)}/{mission.score}
              </span>
            </div>
            {mistakes === 0 && (
              <div className="mt-2 nb-badge bg-cl-gold text-cl-text border-cl-gold w-full text-center py-1 text-xs">
                &#127775; PERFECT! 한 번도 틀리지 않았습니다!
              </div>
            )}
          </div>

          <button onClick={handleClear} className="nb-btn px-8 py-3 bg-cl-navy text-white text-sm">
            NEXT MISSION &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
