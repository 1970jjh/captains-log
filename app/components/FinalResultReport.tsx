'use client';

import React, { useRef, useMemo } from 'react';
import { MISSIONS } from '../constants';

interface TeamRow {
  teamId: number;
  teamName: string;
  currentMonth: number;
  totalScore: number;
  timeBonus: number;
  status: string;
  r1Score?: number; r2Score?: number; r3Score?: number; r4Score?: number;
  r5Score?: number; r6Score?: number; r7Score?: number; r8Score?: number;
  r9Score?: number; r10Score?: number; r11Score?: number; r12Score?: number;
  r1Time?: number; r2Time?: number; r3Time?: number; r4Time?: number;
  r5Time?: number; r6Time?: number; r7Time?: number; r8Time?: number;
  r9Time?: number; r10Time?: number; r11Time?: number; r12Time?: number;
}

interface Props {
  teams: TeamRow[];
  roomId: string;
  onClose: () => void;
}

const TEAM_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899',
  '#3b82f6', '#f97316', '#14b8a6', '#a855f7', '#eab308', '#6366f1',
];

const MAX_TOTAL = 1200;

// 리더십 유형 (6축)
const LEADER_LABELS = ['변혁적', '서번트', '코칭', '민주적', '실행', '소통'];
// 핵심역량 (6축)
const COMPETENCY_LABELS = ['비전/목표', '소통/경청', '동기부여', '의사결정', '인재육성', '변화관리'];

// 미션별 리더십 유형 매핑
const LEADER_MISSION_MAP: Record<number, number[]> = {
  1: [0, 5],      // 취임사 → 변혁적, 소통
  2: [3, 4],      // 팀 진단 → 민주적, 실행
  3: [1, 5],      // 1:1 면담 → 서번트, 소통
  4: [3, 4],      // 업무 배분 → 민주적, 실행
  5: [1, 3],      // 팀빌딩 → 서번트, 민주적
  6: [2, 5],      // 핵심 인재 리텐션 → 코칭, 소통
  7: [2, 1],      // 성과 면담 → 코칭, 서번트
  8: [2, 0],      // 숨은 역량 → 코칭, 변혁적
  9: [4, 5],      // 돌발 위기 → 실행, 소통
  10: [4, 3],     // 조직 재편 → 실행, 민주적
  11: [1, 2, 5],  // AI 코칭 대화 → 서번트, 코칭, 소통
  12: [0, 4],     // 연말 성과보고 → 변혁적, 실행
};

// 미션별 핵심역량 매핑
const COMP_MISSION_MAP: Record<number, number[]> = {
  1: [0, 1],      // 취임사 → 비전/목표, 소통/경청
  2: [3, 0],      // 팀 진단 → 의사결정, 비전/목표
  3: [1, 2],      // 1:1 면담 → 소통/경청, 동기부여
  4: [3, 5],      // 업무 배분 → 의사결정, 변화관리
  5: [2, 1],      // 팀빌딩 → 동기부여, 소통/경청
  6: [2, 4],      // 핵심 인재 → 동기부여, 인재육성
  7: [1, 4],      // 성과 면담 → 소통/경청, 인재육성
  8: [4, 0],      // 숨은 역량 → 인재육성, 비전/목표
  9: [5, 3],      // 돌발 위기 → 변화관리, 의사결정
  10: [5, 3],     // 조직 재편 → 변화관리, 의사결정
  11: [1, 4],     // AI 코칭 → 소통/경청, 인재육성
  12: [0, 5],     // 연말 성과보고 → 비전/목표, 변화관리
};

// 5가지 핵심역량 - 시뮬레이션 체험 매핑
const COMPETENCY_TABLE = [
  {
    competency: '비전과 방향 설정',
    experience: '팀의 목표와 비전을 수립하고, 불확실한 상황에서도 팀원들에게 명확한 방향을 제시하여 조직을 이끌어가는 리더십 역량을 체험',
  },
  {
    competency: '소통과 신뢰 구축',
    experience: '팀원의 이야기에 경청하고, 진심 어린 대화를 통해 상호 신뢰를 쌓으며 심리적 안전감을 만들어가는 소통 리더십을 체험',
  },
  {
    competency: '동기부여와 팀빌딩',
    experience: '팀원의 강점을 발견하고 적재적소에 배치하며, 개인과 팀의 성장을 동시에 이끌어내는 동기부여 역량을 체험',
  },
  {
    competency: '의사결정과 문제해결',
    experience: '불완전한 정보 속에서 신속하고 합리적인 판단을 내리며, 다양한 이해관계를 조율하는 의사결정 역량을 체험',
  },
  {
    competency: '위기관리와 변화관리',
    experience: '예측 불가능한 상황에서 침착하게 대응하고, 조직 변화를 주도적으로 이끌어가는 위기관리 리더십을 체험',
  },
];

