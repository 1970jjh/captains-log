'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EVENTS, MISSIONS } from '../constants';
import { gasService } from '../lib/gasService';
import { EventType, IndustryType, IndustryTypeLabels } from '../types';
import FinalResultReport from './FinalResultReport';

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
}

interface MissionDataItem {
  teamId: number;
  month: number;
  dataJson: string;
  timestamp: string;
}

interface TeamAsset {
  teamId: number;
  photoUrl: string;
  infographicUrl: string;
}

interface Props {
  onBack: () => void;
  industryType: IndustryType;
  onIndustryTypeChange: (type: IndustryType) => void;
}

const TEAM_COLORS = [
  '#3B82F6', '#A78BFA', '#FB923C', '#F87171', '#4ADE80', '#F472B6',
  '#22D3EE', '#FDE047', '#14b8a6', '#a855f7', '#eab308', '#6366f1',
  '#22d3ee', '#e879f9', '#34d399', '#fb923c', '#a3e635', '#f472b6',
  '#2dd4bf', '#c084fc', '#fbbf24', '#f87171', '#4ade80', '#f472b6',
  '#38bdf8', '#a78bfa', '#facc15', '#fb7185', '#86efac', '#f9a8d4',
];

const MAX_TOTAL = 1200;

export default function AdminDashboard({ onBack, industryType, onIndustryTypeChange }: Props) {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(90);
  const [activeEventType, setActiveEventType] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<TeamRow | null>(null);
  const [roomId, setRoomId] = useState(''); // 활성화된 방 (빈 문자열 = 아직 선택 안 됨)
  const [newRoomName, setNewRoomName] = useState(''); // 새 방 이름 입력용
  const [eventTarget, setEventTarget] = useState<string>('all');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [eventTimerInput, setEventTimerInput] = useState<number>(0);
  const [eventRemaining, setEventRemaining] = useState<number>(0);
  const [roomList, setRoomList] = useState<string[]>([]);
  const [detailTeam, setDetailTeam] = useState<TeamRow | null>(null);
  const [detailData, setDetailData] = useState<MissionDataItem[]>([]);
  const [detailAssets, setDetailAssets] = useState<TeamAsset | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMonth, setDetailMonth] = useState<number>(1);

  // roomId가 설정된 경우에만 데이터 fetch (빈 문자열이면 fetch 안 함)
  const fetchData = useCallback(async () => {
    if (!roomId) { setLoading(false); return; }
    try {
      const [teamsResult, stateResult] = await Promise.all([
        gasService.getAllTeams(roomId),
        gasService.getGameState(roomId),
      ]);
      if (teamsResult.success && teamsResult.data) {
        const raw = teamsResult.data as unknown as Record<string, unknown>[];
        if (Array.isArray(raw)) {
          const parsed: TeamRow[] = raw.map(r => ({
            teamId: Number(r.teamId) || 0,
            teamName: String(r.teamName || ''),
            currentMonth: Number(r.currentMonth) || 1,
            totalScore: Number(r.totalScore) || 0,
            timeBonus: Number(r.timeBonus) || 0,
            status: String(r.status || 'playing'),
            r1Score: r.r1Score !== '' && r.r1Score != null ? Number(r.r1Score) : undefined,
            r2Score: r.r2Score !== '' && r.r2Score != null ? Number(r.r2Score) : undefined,
            r3Score: r.r3Score !== '' && r.r3Score != null ? Number(r.r3Score) : undefined,
            r4Score: r.r4Score !== '' && r.r4Score != null ? Number(r.r4Score) : undefined,
            r5Score: r.r5Score !== '' && r.r5Score != null ? Number(r.r5Score) : undefined,
            r6Score: r.r6Score !== '' && r.r6Score != null ? Number(r.r6Score) : undefined,
            r7Score: r.r7Score !== '' && r.r7Score != null ? Number(r.r7Score) : undefined,
            r8Score: r.r8Score !== '' && r.r8Score != null ? Number(r.r8Score) : undefined,
            r9Score: r.r9Score !== '' && r.r9Score != null ? Number(r.r9Score) : undefined,
            r10Score: r.r10Score !== '' && r.r10Score != null ? Number(r.r10Score) : undefined,
            r11Score: r.r11Score !== '' && r.r11Score != null ? Number(r.r11Score) : undefined,
            r12Score: r.r12Score !== '' && r.r12Score != null ? Number(r.r12Score) : undefined,
          }));
          setTeams(parsed);
        }
      }
      if (stateResult.success && stateResult.data) {
        const state = stateResult.data as unknown as { gameStarted: boolean; createdAt?: string };
        setGameStarted(state.gameStarted || false);
        if (state.createdAt) setGameStartTime(state.createdAt);
      }
    } catch {
      // fetch failure
    }
    setLoading(false);
  }, [roomId]);

  const fetchRoomList = useCallback(async () => {
    try {
      const result = await gasService.listRooms();
      if (result.success && result.data && Array.isArray(result.data)) {
        const raw = result.data as unknown[];
        const roomIds: string[] = raw.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'roomId' in item) return String((item as { roomId: string }).roomId);
          return '';
        }).filter(Boolean);
        setRoomList([...new Set(roomIds)]);
      }
    } catch {
      // non-critical
    }
  }, []);

  // 첫 로드: 방 목록 불러오고, 방이 있으면 첫 번째 자동 선택
  useEffect(() => {
    const init = async () => {
      try {
        const result = await gasService.listRooms();
        if (result.success && result.data && Array.isArray(result.data)) {
          const raw = result.data as unknown[];
          const roomIds: string[] = raw.map(item => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object' && 'roomId' in item) return String((item as { roomId: string }).roomId);
            return '';
          }).filter(Boolean);
          const unique = [...new Set(roomIds)];
          setRoomList(unique);
          if (unique.length > 0) {
            setRoomId(unique[0]);
          }
        }
      } catch {
        // non-critical
      }
      setLoading(false);
    };
    init();
  }, []);

  // roomId가 설정된 후: 데이터 폴링 (10초마다)
  useEffect(() => {
    if (!roomId) return;
    fetchData();
    const dataInterval = setInterval(fetchData, 10000);
    return () => clearInterval(dataInterval);
  }, [fetchData, roomId]);

  // 방 목록도 15초마다 갱신 (다른 관리자가 방 만들 수 있으므로)
  useEffect(() => {
    const roomInterval = setInterval(fetchRoomList, 15000);
    return () => clearInterval(roomInterval);
  }, [fetchRoomList]);

  useEffect(() => {
    if (!gameStarted || !gameStartTime) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(gameStartTime).getTime()) / 1000);
      setElapsedSeconds(Math.max(0, diff));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameStartTime]);

  const handleCreateAndStartGame = async () => {
    const targetRoom = newRoomName.trim() || roomId;
    if (!targetRoom) return;
    await gasService.startGame(targetRoom, timerMinutes);
    // 방 목록에 즉시 추가
    setRoomList(prev => {
      const updated = [...new Set([...prev, targetRoom])];
      return updated;
    });
    setRoomId(targetRoom);
    setNewRoomName('');
    setGameStarted(true);
    setGameStartTime(new Date().toISOString());
    // GAS 반영 후 방 목록 재확인
    setTimeout(fetchRoomList, 2000);
  };

  const handleStopGame = async () => {
    await gasService.stopGame(roomId);
    setGameStarted(false);
  };

  const handleStartEvent = async (eventType: EventType) => {
    const eventConfig = EVENTS.find(e => e.type === eventType);
    if (!eventConfig) return;
    await gasService.createEvent(roomId, eventType, eventConfig.instruction, eventTarget);
    setActiveEventType(eventType);
    if (eventTimerInput > 0) {
      setEventRemaining(eventTimerInput * 60);
    } else {
      setEventRemaining(0);
    }
  };

  const handleStopEvent = async () => {
    await gasService.clearEvent(roomId);
    setActiveEventType(null);
    setEventRemaining(0);
  };

  const handleDeleteRoom = async (targetRoomId: string) => {
    if (!confirm(`"${targetRoomId}" 방을 삭제하시겠습니까? 모든 팀 데이터가 삭제됩니다.`)) return;
    try {
      await gasService.deleteRoom(targetRoomId);
      setRoomList(prev => prev.filter(r => r !== targetRoomId));
      if (targetRoomId === roomId) setTeams([]);
    } catch {
      // deletion failed
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeEventType || eventRemaining <= 0) return;
    const interval = setInterval(() => {
      setEventRemaining(prev => {
        if (prev <= 1) {
          gasService.clearEvent(roomId);
          setActiveEventType(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEventType, eventRemaining > 0, roomId]);

  const openTeamDetail = async (team: TeamRow) => {
    setDetailTeam(team);
    setDetailMonth(1);
    setDetailLoading(true);
    setDetailData([]);
    setDetailAssets(null);
    try {
      const [dataResult, assetsResult] = await Promise.all([
        gasService.getMissionData(roomId, team.teamId),
        gasService.getTeamAssets(roomId, team.teamId),
      ]);
      if (dataResult.success && dataResult.data) {
        const raw = dataResult.data as unknown as MissionDataItem[];
        setDetailData(Array.isArray(raw) ? raw : []);
      }
      if (assetsResult.success && assetsResult.data) {
        setDetailAssets(assetsResult.data as unknown as TeamAsset);
      }
    } catch {
      // non-critical
    }
    setDetailLoading(false);
  };

  const getDetailForMonth = (month: number): Record<string, unknown> | null => {
    const item = detailData.find(d => Number(d.month) === month);
    if (!item || !item.dataJson) return null;
    try {
      return JSON.parse(item.dataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  // 팀번호 순 정렬 (1팀 → 25팀)
  const sortedTeams = [...teams].sort((a, b) => (a.teamId || 0) - (b.teamId || 0));
  // 점수 순 정렬 (랭킹용)
  const rankedTeams = [...teams].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const completedCount = teams.filter(t => t.status === 'completed').length;
  const avgScore = teams.length > 0 ? Math.round(teams.reduce((s, t) => s + (t.totalScore || 0), 0) / teams.length) : 0;

  return (
    <div className="min-h-screen bg-cl-bg nb-pattern relative overflow-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white border-b-3 border-cl-border shadow-[0_4px_0_#1A1A1A]">
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="nb-btn px-3 py-1.5 bg-white text-cl-text text-sm">
              ← EXIT
            </button>
            <h1 className="text-xl font-black text-cl-text font-[family-name:var(--font-space)] tracking-wider">
              LEADERSHIP CONTROL
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full border-2 border-cl-border ${gameStarted ? 'bg-cl-green animate-pulse' : 'bg-cl-red'}`} />
              <span className="text-xs font-mono font-bold text-cl-text/60">
                {gameStarted ? 'LIVE' : 'STANDBY'}
              </span>
            </div>

            {gameStarted && (
              <div className="nb-badge bg-cl-gold text-cl-text">
                <span className="text-xs mr-1">&#9201;</span>
                <span className="text-base font-black font-mono tabular-nums">
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6 space-y-5 relative z-10">

        {/* ===== TOP STATS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="TEAMS" value={teams.length} suffix="팀" color="blue" />
          <StatCard label="COMPLETED" value={completedCount} suffix={`/ ${teams.length}`} color="green" />
          <StatCard label="AVG SCORE" value={avgScore} suffix="pts" color="purple" />
          <StatCard label="TIME LIMIT" value={timerMinutes} suffix="min" color="orange" />
        </div>

        {/* ===== GAME CONTROL ===== */}
        <div className="nb-card p-5">
          <h2 className="text-xs font-black text-cl-text/60 font-mono uppercase tracking-widest mb-4">&#9881;&#65039; GAME CONTROL</h2>

          {/* 현재 활성 방 표시 */}
          {roomId && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-cl-text/40 font-mono">현재 방:</span>
              <span className="nb-badge bg-cl-navy text-white border-cl-navy text-sm px-3 py-1">{roomId}</span>
              {gameStarted && <span className="nb-badge bg-cl-green text-white border-cl-green text-[10px] animate-pulse">LIVE</span>}
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[10px] text-cl-text/40 font-mono mb-1 block font-bold uppercase">ROOM CREATE</label>
              <input
                type="text"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="새 방 이름 입력"
                className="nb-input w-48 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-cl-text/40 font-mono mb-1 block font-bold uppercase">Theme</label>
              <select value={industryType} onChange={e => onIndustryTypeChange(Number(e.target.value) as IndustryType)} className="nb-input w-40 py-2 text-sm">
                {Object.entries(IndustryTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-cl-text/40 font-mono mb-1 block font-bold uppercase">Timer (min)</label>
              <input type="number" value={timerMinutes} onChange={e => setTimerMinutes(Number(e.target.value))} className="nb-input w-24 py-2 text-sm" />
            </div>
            {!gameStarted ? (
              <button
                onClick={handleCreateAndStartGame}
                disabled={!newRoomName.trim() && !roomId}
                className="nb-btn px-8 py-2.5 bg-cl-green text-cl-text text-sm disabled:opacity-40"
              >
                &#9654; START GAME
              </button>
            ) : (
              <button onClick={handleStopGame} className="nb-btn px-8 py-2.5 bg-cl-red text-white text-sm">
                &#9632; STOP GAME
              </button>
            )}
            <button onClick={() => { fetchData(); fetchRoomList(); }} className="nb-btn px-6 py-2.5 bg-white text-cl-text text-sm">
              &#128260; REFRESH
            </button>
          </div>

          {!newRoomName.trim() && !roomId && (
            <p className="text-[10px] text-cl-red mt-2 font-mono">* 새 방 이름을 입력하고 START GAME을 클릭하세요</p>
          )}
        </div>

        {/* ===== ROOM LIST ===== */}
        {roomList.length > 0 && (
          <div className="nb-card p-5">
            <h2 className="text-xs font-black text-cl-text/60 font-mono uppercase tracking-widest mb-3">&#127968; ROOMS ({roomList.length})</h2>
            <div className="flex flex-wrap gap-2">
              {roomList.map((r, idx) => (
                <div key={`${r}-${idx}`} className={`nb-badge flex items-center gap-2 py-1.5 px-3 ${r === roomId ? 'bg-cl-navy text-white border-cl-navy' : 'bg-white text-cl-text'}`}>
                  <button onClick={() => setRoomId(r)} className="font-bold text-sm hover:underline">{r}</button>
                  <button onClick={() => handleDeleteRoom(r)} className="text-cl-red hover:bg-cl-red/20 rounded px-1 text-xs font-bold" title="Delete room">&#10005;</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Score Ranking */}
          <div className="lg:col-span-2 space-y-5">

            <div className="nb-card p-5">
              <h2 className="text-xs font-black text-cl-text/60 font-mono uppercase tracking-widest mb-4">&#127942; SCORE RANKING</h2>

              {loading ? (
                <div className="text-center py-12 text-cl-text/30 font-mono">Loading...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-12 text-cl-text/30 font-mono">No teams registered</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {rankedTeams.map((team, i) => {
                    const pct = ((team.totalScore || 0) / MAX_TOTAL) * 100;
                    const color = TEAM_COLORS[team.teamId % TEAM_COLORS.length];
                    const medal = i === 0 ? '&#129351;' : i === 1 ? '&#129352;' : i === 2 ? '&#129353;' : '';

                    return (
                      <div
                        key={team.teamId}
                        onClick={() => setSelectedTeam(selectedTeam?.teamId === team.teamId ? null : team)}
                        className={`nb-card p-3 cursor-pointer transition-all nb-card-hover ${
                          selectedTeam?.teamId === team.teamId ? 'border-cl-navy shadow-[4px_4px_0px_#1E3A5F]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg border-2 border-cl-border flex items-center justify-center font-black text-sm ${
                            i < 3 ? 'bg-cl-gold' : 'bg-gray-100'
                          }`} dangerouslySetInnerHTML={{ __html: medal || `#${i + 1}` }} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-cl-text text-sm truncate">
                                {team.teamId}팀 {team.teamName || ''}
                              </span>
                              <span className={`nb-badge text-[9px] py-0 ${
                                team.status === 'completed'
                                  ? 'bg-cl-green/20 text-cl-green border-cl-green'
                                  : 'bg-cl-cyan/20 text-cl-cyan border-cl-cyan'
                              }`}>
                                {team.status === 'completed' ? 'DONE' : `${team.currentMonth || 1}월`}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black font-mono" style={{ color }}>{team.totalScore || 0}</span>
                            <span className="text-cl-text/30 text-xs font-mono ml-1">pts</span>
                          </div>
                        </div>

                        <div className="h-5 bg-gray-100 rounded-lg border-2 border-cl-border/30 overflow-hidden">
                          <div className="h-full rounded-md transition-all duration-1000 ease-out" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mission Progress */}
            <div className="nb-card p-5">
              <h2 className="text-xs font-black text-cl-text/60 font-mono uppercase tracking-widest mb-4">&#128203; MISSION PROGRESS</h2>

              {teams.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="flex items-center mb-1 pl-28">
                    {MISSIONS.map(m => (
                      <div key={m.id} className="flex-1 min-w-[40px] text-center">
                        <span className="text-[9px] text-cl-text/40 font-mono font-bold">{m.month}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    {sortedTeams.map((team) => {
                      const color = TEAM_COLORS[team.teamId % TEAM_COLORS.length];
                      return (
                        <div key={team.teamId} className="flex items-center gap-2">
                          <div className="w-24 flex-shrink-0 text-right pr-2">
                            <span className="text-xs text-cl-text/60 font-bold truncate block">
                              {team.teamId}팀 {team.teamName || ''}
                            </span>
                          </div>
                          <div className="flex-1 flex items-center gap-0.5">
                            {MISSIONS.map(m => {
                              const scoreKey = `r${m.id}Score` as keyof TeamRow;
                              const mScore = team[scoreKey] as number | undefined;
                              const hasScore = mScore !== undefined && mScore !== null && String(mScore) !== '';
                              const isCurrent = m.id === (team.currentMonth || 1);

                              return (
                                <div
                                  key={m.id}
                                  className={`flex-1 min-w-[40px] h-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border-2 transition-all ${
                                    hasScore
                                      ? 'border-cl-border/30 bg-white'
                                      : isCurrent
                                      ? 'border-cl-navy/40 bg-cl-navy/5'
                                      : 'border-transparent bg-gray-50'
                                  }`}
                                >
                                  {hasScore ? (
                                    <span style={{ color }}>{mScore}</span>
                                  ) : isCurrent ? (
                                    <span className="animate-pulse text-cl-navy">&#9654;</span>
                                  ) : (
                                    <span className="text-cl-text/15">-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {teams.length === 0 && !loading && (
                <div className="text-center py-8 text-cl-text/30 font-mono text-sm">No teams to display</div>
              )}
            </div>

            {/* Selected team detail */}
            {selectedTeam && (
              <div className="nb-card p-5 border-cl-navy shadow-[4px_4px_0px_#1E3A5F]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-cl-navy font-mono uppercase tracking-widest">
                    {selectedTeam.teamName || `Team ${selectedTeam.teamId}`} - DETAIL
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => openTeamDetail(selectedTeam)} className="nb-btn px-3 py-1 bg-cl-gold text-cl-text text-xs">
                      &#128269; VIEW DETAIL
                    </button>
                    <button onClick={() => setSelectedTeam(null)} className="nb-btn px-3 py-1 bg-white text-cl-text text-xs">
                      &#10005; CLOSE
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {MISSIONS.map(m => {
                    const scoreKey = `r${m.id}Score` as keyof TeamRow;
                    const mScore = selectedTeam[scoreKey] as number | undefined;
                    const hasScore = mScore !== undefined && mScore !== null && String(mScore) !== '';
                    const color = TEAM_COLORS[selectedTeam.teamId % TEAM_COLORS.length];
                    return (
                      <div key={m.id} className={`nb-card p-2 text-center ${
                        hasScore ? 'bg-cl-green/10 border-cl-green' : 'bg-gray-50 border-cl-border/20'
                      }`}>
                        <div className="text-[9px] text-cl-text/40 font-mono font-bold">{m.month}</div>
                        <div className={`text-lg font-black font-mono ${hasScore ? '' : 'text-cl-text/15'}`}
                          style={{ color: hasScore ? color : undefined }}>
                          {hasScore ? mScore : '-'}
                        </div>
                        <div className="text-[7px] text-cl-text/30 truncate leading-tight mt-0.5">{m.title}</div>
                        <div className="text-[8px] text-cl-text/30 font-mono mt-0.5">/{m.score}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Event Control */}
          <div className="space-y-5">

            <div className="nb-card p-5">
              <h2 className="text-xs font-black text-cl-text/60 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                &#9889; EVENT
                {activeEventType && (
                  <span className="nb-badge bg-cl-gold text-cl-text animate-pulse text-[10px] ml-1">
                    {EVENTS.find(e => e.type === activeEventType)?.label}
                  </span>
                )}
              </h2>

              <div className="mb-4">
                <div className="text-[10px] text-cl-text/40 font-mono uppercase font-bold mb-2">Target</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setEventTarget('all')}
                    className={`nb-btn px-3 py-1.5 text-xs ${
                      eventTarget === 'all' ? 'bg-cl-cyan text-cl-text' : 'bg-white text-cl-text/50'
                    }`}
                  >
                    ALL
                  </button>
                  {sortedTeams.map(t => (
                    <button
                      key={t.teamId}
                      onClick={() => setEventTarget(String(t.teamId))}
                      className={`nb-btn px-3 py-1.5 text-xs ${
                        eventTarget === String(t.teamId) ? 'bg-cl-purple text-white' : 'bg-white text-cl-text/50'
                      }`}
                    >
                      {t.teamId}팀
                    </button>
                  ))}
                </div>
              </div>

              {!activeEventType && (
                <div className="mb-4">
                  <div className="text-[10px] text-cl-text/40 font-mono uppercase font-bold mb-2">Timer (min)</div>
                  <div className="flex gap-2">
                    {[0, 1, 3, 5, 10, 15].map(v => (
                      <button
                        key={v}
                        onClick={() => setEventTimerInput(v)}
                        className={`nb-btn px-3 py-1.5 text-xs ${
                          eventTimerInput === v ? 'bg-cl-gold text-cl-text' : 'bg-white text-cl-text/50'
                        }`}
                      >
                        {v === 0 ? 'OFF' : `${v}m`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeEventType && (
                <div className="mb-4 nb-card p-4 border-cl-gold bg-cl-gold/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cl-text font-bold text-sm">
                      {EVENTS.find(e => e.type === activeEventType)?.label}
                    </span>
                    {eventRemaining > 0 ? (
                      <span className="text-2xl font-black font-mono text-cl-red tabular-nums">
                        {formatElapsed(eventRemaining)}
                      </span>
                    ) : (
                      <span className="text-xs text-cl-text/40 font-mono font-bold">NO TIMER</span>
                    )}
                  </div>
                  {eventRemaining > 0 && (
                    <div className="w-full h-3 bg-gray-200 rounded-full border-2 border-cl-border/30 overflow-hidden mb-3">
                      <div
                        className="h-full bg-cl-orange rounded-full transition-all duration-1000"
                        style={{ width: `${eventTimerInput > 0 ? (eventRemaining / (eventTimerInput * 60)) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                  <button onClick={handleStopEvent} className="nb-btn w-full py-2.5 bg-cl-red text-white text-sm">
                    &#9632; STOP EVENT
                  </button>
                </div>
              )}

              <div className="grid grid-cols-5 gap-2">
                {EVENTS.map(event => (
                  <button
                    key={event.type}
                    onClick={() => handleStartEvent(event.type as EventType)}
                    disabled={!!activeEventType}
                    className={`nb-btn p-2.5 text-[10px] text-center ${
                      activeEventType === event.type
                        ? 'bg-cl-gold text-cl-text border-cl-gold'
                        : 'bg-white text-cl-text/60 disabled:opacity-30'
                    }`}
                  >
                    {event.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Status */}
            <div className="nb-card p-5">
              <h2 className="text-xs font-black text-cl-text/60 font-mono uppercase tracking-widest mb-4">&#128225; LIVE STATUS</h2>

              <div className="space-y-2">
                {sortedTeams.slice(0, 8).map((team) => {
                  const color = TEAM_COLORS[team.teamId % TEAM_COLORS.length];
                  const progressPct = (((team.currentMonth || 1) - 1) / 12) * 100;

                  return (
                    <div key={team.teamId} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-cl-border" style={{ background: color }} />
                      <span className="text-xs text-cl-text/60 font-mono font-bold w-16 truncate flex-shrink-0">
                        {team.teamId}팀 {team.teamName || ''}
                      </span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full border border-cl-border/20 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(progressPct, 3)}%`, background: color }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>
                        {team.status === 'completed' ? 'END' : `${team.currentMonth || 1}월`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ===== RESULT REPORT BUTTON ===== */}
        {teams.length > 0 && (
          <div className="flex justify-center">
            <button onClick={() => setShowReport(true)} className="nb-btn px-10 py-3.5 bg-cl-gold text-cl-text text-sm font-mono tracking-wider">
              &#128202; GENERATE RESULT REPORT
            </button>
          </div>
        )}

        {/* ===== FINAL RESULTS ===== */}
        {teams.length > 0 && teams.every(t => t.status === 'completed') && (
          <div className="nb-card p-8 text-center bg-cl-gold/10 border-cl-gold">
            <div className="text-4xl font-black text-cl-text font-[family-name:var(--font-space)] mb-6">
              &#127942; FINAL RESULTS
            </div>
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {sortedTeams.slice(0, 3).map((team, i) => {
                const medal = i === 0 ? '&#129351;' : i === 1 ? '&#129352;' : '&#129353;';
                const bgColor = i === 0 ? 'bg-cl-gold/20 border-cl-gold' : i === 1 ? 'bg-gray-100 border-gray-300' : 'bg-cl-orange/20 border-cl-orange';
                return (
                  <div key={team.teamId} className={`nb-card flex-1 min-w-[200px] p-6 ${bgColor}`}>
                    <div className="text-3xl mb-2" dangerouslySetInnerHTML={{ __html: medal }} />
                    <div className="text-xl font-black text-cl-text">
                      {team.teamId}팀 {team.teamName || ''}
                    </div>
                    <div className="text-3xl font-black text-cl-navy font-mono mt-2">
                      {team.totalScore || 0}<span className="text-sm text-cl-text/30">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== TEAM DETAIL MODAL (1,3,5,7,12월) ===== */}
      {detailTeam && (
        <div className="fixed inset-0 z-[9999] bg-black/50 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="nb-card p-6 bg-white">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-black text-cl-navy font-[family-name:var(--font-space)]">
                  {detailTeam.teamId}팀 {detailTeam.teamName} - 미션 상세
                </h2>
                <button onClick={() => setDetailTeam(null)} className="nb-btn px-4 py-1.5 bg-white text-cl-text text-sm">
                  &#10005; CLOSE
                </button>
              </div>

              {/* Month Tabs */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {[1, 3, 5, 7, 12].map(m => (
                  <button
                    key={m}
                    onClick={() => setDetailMonth(m)}
                    className={`nb-btn px-4 py-2 text-sm ${
                      detailMonth === m ? 'bg-cl-navy text-white' : 'bg-white text-cl-text/60'
                    }`}
                  >
                    {m}월 {MISSIONS[m - 1]?.title}
                  </button>
                ))}
              </div>

              {detailLoading ? (
                <div className="text-center py-12 text-cl-text/30 font-mono">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {/* 1월: 부임 인사 */}
                  {detailMonth === 1 && (() => {
                    const data = getDetailForMonth(1);
                    if (!data) return <div className="text-center py-8 text-cl-text/30 font-mono text-sm">아직 데이터가 없습니다</div>;
                    return (
                      <div className="space-y-3">
                        <div className="nb-card p-4 bg-cl-bg">
                          <h4 className="text-xs font-bold text-cl-navy mb-2">&#128221; 부임 인사 내용</h4>
                          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{String(data.speech || '')}</p>
                        </div>
                        <div className="nb-card p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-cl-navy">AI 평가 점수:</span>
                            <span className="text-xl font-black text-cl-navy font-mono">{String(data.aiScore || '-')}/100</span>
                          </div>
                          <p className="text-sm text-cl-text/60 leading-relaxed">{String(data.feedback || '')}</p>
                        </div>
                        {Array.isArray(data.strengths) && (data.strengths as string[]).length > 0 && (
                          <div className="nb-card p-3 bg-cl-green/10 border-cl-green">
                            <span className="text-xs font-bold text-cl-green">&#128077; 잘한 점</span>
                            <ul className="text-xs text-cl-text/60 mt-1 space-y-0.5">
                              {(data.strengths as string[]).map((s, i) => <li key={i}>&bull; {s}</li>)}
                            </ul>
                          </div>
                        )}
                        {Array.isArray(data.improvements) && (data.improvements as string[]).length > 0 && (
                          <div className="nb-card p-3 bg-cl-orange/10 border-cl-orange">
                            <span className="text-xs font-bold text-cl-orange">&#128736; 개선 포인트</span>
                            <ul className="text-xs text-cl-text/60 mt-1 space-y-0.5">
                              {(data.improvements as string[]).map((s, i) => <li key={i}>&bull; {s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3월: 1:1 면담 */}
                  {detailMonth === 3 && (() => {
                    const data = getDetailForMonth(3);
                    if (!data) return <div className="text-center py-8 text-cl-text/30 font-mono text-sm">아직 데이터가 없습니다</div>;
                    const chatHist = Array.isArray(data.chatHistory) ? (data.chatHistory as Array<{ role: string; content: string }>) : [];
                    return (
                      <div className="space-y-3">
                        <div className="nb-card p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-cl-navy">면담 대상:</span>
                            <span className="nb-badge bg-cl-gold/30 text-cl-text text-xs">{String(data.memberName || '')} ({String(data.memberStyle || '')})</span>
                            <span className="text-xs font-bold text-cl-navy ml-2">점수:</span>
                            <span className="text-lg font-black text-cl-navy font-mono">{String(data.finalScore || '-')}/100</span>
                          </div>
                          {data.feedbackSummary ? <p className="text-sm text-cl-text/60 leading-relaxed">{String(data.feedbackSummary)}</p> : null}
                        </div>
                        {chatHist.length > 0 && (
                          <details className="nb-card p-4">
                            <summary className="text-xs font-bold text-cl-navy cursor-pointer">&#128172; 대화 내역 ({chatHist.length}턴)</summary>
                            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                              {chatHist.map((msg, i) => (
                                <div key={i} className={`p-2 rounded-lg text-xs ${msg.role === 'user' ? 'bg-cl-navy/10 text-cl-navy ml-8' : 'bg-gray-100 text-cl-text/70 mr-8'}`}>
                                  <span className="font-bold text-[10px] block mb-0.5">{msg.role === 'user' ? 'YOU (팀장)' : String(data.memberName || '팀원')}</span>
                                  {msg.content}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}

                  {/* 5월: 팀빌딩 사진 */}
                  {detailMonth === 5 && (() => {
                    const data = getDetailForMonth(5);
                    const photoUrl = detailAssets?.photoUrl;
                    if (!data && !photoUrl) return <div className="text-center py-8 text-cl-text/30 font-mono text-sm">아직 데이터가 없습니다</div>;
                    return (
                      <div className="space-y-3">
                        {photoUrl && (
                          <div className="nb-card p-2">
                            <img src={photoUrl} alt="팀 하트 사진" className="w-full rounded-lg border-2 border-cl-border" />
                          </div>
                        )}
                        {data && (
                          <div className="nb-card p-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-xs text-cl-text/40">참여 인원</span>
                                <span className="text-xl font-black text-cl-navy font-mono ml-2">{String(data.participantCount || '-')}명</span>
                              </div>
                              <div>
                                <span className="text-xs text-cl-text/40">AI 점수</span>
                                <span className="text-xl font-black text-cl-navy font-mono ml-2">{String(data.aiScore || '-')}/100</span>
                              </div>
                            </div>
                            {data.aiMessage ? <p className="text-sm text-cl-text/60 mt-2">{String(data.aiMessage)}</p> : null}
                          </div>
                        )}
                        {!photoUrl && <p className="text-xs text-cl-text/30 text-center">* Drive 업로드 미설정 시 사진이 표시되지 않습니다</p>}
                      </div>
                    );
                  })()}

                  {/* 7월: 퀴즈 결과 */}
                  {detailMonth === 7 && (() => {
                    const data = getDetailForMonth(7);
                    if (!data) return <div className="text-center py-8 text-cl-text/30 font-mono text-sm">아직 데이터가 없습니다</div>;
                    const quizAnswers = Array.isArray(data.answers) ? (data.answers as Array<{ question: string; selected: string; correct: boolean; correctAnswer: string }>) : [];
                    return (
                      <div className="space-y-3">
                        <div className="nb-card p-4 text-center">
                          <span className="text-3xl font-black text-cl-navy font-mono">{String(data.correctCount || 0)}</span>
                          <span className="text-cl-text/40 text-lg">/{String(data.totalQuestions || 20)} 정답</span>
                        </div>
                        {quizAnswers.length > 0 && (
                          <div className="nb-card p-4">
                            <h4 className="text-xs font-bold text-cl-navy mb-2">문제별 결과</h4>
                            <div className="space-y-1">
                              {quizAnswers.map((a, i) => (
                                <div key={i} className={`flex items-center gap-2 text-xs p-1.5 rounded ${a.correct ? 'bg-cl-green/10' : 'bg-cl-red/10'}`}>
                                  <span className={`font-bold ${a.correct ? 'text-cl-green' : 'text-cl-red'}`}>{a.correct ? '&#10003;' : '&#10007;'}</span>
                                  <span className="text-cl-text/60 flex-1 truncate">{a.question}</span>
                                  <span className="text-[10px] text-cl-text/40">{a.selected}</span>
                                  {!a.correct && <span className="text-cl-red text-[10px]">({a.correctAnswer})</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 12월: 성과보고서 + 인포그래픽 */}
                  {detailMonth === 12 && (() => {
                    const data = getDetailForMonth(12);
                    const infographicUrl = detailAssets?.infographicUrl;
                    if (!data && !infographicUrl) return <div className="text-center py-8 text-cl-text/30 font-mono text-sm">아직 데이터가 없습니다</div>;
                    const report = data?.report as { oneLine?: string; bestMission?: string; regret?: string; futureHelp?: string } | undefined;
                    return (
                      <div className="space-y-3">
                        {data && (
                          <>
                            <div className="nb-card p-4">
                              <span className="text-xs font-bold text-cl-navy">제기차기:</span>
                              <span className="text-lg font-black text-cl-navy font-mono ml-2">{String(data.jegiCount || '-')}회</span>
                            </div>
                            {report && (
                              <div className="nb-card p-4 space-y-3">
                                <h4 className="text-xs font-bold text-cl-navy">&#128221; 성과보고서</h4>
                                <div>
                                  <span className="text-[10px] text-cl-text/40 block">한줄 소감</span>
                                  <p className="text-sm text-cl-text/70">{report.oneLine || ''}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-cl-text/40 block">리더십이 빛났던 미션</span>
                                  <p className="text-sm text-cl-text/70">{report.bestMission || ''}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-cl-text/40 block">아쉬웠던 점</span>
                                  <p className="text-sm text-cl-text/70">{report.regret || ''}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] text-cl-text/40 block">현업 도움</span>
                                  <p className="text-sm text-cl-text/70">{report.futureHelp || ''}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {infographicUrl && (
                          <div className="nb-card p-2">
                            <h4 className="text-xs font-bold text-cl-navy mb-2 px-2">&#127912; AI 인포그래픽</h4>
                            <img src={infographicUrl} alt="팀 인포그래픽" className="w-full rounded-lg border-2 border-cl-border" />
                          </div>
                        )}
                        {!infographicUrl && <p className="text-xs text-cl-text/30 text-center">* Drive 업로드 미설정 시 인포그래픽이 표시되지 않습니다</p>}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <FinalResultReport teams={teams as TeamRow[]} roomId={roomId} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}

function StatCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-cl-navy/10 border-cl-navy',
    green: 'bg-cl-green/10 border-cl-green',
    purple: 'bg-cl-purple/10 border-cl-purple',
    orange: 'bg-cl-orange/10 border-cl-orange',
  };
  const textMap: Record<string, string> = {
    blue: 'text-cl-navy',
    green: 'text-cl-green',
    purple: 'text-cl-purple',
    orange: 'text-cl-orange',
  };

  return (
    <div className={`nb-card p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cl-text/40 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black font-mono ${textMap[color] || textMap.blue}`}>{value}</span>
        {suffix && <span className="text-xs text-cl-text/40 font-mono">{suffix}</span>}
      </div>
    </div>
  );
}
