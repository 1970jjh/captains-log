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
  r1Time?: number; r2Time?: number; r3Time?: number; r4Time?: number;
  r5Time?: number; r6Time?: number; r7Time?: number; r8Time?: number;
  r9Time?: number; r10Time?: number; r11Time?: number; r12Time?: number;
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
  const [roomId, setRoomId] = useState('room-default');
  const [eventTarget, setEventTarget] = useState<string>('all');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [eventTimerInput, setEventTimerInput] = useState<number>(0);
  const [eventRemaining, setEventRemaining] = useState<number>(0);
  const [eventStartedAt, setEventStartedAt] = useState<number>(0);
  const [roomList, setRoomList] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [teamsResult, stateResult] = await Promise.all([
        gasService.getAllTeams(roomId),
        gasService.getGameState(roomId),
      ]);
      if (teamsResult.success && teamsResult.data) {
        const teamsArray = teamsResult.data as unknown as TeamRow[];
        if (Array.isArray(teamsArray)) setTeams(teamsArray);
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
      // non-critical - GAS might not support this action yet
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchRoomList();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchRoomList]);

  // Elapsed timer
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

  const handleStartGame = async () => {
    await gasService.startGame(roomId, timerMinutes);
    setGameStarted(true);
    setGameStartTime(new Date().toISOString());
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
    setEventStartedAt(Date.now());
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
    setEventStartedAt(0);
  };

  const handleDeleteRoom = async (targetRoomId: string) => {
    if (!confirm(`"${targetRoomId}" 방을 삭제하시겠습니까? 모든 팀 데이터가 삭제됩니다.`)) return;
    try {
      await gasService.deleteRoom(targetRoomId);
      setRoomList(prev => prev.filter(r => r !== targetRoomId));
      if (targetRoomId === roomId) {
        setTeams([]);
      }
    } catch {
      // deletion failed
    }
  };

  // Event countdown timer
  useEffect(() => {
    if (!activeEventType || eventRemaining <= 0) return;
    const interval = setInterval(() => {
      setEventRemaining(prev => {
        if (prev <= 1) {
          gasService.clearEvent(roomId);
          setActiveEventType(null);
          setEventStartedAt(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEventType, eventRemaining > 0, roomId]);

  const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);
  const maxScore = sortedTeams.length > 0 ? Math.max(sortedTeams[0].totalScore, 1) : 1;

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const completedCount = teams.filter(t => t.status === 'completed').length;
  const avgScore = teams.length > 0 ? Math.round(teams.reduce((s, t) => s + t.totalScore, 0) / teams.length) : 0;

  // suppress unused variable warnings
  void maxScore;
  void eventStartedAt;

  return (
    <div className="min-h-screen cl-bg cl-pattern relative overflow-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white border-b-3 cl-border shadow-[0_4px_0_#1A1A1A]">
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="cl-btn px-3 py-1.5 bg-white cl-text text-sm">
              ← EXIT
            </button>
            <h1 className="text-xl font-black cl-text font-[family-name:var(--font-space)] tracking-wider">
              LEADERSHIP CONTROL
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Game status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full border-2 cl-border ${gameStarted ? 'cl-green animate-pulse' : 'cl-red'}`} />
              <span className="text-xs font-mono font-bold cl-text/60">
                {gameStarted ? 'LIVE' : 'STANDBY'}
              </span>
            </div>

            {/* Elapsed timer */}
            {gameStarted && (
              <div className="cl-badge cl-gold cl-text">
                <span className="text-xs mr-1">⏱</span>
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
        <div className="cl-card p-5">
          <h2 className="text-xs font-black cl-text/60 font-mono uppercase tracking-widest mb-4">⚙️ GAME CONTROL</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[10px] cl-text/40 font-mono mb-1 block font-bold uppercase">Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="cl-input w-44 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] cl-text/40 font-mono mb-1 block font-bold uppercase">Industry / Theme</label>
              <select
                value={industryType}
                onChange={e => onIndustryTypeChange(Number(e.target.value) as IndustryType)}
                className="cl-input w-44 py-2 text-sm"
              >
                {Object.entries(IndustryTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] cl-text/40 font-mono mb-1 block font-bold uppercase">Timer (min)</label>
              <input
                type="number"
                value={timerMinutes}
                onChange={e => setTimerMinutes(Number(e.target.value))}
                className="cl-input w-24 py-2 text-sm"
              />
            </div>
            {!gameStarted ? (
              <button onClick={handleStartGame} className="cl-btn px-8 py-2.5 cl-green cl-text text-sm">
                ▶ START GAME
              </button>
            ) : (
              <button onClick={handleStopGame} className="cl-btn px-8 py-2.5 cl-red text-white text-sm">
                ■ STOP GAME
              </button>
            )}
            <button onClick={() => { fetchData(); fetchRoomList(); }} className="cl-btn px-6 py-2.5 bg-white cl-text text-sm">
              🔄 REFRESH
            </button>
          </div>
        </div>

        {/* ===== ROOM LIST ===== */}
        {roomList.length > 0 && (
          <div className="cl-card p-5">
            <h2 className="text-xs font-black cl-text/60 font-mono uppercase tracking-widest mb-3">🏠 ROOMS ({roomList.length})</h2>
            <div className="flex flex-wrap gap-2">
              {roomList.map((r, idx) => (
                <div key={`${r}-${idx}`} className={`cl-badge flex items-center gap-2 py-1.5 px-3 ${r === roomId ? 'cl-navy text-white border-cl-navy' : 'bg-white cl-text'}`}>
                  <button
                    onClick={() => setRoomId(r)}
                    className="font-bold text-sm hover:underline"
                  >
                    {r}
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(r)}
                    className="cl-red hover:bg-red-100 rounded px-1 text-xs font-bold"
                    title="Delete room"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Score Ranking */}
          <div className="lg:col-span-2 space-y-5">

            {/* Score Ranking */}
            <div className="cl-card p-5">
              <h2 className="text-xs font-black cl-text/60 font-mono uppercase tracking-widest mb-4">🏆 SCORE RANKING</h2>

              {loading ? (
                <div className="text-center py-12 cl-text/30 font-mono">Loading...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-12 cl-text/30 font-mono">No teams registered</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {sortedTeams.map((team, i) => {
                    const pct = (team.totalScore / MAX_TOTAL) * 100;
                    const color = TEAM_COLORS[team.teamId % TEAM_COLORS.length];
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';

                    return (
                      <div
                        key={team.teamId}
                        onClick={() => setSelectedTeam(selectedTeam?.teamId === team.teamId ? null : team)}
                        className={`cl-card p-3 cursor-pointer transition-all cl-card-hover ${
                          selectedTeam?.teamId === team.teamId ? 'border-cl-indigo shadow-[4px_4px_0px_#6366f1]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg border-2 cl-border flex items-center justify-center font-black text-sm ${
                            i < 3 ? 'cl-gold' : 'bg-gray-100'
                          }`}>
                            {medal || `#${i + 1}`}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold cl-text text-sm truncate">
                                {team.teamName || `Team ${team.teamId}`}
                              </span>
                              <span className={`cl-badge text-[9px] py-0 ${
                                team.status === 'completed'
                                  ? 'bg-green-100 cl-green border-green-400'
                                  : 'bg-cyan-100 cl-cyan border-cyan-400'
                              }`}>
                                {team.status === 'completed' ? 'DONE' : `${team.currentMonth}월`}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-black font-mono" style={{ color }}>{team.totalScore}</span>
                            <span className="cl-text/30 text-xs font-mono ml-1">pts</span>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="h-5 bg-gray-100 rounded-lg border-2 cl-border/30 overflow-hidden">
                          <div
                            className="h-full rounded-md transition-all duration-1000 ease-out"
                            style={{
                              width: `${Math.max(pct, 2)}%`,
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mission Progress */}
            <div className="cl-card p-5">
              <h2 className="text-xs font-black cl-text/60 font-mono uppercase tracking-widest mb-4">📋 MISSION PROGRESS</h2>

              {teams.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="flex items-center mb-1 pl-28">
                    {MISSIONS.map(m => (
                      <div key={m.id} className="flex-1 min-w-[40px] text-center">
                        <span className="text-[9px] cl-text/40 font-mono font-bold">{m.month}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    {sortedTeams.map((team) => {
                      const color = TEAM_COLORS[team.teamId % TEAM_COLORS.length];
                      return (
                        <div key={team.teamId} className="flex items-center gap-2">
                          <div className="w-24 flex-shrink-0 text-right pr-2">
                            <span className="text-xs cl-text/60 font-bold truncate block">
                              {team.teamName || `T${team.teamId}`}
                            </span>
                          </div>
                          <div className="flex-1 flex items-center gap-0.5">
                            {MISSIONS.map(m => {
                              const scoreKey = `r${m.id}Score` as keyof TeamRow;
                              const mScore = team[scoreKey] as number | undefined;
                              const hasScore = mScore !== undefined && mScore !== null && String(mScore) !== '';
                              const isCurrent = m.id === team.currentMonth;

                              return (
                                <div
                                  key={m.id}
                                  className={`flex-1 min-w-[40px] h-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border-2 transition-all ${
                                    hasScore
                                      ? 'cl-border/30 bg-white'
                                      : isCurrent
                                      ? 'border-indigo-400/40 bg-indigo-50/50'
                                      : 'border-transparent bg-gray-50'
                                  }`}
                                >
                                  {hasScore ? (
                                    <span style={{ color }}>{mScore}</span>
                                  ) : isCurrent ? (
                                    <span className="animate-pulse cl-indigo">▶</span>
                                  ) : (
                                    <span className="cl-text/15">-</span>
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
                <div className="text-center py-8 cl-text/30 font-mono text-sm">No teams to display</div>
              )}
            </div>

            {/* Selected team detail */}
            {selectedTeam && (
              <div className="cl-card p-5 border-cl-indigo shadow-[4px_4px_0px_#6366f1]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black cl-indigo font-mono uppercase tracking-widest">
                    {selectedTeam.teamName || `Team ${selectedTeam.teamId}`} - DETAIL
                  </h3>
                  <button onClick={() => setSelectedTeam(null)} className="cl-btn px-3 py-1 bg-white cl-text text-xs">
                    ✕ CLOSE
                  </button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {MISSIONS.map(m => {
                    const scoreKey = `r${m.id}Score` as keyof TeamRow;
                    const mScore = selectedTeam[scoreKey] as number | undefined;
                    const hasScore = mScore !== undefined && mScore !== null && String(mScore) !== '';
                    const color = TEAM_COLORS[selectedTeam.teamId % TEAM_COLORS.length];
                    return (
                      <div key={m.id} className={`cl-card p-2 text-center ${
                        hasScore ? 'bg-green-50 border-green-400' : 'bg-gray-50 cl-border/20'
                      }`}>
                        <div className="text-[9px] cl-text/40 font-mono font-bold">{m.month}</div>
                        <div className={`text-lg font-black font-mono ${hasScore ? '' : 'cl-text/15'}`}
                          style={{ color: hasScore ? color : undefined }}>
                          {hasScore ? mScore : '-'}
                        </div>
                        <div className="text-[7px] cl-text/30 truncate leading-tight mt-0.5">{m.title}</div>
                        <div className="text-[8px] cl-text/30 font-mono mt-0.5">/{m.score}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Event Control */}
          <div className="space-y-5">

            {/* Event Control */}
            <div className="cl-card p-5">
              <h2 className="text-xs font-black cl-text/60 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                ⚡ EVENT
                {activeEventType && (
                  <span className="cl-badge cl-gold cl-text animate-pulse text-[10px] ml-1">
                    {EVENTS.find(e => e.type === activeEventType)?.label}
                  </span>
                )}
              </h2>

              {/* Target selector */}
              <div className="mb-4">
                <div className="text-[10px] cl-text/40 font-mono uppercase font-bold mb-2">Target</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setEventTarget('all')}
                    className={`cl-btn px-3 py-1.5 text-xs ${
                      eventTarget === 'all' ? 'cl-cyan cl-text' : 'bg-white cl-text/50'
                    }`}
                  >
                    ALL
                  </button>
                  {teams.map(t => (
                    <button
                      key={t.teamId}
                      onClick={() => setEventTarget(String(t.teamId))}
                      className={`cl-btn px-3 py-1.5 text-xs ${
                        eventTarget === String(t.teamId) ? 'cl-purple text-white' : 'bg-white cl-text/50'
                      }`}
                    >
                      {t.teamName || `T${t.teamId}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer input */}
              {!activeEventType && (
                <div className="mb-4">
                  <div className="text-[10px] cl-text/40 font-mono uppercase font-bold mb-2">Timer (min)</div>
                  <div className="flex gap-2">
                    {[0, 1, 3, 5, 10, 15].map(v => (
                      <button
                        key={v}
                        onClick={() => setEventTimerInput(v)}
                        className={`cl-btn px-3 py-1.5 text-xs ${
                          eventTimerInput === v ? 'cl-gold cl-text' : 'bg-white cl-text/50'
                        }`}
                      >
                        {v === 0 ? 'OFF' : `${v}m`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active event display */}
              {activeEventType && (
                <div className="mb-4 cl-card p-4 border-yellow-400 bg-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="cl-text font-bold text-sm">
                      {EVENTS.find(e => e.type === activeEventType)?.label}
                    </span>
                    {eventRemaining > 0 && (
                      <span className="text-2xl font-black font-mono cl-red tabular-nums">
                        {formatElapsed(eventRemaining)}
                      </span>
                    )}
                    {eventRemaining === 0 && (
                      <span className="text-xs cl-text/40 font-mono font-bold">NO TIMER</span>
                    )}
                  </div>
                  {eventRemaining > 0 && (
                    <div className="w-full h-3 bg-gray-200 rounded-full border-2 cl-border/30 overflow-hidden mb-3">
                      <div
                        className="h-full cl-orange rounded-full transition-all duration-1000"
                        style={{ width: `${eventTimerInput > 0 ? (eventRemaining / (eventTimerInput * 60)) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleStopEvent}
                    className="cl-btn w-full py-2.5 cl-red text-white text-sm"
                  >
                    ■ STOP EVENT
                  </button>
                </div>
              )}

              {/* Event grid */}
              <div className="grid grid-cols-4 gap-2">
                {EVENTS.map(event => (
                  <button
                    key={event.type}
                    onClick={() => handleStartEvent(event.type as EventType)}
                    disabled={!!activeEventType}
                    className={`cl-btn p-2.5 text-[10px] text-center ${
                      activeEventType === event.type
                        ? 'cl-gold cl-text border-yellow-400'
                        : 'bg-white cl-text/60 disabled:opacity-30'
                    }`}
                  >
                    {event.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Status */}
            <div className="cl-card p-5">
              <h2 className="text-xs font-black cl-text/60 font-mono uppercase tracking-widest mb-4">📡 LIVE STATUS</h2>

              <div className="space-y-2">
                {sortedTeams.slice(0, 8).map((team) => {
                  const color = TEAM_COLORS[team.teamId % TEAM_COLORS.length];
                  const progressPct = ((team.currentMonth - 1) / 12) * 100;

                  return (
                    <div key={team.teamId} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 border cl-border" style={{ background: color }} />
                      <span className="text-xs cl-text/60 font-mono font-bold w-16 truncate flex-shrink-0">
                        {team.teamName || `T${team.teamId}`}
                      </span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full border cl-border/20 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(progressPct, 3)}%`, background: color }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold w-8 text-right" style={{ color }}>
                        {team.status === 'completed' ? 'END' : `${team.currentMonth}월`}
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
            <button
              onClick={() => setShowReport(true)}
              className="cl-btn px-10 py-3.5 cl-gold cl-text text-sm font-mono tracking-wider"
            >
              📊 GENERATE RESULT REPORT
            </button>
          </div>
        )}

        {/* ===== FINAL RESULTS ===== */}
        {teams.length > 0 && teams.every(t => t.status === 'completed') && (
          <div className="cl-card p-8 text-center bg-yellow-50 border-yellow-400">
            <div className="text-4xl font-black cl-text font-[family-name:var(--font-space)] mb-6">
              🏆 FINAL RESULTS
            </div>
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {sortedTeams.slice(0, 3).map((team, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                const bgColor = i === 0 ? 'bg-yellow-100 border-yellow-400' : i === 1 ? 'bg-gray-100 border-gray-300' : 'bg-orange-100 border-orange-400';
                return (
                  <div key={team.teamId} className={`cl-card flex-1 min-w-[200px] p-6 ${bgColor}`}>
                    <div className="text-3xl mb-2">{medal}</div>
                    <div className="text-xl font-black cl-text">
                      {team.teamName || `Team ${team.teamId}`}
                    </div>
                    <div className="text-3xl font-black cl-indigo font-mono mt-2">
                      {team.totalScore}<span className="text-sm cl-text/30">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Result Report Modal */}
      {showReport && (
        <FinalResultReport
          teams={teams as TeamRow[]}
          roomId={roomId}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-400',
    green: 'bg-green-50 border-green-400',
    purple: 'bg-purple-50 border-purple-400',
    orange: 'bg-orange-50 border-orange-400',
  };
  const textMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  };
  const cls = colorMap[color] || colorMap.blue;
  const txtCls = textMap[color] || textMap.blue;

  return (
    <div className={`cl-card p-4 ${cls}`}>
      <div className="text-[10px] font-mono font-bold uppercase tracking-widest cl-text/40 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black font-mono ${txtCls}`}>{value}</span>
        {suffix && <span className="text-xs cl-text/40 font-mono">{suffix}</span>}
      </div>
    </div>
  );
}
