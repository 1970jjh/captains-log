'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TeamData, GameEvent } from '../types';
import { MISSIONS, ADMIN_PASSWORD } from '../constants';
import { gasService } from '../lib/gasService';
import { geminiService } from '../lib/geminiService';
import EventOverlay from './EventOverlay';
import MissionClearPopup from './MissionClearPopup';
import R1VisionGame from './games/R1VisionGame';
import R2DiagnosisGame from './games/R2DiagnosisGame';
import R3MeetingGame from './games/R3MeetingGame';
import R4AssignmentGame from './games/R4AssignmentGame';
import R5TeamBuildGame from './games/R5TeamBuildGame';
import R6RetentionGame from './games/R6RetentionGame';
import R7FeedbackGame from './games/R7FeedbackGame';
import R8TalentGame from './games/R8TalentGame';
import R9CrisisGame from './games/R9CrisisGame';
import R10ReorgGame from './games/R10ReorgGame';
import R11CoachingGame from './games/R11CoachingGame';
import R12FinalGame from './games/R12FinalGame';

interface Props {
  teamData: TeamData;
  onUpdateTeam: (team: TeamData) => void;
  roomId: string;
  onAdminLogin?: () => void;
  onBackToLanding: () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const QUARTER_LABELS = [
  { label: 'Q1 취임과 적응', range: [1, 3], color: 'bg-cl-green', emoji: '🌱' },
  { label: 'Q2 팀 구축과 성장', range: [4, 6], color: 'bg-cl-cyan', emoji: '🔍' },
  { label: 'Q3 위기와 갈등', range: [7, 9], color: 'bg-cl-orange', emoji: '🔥' },
  { label: 'Q4 성과와 도약', range: [10, 12], color: 'bg-cl-purple', emoji: '🏆' },
];

const MISSION_EMOJIS = ['📋', '🔐', '📞', '🔍', '📸', '🃏', '📊', '💎', '❤️', '🧩', '🤝', '⚽'];

export default function MissionRoadmap({ teamData, onUpdateTeam, roomId, onAdminLogin, onBackToLanding }: Props) {
  const [activeMission, setActiveMission] = useState<number | null>(null);
  const [missionStartTime, setMissionStartTime] = useState<number>(0);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [clearPopup, setClearPopup] = useState<{ missionId: number; score: number; timeBonus: number; totalScore: number } | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminError, setAdminError] = useState('');