// Debriefing Questions (팀 토의 질문)
const DEBRIEFING_QUESTIONS = [
  {
    competency: '비전/방향',
    question: '(비전/방향) 팀장으로서 가장 중요한 첫 마디는 무엇이었나요? 취임사와 목표 설정 과정에서 팀원들의 반응은 어떠했나요? 현업에서 새로운 리더가 팀에 비전을 제시할 때 가장 중요한 것은 무엇일까요?',
  },
  {
    competency: '소통/신뢰',
    question: '(소통/신뢰) 팀원의 말 속에서 진짜 의미를 읽어내야 했던 순간은 언제였나요? 1:1 면담과 성과 면담에서 "듣는 것"과 "공감하며 듣는 것"의 차이를 체감했나요? 현업에서 팀원의 진심을 이끌어내려면 어떤 소통 방식이 필요할까요?',
  },
  {
    competency: '동기부여',
    question: '(동기부여) 팀원의 잠재력을 발견하거나 이탈을 막아야 했을 때, 어떤 접근이 효과적이었나요? 팀빌딩 과정에서 팀원들의 참여도가 달라지는 순간이 있었나요? 현업에서 팀원의 동기를 높이는 가장 강력한 방법은 무엇이라고 생각하나요?',
  },
  {
    competency: '의사결정',
    question: '(의사결정) 정보가 부족한 상황에서 결정을 내려야 했을 때, 우리 팀은 어떤 프로세스를 거쳤나요? 빠른 결정과 신중한 결정 사이에서 어떤 기준으로 판단했나요? 현업에서 리더의 의사결정이 팀에 미치는 영향은 어떤 것이 있을까요?',
  },
  {
    competency: '변화관리',
    question: '(변화관리) 예상치 못한 조직 변화나 위기 상황에서 팀장으로서 가장 먼저 한 행동은 무엇이었나요? 조직 재편과 돌발 상황에서 팀을 안정시키기 위해 어떤 리더십이 필요했나요? 현업에서 변화에 저항하는 팀원을 이끄는 방법은 무엇일까요?',
  },
];

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const formatTimeMMSS = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function FinalResultReport({ teams, roomId, onClose }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => b.totalScore - a.totalScore), [teams]);

  const getScore = (team: TeamRow, round: number): number | undefined => {
    const key = `r${round}Score` as keyof TeamRow;
    const val = team[key];
    if (val === undefined || val === null || String(val) === '') return undefined;
    return Number(val);
  };

  const getTime = (team: TeamRow, round: number): number | undefined => {
    const key = `r${round}Time` as keyof TeamRow;
    const val = team[key];
    if (val === undefined || val === null || String(val) === '') return undefined;
    return Number(val);
  };

  const getTotalTime = (team: TeamRow): number => {
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      const t = getTime(team, i);
      if (t) total += t;
    }
    return total;
  };

  // Compute radar data - Leadership Type
  const computeLeaderRadar = (team: TeamRow): number[] => {
    const values = new Array(LEADER_LABELS.length).fill(0);
    const counts = new Array(LEADER_LABELS.length).fill(0);
    for (let r = 1; r <= 12; r++) {
      const score = getScore(team, r);
      if (score === undefined) continue;
      const ratio = score / MISSIONS[r - 1].score;
      const indices = LEADER_MISSION_MAP[r] || [];
      for (const idx of indices) {
        values[idx] += ratio;
        counts[idx] += 1;
      }
    }
    return values.map((v, i) => counts[i] > 0 ? Math.min(v / counts[i], 1) : 0.1);
  };

  // Compute radar data - Core Competency
  const computeCompRadar = (team: TeamRow): number[] => {
    const values = new Array(COMPETENCY_LABELS.length).fill(0);
    const counts = new Array(COMPETENCY_LABELS.length).fill(0);
    for (let r = 1; r <= 12; r++) {
      const score = getScore(team, r);
      if (score === undefined) continue;
      const ratio = score / MISSIONS[r - 1].score;
      const compIndices = COMP_MISSION_MAP[r] || [];
      for (const idx of compIndices) {
        values[idx] += ratio;
        counts[idx] += 1;
      }
    }
    return values.map((v, i) => counts[i] > 0 ? Math.min(v / counts[i], 1) : 0.1);
  };

  // Generate team analysis text (leadership context)
  const generateTeamAnalysis = (team: TeamRow, rank: number): string => {
    const totalTime = getTotalTime(team);
    const scores: { round: number; score: number; ratio: number }[] = [];
    for (let r = 1; r <= 12; r++) {
      const s = getScore(team, r);
      if (s !== undefined) {
        scores.push({ round: r, score: s, ratio: s / MISSIONS[r - 1].score });
      }
    }
    const sortedScores = [...scores].sort((a, b) => b.ratio - a.ratio);
    const best = sortedScores[0];
    const second = sortedScores[1];
    const worst = [...scores].sort((a, b) => a.ratio - b.ratio)[0];
    const avgRatio = scores.length > 0 ? scores.reduce((s, x) => s + x.ratio, 0) / scores.length : 0;
    const completedCount = scores.length;

    const teamName = team.teamName || `Team ${team.teamId}`;
    const bestMission = best ? MISSIONS[best.round - 1] : null;
    const secondMission = second ? MISSIONS[second.round - 1] : null;
    const worstMission = worst ? MISSIONS[worst.round - 1] : null;

    let text = `${rank}조 ${teamName}은(는) `;

    // 전반적 평가
    if (avgRatio >= 0.85) {
      text += `전체적으로 매우 우수한 리더십 성과를 보여주었습니다. 평균 수행률 ${Math.round(avgRatio * 100)}%를 기록하며 12개월의 리더십 여정에서 고른 역량을 발휘했습니다. `;
    } else if (avgRatio >= 0.7) {
      text += `안정적이고 균형 잡힌 리더십 역량을 보여주었습니다. 전체 ${completedCount}개 미션에서 평균 ${Math.round(avgRatio * 100)}%의 수행률을 기록하며 꾸준한 성장을 보여주었습니다. `;
    } else if (avgRatio >= 0.5) {
      text += `꾸준한 노력과 함께 리더로서의 성장 가능성을 보여주었습니다. `;
    } else {
      text += `도전적인 리더십 상황들에서 다양한 시도를 통해 학습의 기회를 만들어갔습니다. `;
    }

    // 강점 미션 분석
    if (bestMission) {
      text += `특히 ${bestMission.month} '${bestMission.title}' 미션에서 ${best.score}/${bestMission.score}점으로 뛰어난 리더십을 발휘했으며, `;
      if (best.round <= 3) {
        text += `이는 팀의 비전 제시와 신뢰 구축 역량이 강하다는 것을 의미합니다. `;
      } else if (best.round <= 6) {
        text += `이는 팀원 관리와 동기부여 역량이 돋보인다는 의미입니다. `;
      } else if (best.round <= 9) {
        text += `이는 코칭과 위기대응 리더십이 탁월하다는 의미입니다. `;
      } else {
        text += `이는 종합적 리더십 역량과 변화관리 능력이 뛰어나다는 것을 보여줍니다. `;
      }
    }

    if (secondMission && second.round !== best?.round) {
      text += `또한 ${secondMission.month} '${secondMission.title}'에서도 ${second.score}점을 기록하며 다방면의 리더십 역량을 입증했습니다. `;
    }

    // 약점 분석 + 교육적 조언
    if (worstMission && worst.round !== best?.round) {
      text += `반면, ${worstMission.month} '${worstMission.title}' 미션(${worst.score}/${worstMission.score}점)은 향후 보완이 필요한 영역입니다. `;
      if (worst.round === 7 || worst.round === 11) {
        text += `현업에서 팀원과의 깊이 있는 코칭 대화 역량을 강화한다면 더 큰 성과를 거둘 수 있을 것입니다. `;
      } else if (worst.round === 9 || worst.round === 10) {
        text += `위기 상황에서의 침착한 판단력과 조직 재편 역량을 키운다면 실무에서도 차별화된 리더십을 발휘할 수 있습니다. `;
      } else {
        text += `해당 역량은 반복적인 리더십 경험과 피드백을 통해 빠르게 성장할 수 있는 영역입니다. `;
      }
    }

    // 시간 효율성
    text += `총 소요시간 ${formatTimeMMSS(totalTime)}으로 `;
    if (team.timeBonus > 0) {
      text += `시간 보너스 +${team.timeBonus}점을 획득하여 효율적인 의사결정력을 증명했습니다. 이는 리더로서 빠른 상황 판단과 팀원 간 원활한 역할 분담이 이루어졌음을 시사합니다.`;
    } else {
      text += `미션을 완수했습니다. 향후 시간 관리와 우선순위 설정 역량을 강화하면 더 높은 리더십 성과를 달성할 수 있을 것입니다.`;
    }

    return text;
  };

  // Per-round average times
  const avgTimes = MISSIONS.map((_, i) => {
    const times = sortedTeams.map(t => getTime(t, i + 1)).filter(t => t !== undefined) as number[];
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  });

  const maxAvgTime = Math.max(...avgTimes, 1);
  const allTotalTimes = sortedTeams.map(t => getTotalTime(t)).filter(t => t > 0);
  const avgTotalTime = allTotalTimes.length > 0 ? Math.round(allTotalTimes.reduce((a, b) => a + b, 0) / allTotalTimes.length) : 0;
  const minTotalTime = allTotalTimes.length > 0 ? Math.min(...allTotalTimes) : 0;
  const maxTotalTime = allTotalTimes.length > 0 ? Math.max(...allTotalTimes) : 0;

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  // Download as HTML
  const handleDownloadHTML = () => {
    if (!reportRef.current) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 리더십 종합 분석 리포트 - ${roomId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; background: #0a0a1a; color: #fff; }
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700;900&display=swap');
</style>
</head>
<body>
${reportRef.current.outerHTML}
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `리더십보고서_${roomId}_${dateStr}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 overflow-y-auto" style={{ paddingTop: 0 }}>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6 sticky top-0 z-[10000] bg-white py-4 -mx-4 px-4 border-b-3 border-nb-border shadow-[0_4px_0_#1A1A1A]">
          <h1 className="text-xl font-black text-nb-text font-[family-name:var(--font-space)]">
            AI LEADERSHIP REPORT
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadHTML}
              className="nb-btn px-4 py-2 bg-nb-green text-nb-text text-sm"
            >
              HTML DOWNLOAD
            </button>
            <button
              onClick={onClose}
              className="nb-btn px-4 py-2 bg-white text-nb-text text-sm"
            >
              CLOSE
            </button>
          </div>
        </div>

        <div ref={reportRef} style={{ background: '#ffffff', color: '#333', borderRadius: '16px', overflow: 'hidden' }}>
          {/* ===== HEADER (Navy/Gold theme) ===== */}
          <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #0f2a4a, #1a3050)', padding: '48px 40px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#D4A017', marginBottom: '8px', letterSpacing: '2px' }}>
              AI 리더십 종합 분석 리포트
            </h1>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>{roomId} | {dateStr}</p>
          </div>

          {/* ===== TIME STATS ===== */}
          <div style={{ display: 'flex', borderBottom: '2px solid #eee' }}>
            <div style={{ flex: 1, padding: '24px', textAlign: 'center', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>평균 소요시간</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#D4A017' }}>{formatTimeMMSS(avgTotalTime)}</div>
            </div>
            <div style={{ flex: 1, padding: '24px', textAlign: 'center', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>최단 기록</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#10b981' }}>{formatTimeMMSS(minTotalTime)}</div>
            </div>
            <div style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>최장 기록</div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#ef4444' }}>{formatTimeMMSS(maxTotalTime)}</div>
            </div>
          </div>

          {/* ===== ROUND AVG TIME BAR CHART (2x6 grid) ===== */}
          <div style={{ padding: '32px 40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#D4A017' }}>&#128202;</span> 월별 평균 소요시간
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
              {MISSIONS.map((m, i) => {
                const pct = maxAvgTime > 0 ? (avgTimes[i] / maxAvgTime) * 100 : 0;
                const hue = pct > 70 ? 0 : pct > 40 ? 30 : 120;
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '100px', fontWeight: 700, fontSize: '13px', color: '#555', textAlign: 'left', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      R{m.id}: {m.title.length > 6 ? m.title.substring(0, 6) : m.title}
                    </span>
                    <div style={{ flex: 1, height: '22px', background: '#f5f5f5', borderRadius: '11px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(pct, 3)}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, hsl(${hue}, 80%, 65%), hsl(${hue}, 80%, 50%))`,
                        borderRadius: '11px',
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <span style={{ width: '52px', fontSize: '13px', fontWeight: 700, color: `hsl(${hue}, 70%, 40%)`, fontFamily: 'monospace', textAlign: 'right', flexShrink: 0 }}>
                      {formatTimeMMSS(avgTimes[i])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== TEAM SECTIONS ===== */}
          {sortedTeams.map((team, idx) => {
            const leaderData = computeLeaderRadar(team);
            const compData = computeCompRadar(team);
            const analysis = generateTeamAnalysis(team, idx + 1);
            const color = TEAM_COLORS[team.teamId % TEAM_COLORS.length];

            return (
              <div key={team.teamId} style={{ padding: '32px 40px', borderTop: '2px solid #eee' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '32px', background: color, borderRadius: '4px' }} />
                  {idx + 1}조 &middot; {team.teamName || `Team ${team.teamId}`}
                  <span style={{ fontSize: '14px', color: '#888', fontWeight: 400, marginLeft: '12px' }}>
                    {team.totalScore}pts (Bonus: +{team.timeBonus})
                  </span>
                </h3>

                {/* Two radar charts side by side */}
                <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', justifyContent: 'center' }}>
                  <div style={{ flex: 1, maxWidth: '420px' }}>
                    <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#555', marginBottom: '8px' }}>리더십 유형</div>
                    <RadarChart labels={LEADER_LABELS} values={leaderData} color={color} size={320} />
                  </div>
                  <div style={{ flex: 1, maxWidth: '420px' }}>
                    <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 700, color: '#555', marginBottom: '8px' }}>핵심역량</div>
                    <RadarChart labels={COMPETENCY_LABELS} values={compData} color={color} size={320} />
                  </div>
                </div>

                {/* Analysis text */}
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#444', padding: '16px 20px', background: '#f9f9f9', borderRadius: '12px', borderLeft: `4px solid ${color}` }}>
                  {analysis}
                </p>
              </div>
            );
          })}

          {/* ===== 종합평가 ===== */}
          <div style={{ padding: '40px', borderTop: '3px solid #eee', background: '#fafafa' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#1E3A5F' }}>&#128220;</span> 종합평가
            </h2>
            <p style={{ fontSize: '17px', lineHeight: '2', color: '#444' }}>
              이번 {roomId} 교육에서 총 {sortedTeams.length}개 팀이 12개월의 리더십 시뮬레이션을 수행했습니다.
              전체 평균 소요시간은 {formatTimeMMSS(avgTotalTime)}이며,
              {sortedTeams[0] && ` 1위 ${sortedTeams[0].teamName || `Team ${sortedTeams[0].teamId}`}(${sortedTeams[0].totalScore}점)이 가장 우수한 리더십 성과를 달성했습니다.`}
              {' '}각 팀은 취임사 작성, 팀 진단, 1:1 면담, 업무 배분, 팀빌딩, 핵심 인재 리텐션, 성과 면담, 숨은 역량 발견, 위기 대응, 조직 재편, AI 코칭 대화, 연말 성과보고 등
              신임 팀장의 12개월 리더십 여정에 필요한 핵심 역량을 체험하며 성장의 여정을 완수했습니다.
            </p>
            <p style={{ fontSize: '17px', lineHeight: '2', color: '#444', marginTop: '16px' }}>
              이 시뮬레이션은 신임 팀장의 1년 리더십을 3단계 구조(신뢰 구축기 &rarr; 역량 발휘기 &rarr; 성과 도약기)로 체험하게 하는 프로그램입니다.
              기업교육 측면에서 다음과 같은 핵심 리더십 역량을 훈련할 수 있습니다:
            </p>

            {/* 역량 영역 - 시뮬레이션 체험 테이블 */}
            <table style={{ width: '100%', marginTop: '24px', borderCollapse: 'collapse', fontSize: '16px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 20px', background: '#1E3A5F', color: '#fff', fontWeight: 700, width: '200px', borderRadius: '8px 0 0 0' }}>역량 영역</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', background: '#1E3A5F', color: '#fff', fontWeight: 700, borderRadius: '0 8px 0 0' }}>시뮬레이션에서의 체험</th>
                </tr>
              </thead>
              <tbody>
                {COMPETENCY_TABLE.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#D4A017', fontSize: '16px', verticalAlign: 'top' }}>{row.competency}</td>
                    <td style={{ padding: '16px 20px', color: '#555', lineHeight: '1.7', fontSize: '15px' }}>{row.experience}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== Debriefing Questions ===== */}
          <div style={{ padding: '40px', borderTop: '2px solid #eee' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#D4A017' }}>&#128172;</span> Debriefing Questions (팀 토의 질문)
            </h2>
            <p style={{ fontSize: '16px', color: '#888', marginBottom: '24px', lineHeight: '1.6' }}>
              리더십 시뮬레이션 경험을 실무와 연결하여 팀원들과 함께 토의해 보세요.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {DEBRIEFING_QUESTIONS.map((topic, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '20px 24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${['#1E3A5F', '#D4A017', '#1E3A5F', '#D4A017', '#1E3A5F'][i]}, ${['#D4A017', '#1E3A5F', '#D4A017', '#1E3A5F', '#D4A017'][i]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: '16px',
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#333', flex: 1 }}>
                    {topic.question}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div style={{ padding: '24px 40px', background: '#f5f5f5', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#aaa' }}>
              CAPTAIN&apos;S LOG | AI 리더십 종합 분석 리포트 | {dateStr} | Generated by MISSION CONTROL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SVG Radar Chart =====
function RadarChart({ labels, values, color, size }: { labels: string[]; values: number[]; color: string; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const n = labels.length;
  const levels = 5;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = radius * value;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid
  const gridPaths = Array.from({ length: levels }, (_, l) => {
    const levelValue = (l + 1) / levels;
    const points = Array.from({ length: n }, (_, i) => {
      const p = getPoint(i, levelValue);
      return `${p.x},${p.y}`;
    });
    return `M${points.join('L')}Z`;
  });

  // Axis lines
  const axisLines = Array.from({ length: n }, (_, i) => {
    const p = getPoint(i, 1);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  });

  // Data polygon
  const dataPoints = values.map((v, i) => {
    const p = getPoint(i, v);
    return `${p.x},${p.y}`;
  });
  const dataPath = `M${dataPoints.join('L')}Z`;

  // Label positions
  const labelPositions = labels.map((label, i) => {
    const p = getPoint(i, 1.18);
    return { label, x: p.x, y: p.y };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: `${size}px`, margin: '0 auto', display: 'block' }}>
      {/* Grid */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#ddd" strokeWidth="1" />
      ))}
      {/* Axes */}
      {axisLines.map((line, i) => (
        <line key={i} {...line} stroke="#ddd" strokeWidth="1" />
      ))}
      {/* Data area */}
      <path d={dataPath} fill={`${color}30`} stroke={color} strokeWidth="2.5" />
      {/* Data dots */}
      {values.map((v, i) => {
        const p = getPoint(i, v);
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} />;
      })}
      {/* Labels with values */}
      {labelPositions.map((lp, i) => (
        <g key={i}>
          <text
            x={lp.x}
            y={lp.y - size * 0.022}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: `${size * 0.038}px`, fill: '#666', fontWeight: 600 }}
          >
            {lp.label}
          </text>
          <text
            x={lp.x}
            y={lp.y + size * 0.028}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: `${size * 0.034}px`, fill: color, fontWeight: 700 }}
          >
            {Math.round(values[i] * 100)}%
          </text>
        </g>
      ))}
    </svg>
  );
}
