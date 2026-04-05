'use client';

import React, { useState } from 'react';
import { TeamData, TeamMember, IndustryType } from '../types';
import { ADMIN_PASSWORD, ROLES } from '../constants';
import { gasService } from '../lib/gasService';

interface LandingProps {
  onTeamRegistered: (team: TeamData) => void;
  onAdminLogin: () => void;
  gameStarted: boolean;
  roomId: string;
  onRoomIdChange: (roomId: string) => void;
  industryType: IndustryType;
  onIndustryTypeChange: (type: IndustryType) => void;
}

export default function Landing({ onTeamRegistered, onAdminLogin, gameStarted, roomId, onRoomIdChange, industryType }: LandingProps) {
  const [phase, setPhase] = useState<'intro' | 'register' | 'admin-login'>('intro');
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<TeamMember[]>(ROLES.map(r => ({ role: r.label, name: '' })));
  const [adminPw, setAdminPw] = useState('');
  const [adminError, setAdminError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  const handleAdminLogin = () => {
    if (adminPw === ADMIN_PASSWORD) {
      onAdminLogin();
    } else {
      setAdminError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleRegister = async () => {
    const tid = parseInt(teamId);
    if (!tid || tid < 1) {
      setRegError('팀 번호를 입력하세요.');
      return;
    }
    if (!teamName.trim()) {
      setRegError('팀 이름을 입력하세요.');
      return;
    }
    const filledMembers = members.filter(m => m.name.trim());
    if (filledMembers.length < 1) {
      setRegError('최소 1명의 팀원 이름을 입력하세요.');
      return;
    }

    setRegistering(true);
    setRegError('');

    await gasService.registerTeam(
      roomId, tid, teamName,
      filledMembers.map(m => m.name).join(','),
      filledMembers.map(m => m.role).join(','),
      industryType
    );

    const team: TeamData = {
      teamId: tid,
      teamName,
      members: filledMembers,
      industryType,
      currentMonth: 1,
      totalScore: 0,
      timeBonus: 0,
      roundScores: {},
      status: 'playing',
      registeredAt: Date.now(),
    };

    setRegistering(false);
    onTeamRegistered(team);
  };

  const updateMemberName = (index: number, name: string) => {
    setMembers(prev => prev.map((m, i) => i === index ? { ...m, name } : m));
  };

  // ============ INTRO SCREEN ============
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 nb-pattern">
        <div className="relative z-10 text-center max-w-lg w-full">
          <div className="inline-block nb-badge bg-cl-gold text-cl-text mb-4 text-sm tracking-widest font-[family-name:var(--font-mono)]">
            LEADERSHIP SIMULATION
          </div>

          <h1 className="text-5xl md:text-7xl font-black font-[family-name:var(--font-space)] text-cl-text mb-1 leading-tight">
            CAPTAIN&apos;S{' '}
            <span className="text-cl-navy">LOG</span>
          </h1>
          <p className="text-cl-text/50 text-sm mb-6 font-[family-name:var(--font-mono)] tracking-wider">
            신임 팀장의 리더십 12개월 시뮬레이션
          </p>

          <div className="nb-card p-5 mb-6 text-left">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">&#128203;</span>
              <div>
                <h3 className="font-extrabold text-cl-text text-base">인사 발령 통지서</h3>
                <p className="text-xs text-cl-text/50 font-[family-name:var(--font-mono)]">인사팀 발행</p>
              </div>
            </div>
            <p className="text-sm text-cl-text/70 leading-relaxed">
              &ldquo;축하합니다, <strong className="text-cl-navy">팀장님</strong>.&rdquo;
              신규 프로젝트팀 팀장으로 발령받은 당신.
              12개월 안에 팀을 하나로 만들고 <strong className="text-cl-red">프로젝트를 성공</strong>시켜야 합니다!
            </p>
          </div>

          <div className="nb-card p-3 mb-6">
            <video
              className="w-full rounded-lg border-2 border-cl-border"
              controls
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect fill='%23FFFDF7' width='640' height='360'/%3E%3Ctext fill='%231E3A5F' x='320' y='170' text-anchor='middle' font-size='28' font-weight='bold'%3ECAPTAIN'S LOG%3C/text%3E%3Ctext fill='%23D4A017' x='320' y='210' text-anchor='middle' font-size='16'%3E%E2%96%B6 %EC%98%A4%ED%94%84%EB%8B%9D %EC%98%81%EC%83%81%3C/text%3E%3C/svg%3E"
            >
              <source src="/videos/opening.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="nb-card p-4 mb-5">
            <label className="text-xs text-cl-text/60 font-[family-name:var(--font-mono)] mb-2 block font-bold uppercase tracking-widest">
              ROOM ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={e => onRoomIdChange(e.target.value)}
              placeholder="room-default"
              className="nb-input w-full text-center text-sm"
            />
            <p className="text-[10px] text-cl-text/40 text-center mt-1.5">강사가 안내한 방 코드를 입력하세요</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setPhase('register')}
              className="nb-btn w-full py-4 text-lg bg-cl-navy text-white"
            >
              MISSION START
            </button>
            <button
              onClick={() => setPhase('admin-login')}
              className="w-full py-3 text-sm text-cl-text/40 hover:text-cl-text/70 transition-all font-[family-name:var(--font-mono)] border-2 border-cl-border/20 rounded-xl hover:border-cl-border/40"
            >
              ADMIN ACCESS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ ADMIN LOGIN ============
  if (phase === 'admin-login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 nb-pattern">
        <div className="nb-card p-8 max-w-md w-full">
          <h2 className="text-2xl font-black text-cl-text mb-6 text-center font-[family-name:var(--font-space)]">
            ADMIN ACCESS
          </h2>
          <input
            type="password"
            value={adminPw}
            onChange={e => { setAdminPw(e.target.value); setAdminError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            placeholder="Access Code"
            className="nb-input w-full mb-4"
          />
          {adminError && <p className="text-cl-red text-sm mb-4 font-bold">{adminError}</p>}
          <div className="flex gap-3">
            <button onClick={() => setPhase('intro')} className="nb-btn flex-1 py-3 bg-white text-cl-text">
              BACK
            </button>
            <button onClick={handleAdminLogin} className="nb-btn flex-1 py-3 bg-cl-gold text-cl-text">
              LOGIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ TEAM REGISTRATION ============
  return (
    <div className="min-h-screen flex items-center justify-center p-4 nb-pattern">
      <div className="nb-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="inline-block nb-badge bg-cl-green text-cl-text mb-2">STEP 2</div>
          <h2 className="text-2xl font-black text-cl-text font-[family-name:var(--font-space)]">
            TEAM REGISTRATION
          </h2>
          <p className="text-xs text-cl-text/50 mt-1">리더십 미션 수행을 위한 팀 등록</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-cl-text/60 font-[family-name:var(--font-mono)] mb-1 block font-bold">TEAM ID</label>
              <input
                type="number"
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                placeholder="1"
                min={1}
                className="nb-input w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-cl-text/60 font-[family-name:var(--font-mono)] mb-1 block font-bold">TEAM NAME</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="팀 이름"
                className="nb-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-cl-text/60 font-[family-name:var(--font-mono)] mb-2 block font-bold">TEAM MEMBERS</label>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="nb-badge bg-cl-gold/60 text-cl-text w-28 text-center truncate text-[11px]">
                    {m.role}
                  </span>
                  <input
                    type="text"
                    value={m.name}
                    onChange={e => updateMemberName(i, e.target.value)}
                    placeholder="이름"
                    className="nb-input flex-1 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {regError && (
            <div className="nb-badge bg-cl-red/20 text-cl-red border-cl-red w-full text-center py-2">
              {regError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setPhase('intro')} className="nb-btn flex-1 py-3 bg-white text-cl-text">
              BACK
            </button>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="nb-btn flex-1 py-3 bg-cl-navy text-white disabled:opacity-50"
            >
              {registering ? '등록 중...' : 'JOIN MISSION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