  // Poll for events
  useEffect(() => {
    const poll = async () => {
      try {
        const result = await gasService.getActiveEvent(roomId);
        if (result.success && result.data) {
          const event = result.data as unknown as GameEvent;
          if (event.isActive) {
            const target = event.targetTeams || 'all';
            if (target === 'all' || target === String(teamData.teamId)) {
              setActiveEvent(event);
            } else {
              setActiveEvent(null);
            }
          } else {
            setActiveEvent(null);
          }
        } else {
          setActiveEvent(null);
        }
      } catch {
        // Polling failure is non-critical
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [roomId, teamData.teamId]);

  const handleMissionStart = useCallback((missionId: number) => {
    setActiveMission(missionId);
    setMissionStartTime(Date.now());
  }, []);

  const handleMissionComplete = useCallback(async (score: number, timeSeconds: number) => {
    if (activeMission === null) return;
    const mission = MISSIONS[activeMission - 1];
    const timeBonus = timeSeconds <= mission.timeLimit * 60 ? mission.timeBonus : 0;

    const newRoundScores = {
      ...teamData.roundScores,
      [activeMission]: { score, timeSeconds, completedAt: Date.now() },
    };
    const newTotalScore = Object.values(newRoundScores).reduce((sum, r) => sum + r.score, 0) + teamData.timeBonus + timeBonus;
    const newTeam: TeamData = {
      ...teamData,
      roundScores: newRoundScores,
      totalScore: newTotalScore,
      timeBonus: teamData.timeBonus + timeBonus,
      currentMonth: Math.min(activeMission + 1, 13),
      status: activeMission === 12 ? 'completed' : 'playing',
    };

    onUpdateTeam(newTeam);

    await gasService.updateMissionScore(roomId, teamData.teamId, activeMission, score, timeSeconds);
    await gasService.updateCurrentMonth(roomId, teamData.teamId, newTeam.currentMonth);
    await gasService.updateTotalScore(roomId, teamData.teamId, newTotalScore, newTeam.timeBonus);
    if (activeMission === 12) {
      await gasService.updateStatus(roomId, teamData.teamId, 'completed');
    }

    geminiService.speakTTS('Mission Clear!');
    setClearPopup({ missionId: activeMission, score, timeBonus, totalScore: newTotalScore });
    setActiveMission(null);
  }, [activeMission, teamData, onUpdateTeam, roomId]);

  const handleMissionBack = useCallback(() => {
    setActiveMission(null);
  }, []);

  // Active mission rendering
  if (activeMission !== null) {
    const gameProps = { onComplete: handleMissionComplete, onBack: handleMissionBack, startTime: missionStartTime };

    return (
      <div className="min-h-screen bg-cl-bg nb-pattern p-4">
        {activeEvent && <EventOverlay event={activeEvent} />}
        {clearPopup && (
          <MissionClearPopup
            missionId={clearPopup.missionId}
            score={clearPopup.score}
            timeBonus={clearPopup.timeBonus}
            totalScore={clearPopup.totalScore}
            onNext={() => setClearPopup(null)}
          />
        )}
        {activeMission === 1 && <R1VisionGame {...gameProps} roomId={roomId} teamId={teamData.teamId} />}
        {activeMission === 2 && <R2DiagnosisGame {...gameProps} />}
        {activeMission === 3 && <R3MeetingGame {...gameProps} roomId={roomId} teamId={teamData.teamId} />}
        {activeMission === 4 && <R4AssignmentGame {...gameProps} />}
        {activeMission === 5 && <R5TeamBuildGame {...gameProps} roomId={roomId} teamId={teamData.teamId} />}
        {activeMission === 6 && <R6RetentionGame {...gameProps} />}
        {activeMission === 7 && <R7FeedbackGame {...gameProps} roomId={roomId} teamId={teamData.teamId} />}
        {activeMission === 8 && <R8TalentGame {...gameProps} />}
        {activeMission === 9 && <R9CrisisGame {...gameProps} />}
        {activeMission === 10 && <R10ReorgGame {...gameProps} teamMembers={teamData.members} />}
        {activeMission === 11 && <R11CoachingGame {...gameProps} industryType={teamData.industryType} />}
        {activeMission === 12 && <R12FinalGame {...gameProps} teamId={teamData.teamId} roomId={roomId} />}
      </div>
    );
  }

  const completedCount = Object.keys(teamData.roundScores).length;
  const progressPercent = Math.round((completedCount / 12) * 100);

  // Roadmap view
  return (
    <div className="min-h-screen bg-cl-bg nb-pattern relative">
      {activeEvent && <EventOverlay event={activeEvent} />}
      {clearPopup && (
        <MissionClearPopup
          missionId={clearPopup.missionId}
          score={clearPopup.score}
          timeBonus={clearPopup.timeBonus}
          totalScore={clearPopup.totalScore}
          onNext={() => setClearPopup(null)}
        />
      )}

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="nb-card p-6 max-w-sm w-full">
            <h3 className="text-lg font-black text-cl-text font-[family-name:var(--font-space)] mb-4">🔐 관리자 모드</h3>
            <input
              type="text" autoComplete="off"
              value={adminPw}
              onChange={e => { setAdminPw(e.target.value); setAdminError(''); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (adminPw === ADMIN_PASSWORD) {
                    setShowAdminModal(false);
                    setAdminPw('');
                    onAdminLogin?.();
                  } else {
                    setAdminError('비밀번호가 틀렸습니다.');
                  }
                }
              }}
              placeholder="관리자 비밀번호 입력"
              className="nb-input w-full mb-3"
              autoFocus
            />
            {adminError && <p className="text-cl-red text-sm mb-3 font-bold">{adminError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdminModal(false); setAdminPw(''); setAdminError(''); }}
                className="nb-btn flex-1 py-2 bg-white text-cl-text"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (adminPw === ADMIN_PASSWORD) {
                    setShowAdminModal(false);
                    setAdminPw('');
                    onAdminLogin?.();
                  } else {
                    setAdminError('비밀번호가 틀렸습니다.');
                  }
                }}
                className="nb-btn flex-1 py-2 bg-cl-cyan text-cl-text"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b-3 border-cl-border shadow-[0_4px_0_#1A1A1A]">
        <div className="max-w-2xl mx-auto flex justify-between items-center p-3 px-4">
          <div>
            <div className="nb-badge bg-cl-gold text-cl-text text-[10px] mb-1">
              TEAM {teamData.teamId}
            </div>
            <div className="text-base font-black text-cl-text font-[family-name:var(--font-space)] leading-tight">
              {teamData.teamName}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onAdminLogin && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-[10px] text-cl-text/40 hover:text-cl-navy border-2 border-cl-border/20 hover:border-cl-navy px-2 py-1 rounded-lg transition-all font-[family-name:var(--font-mono)] font-bold"
              >
                ADMIN
              </button>
            )}
            <div className="nb-card px-4 py-2 !border-cl-navy" style={{ background: '#1E3A5F' }}>
              <div className="text-2xl font-black font-[family-name:var(--font-mono)] leading-none" style={{ color: '#FFFFFF' }}>
                {teamData.totalScore}
              </div>
              <div className="text-[9px] font-[family-name:var(--font-mono)]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                / 1,200 PTS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="nb-card p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cl-text/60 font-[family-name:var(--font-mono)]">
              📍 진행률 {completedCount}/12
            </span>
            <span className="nb-badge bg-cl-green text-cl-text">{progressPercent}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full border-2 border-cl-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cl-green to-cl-cyan rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Board-game style missions */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {QUARTER_LABELS.map((quarter) => {
          const quarterMissions = MISSIONS.filter(
            m => m.id >= quarter.range[0] && m.id <= quarter.range[1]
          );

          return (
            <div key={quarter.label} className="mb-6">
              {/* Quarter Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{quarter.emoji}</span>
                <div className={`nb-badge ${quarter.color} text-cl-text text-xs`}>
                  {quarter.label}
                </div>
                <div className="flex-1 border-b-3 border-cl-border/20" />
              </div>

              {/* Mission Cards Grid */}
              <div className="grid gap-3">
                {quarterMissions.map((mission) => {
                  const isCompleted = teamData.roundScores[mission.id] !== undefined;
                  const isActive = mission.id === teamData.currentMonth;
                  const isLocked = mission.id > teamData.currentMonth;
                  const roundScore = teamData.roundScores[mission.id];
                  const emoji = MISSION_EMOJIS[mission.id - 1] || '🎯';

                  return (
                    <div
                      key={mission.id}
                      className={`nb-card p-4 transition-all ${
                        isCompleted ? 'bg-cl-green/10 border-cl-green nb-card-hover' :
                        isActive ? 'bg-white border-cl-navy shadow-[6px_6px_0px_#1E3A5F] nb-card-hover' :
                        'bg-gray-50 opacity-50 border-cl-border/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Mission Number Circle */}
                        <div className={`w-12 h-12 rounded-xl border-3 flex items-center justify-center font-black text-lg shrink-0 ${
                          isCompleted ? 'bg-cl-green border-cl-green text-white' :
                          isActive ? 'bg-cl-navy border-cl-navy text-white animate-bounce-in' :
                          'bg-gray-200 border-cl-border/30 text-cl-text/30'
                        }`}>
                          {isCompleted ? '✓' : mission.id}
                        </div>

                        {/* Mission Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-cl-text/50 font-[family-name:var(--font-mono)] font-bold">
                              {mission.month}
                            </span>
                            <span className="text-sm">{emoji}</span>
                          </div>
                          <h3 className={`text-base font-black leading-tight ${
                            isCompleted ? 'text-cl-green' : isActive ? 'text-cl-text' : 'text-cl-text/30'
                          }`}>
                            {mission.title}
                          </h3>
                          <div className="text-[10px] text-cl-text/40 font-[family-name:var(--font-mono)] mt-0.5">
                            {mission.timeLimit}분 | +{mission.timeBonus}보너스
                          </div>
                        </div>

                        {/* Score / Action */}
                        <div className="text-right shrink-0">
                          {isCompleted && roundScore ? (
                            <div>
                              <div className="text-lg font-black text-cl-green font-[family-name:var(--font-mono)]">
                                {roundScore.score}
                              </div>
                              <div className="text-[10px] text-cl-text/40 font-[family-name:var(--font-mono)]">
                                {formatTime(roundScore.timeSeconds)}
                              </div>
                            </div>
                          ) : isActive ? (
                            <button
                              onClick={() => handleMissionStart(mission.id)}
                              className="nb-btn px-4 py-2 bg-cl-navy text-white text-sm"
                            >
                              START
                            </button>
                          ) : (
                            <div className="text-sm font-bold text-cl-text/20 font-[family-name:var(--font-mono)]">
                              {isLocked ? '🔒' : `${mission.score}pts`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* All missions complete */}
        {teamData.status === 'completed' && (
          <div className="nb-card p-8 text-center bg-cl-gold/20 border-cl-gold">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-3xl font-black text-cl-text font-[family-name:var(--font-space)] mb-2">
              ALL MISSIONS COMPLETE!
            </div>
            <p className="text-cl-text/60 font-[family-name:var(--font-mono)] text-sm">
              TOTAL SCORE: <strong className="text-cl-navy text-xl">{teamData.totalScore}</strong> / 1,200
            </p>
            <p className="text-cl-text/40 text-xs mt-2 mb-4">
              축하합니다! 12개월의 리더십 여정을 성공적으로 완수했습니다! 🏆
            </p>
            <button onClick={onBackToLanding} className="nb-btn px-6 py-2 bg-cl-navy text-white text-sm">
              처음으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
