'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppState, TeamData, IndustryType } from './types';
import Landing from './components/Landing';
import MissionRoadmap from './components/MissionRoadmap';
import AdminDashboard from './components/AdminDashboard';
import { gasService } from './lib/gasService';
import { geminiService } from './lib/geminiService';

const STORAGE_KEY = 'captainslog_appstate';

const DEFAULT_STATE: AppState = { phase: 'landing', teamData: null, gameStarted: false, activeEvent: null, roomId: 'room-default' };

export default function Home() {
  const [appState, setAppState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [industryType, setIndustryType] = useState<IndustryType>(IndustryType.LEADERSHIP);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        if (parsed.teamData && parsed.phase === 'roadmap') {
          setAppState({ ...parsed, activeEvent: null });
        } else if (parsed.phase === 'admin') {
          setAppState({ ...parsed, activeEvent: null });
        }
      }
    } catch {
      // Corrupted data, start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    try {
      const toSave = { ...appState, activeEvent: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Storage full or unavailable
    }
  }, [appState]);

  useEffect(() => {
    if (appState.phase !== 'landing' || appState.teamData) return;
    const roomId = appState.roomId || 'room-default';
    const poll = async () => {
      try {
        const result = await gasService.getGameState(roomId);
        if (result.success && result.data) {
          const state = result.data as unknown as { gameStarted: boolean };
          setAppState(prev => ({ ...prev, gameStarted: state.gameStarted || false }));
        }
      } catch {
        // Non-critical
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [appState.phase, appState.teamData, appState.roomId]);

  useEffect(() => {
    if (appState.gameStarted && appState.teamData && appState.phase === 'landing') {
      geminiService.speakTTS('Game Start!');
      setAppState(prev => ({ ...prev, phase: 'roadmap' }));
    }
  }, [appState.gameStarted, appState.teamData, appState.phase]);

  const handleTeamRegistered = useCallback((team: TeamData) => {
    setAppState(prev => ({
      ...prev,
      teamData: team,
      phase: 'roadmap',
    }));
  }, []);

  const handleAdminLogin = useCallback(() => {
    setAppState(prev => ({ ...prev, phase: 'admin' }));
  }, []);

  const handleBackToLanding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAppState(prev => ({
      ...prev,
      phase: 'landing',
      teamData: null,
      roomId: 'room-default',
    }));
  }, []);

  const handleRoomIdChange = useCallback((roomId: string) => {
    setAppState(prev => ({ ...prev, roomId }));
  }, []);

  const handleUpdateTeam = useCallback((team: TeamData) => {
    setAppState(prev => ({ ...prev, teamData: team }));
  }, []);

  if (!hydrated) {
    return <main className="min-h-screen bg-cl-bg nb-pattern" />;
  }

  return (
    <main className="min-h-screen bg-cl-bg nb-pattern relative overflow-hidden">
      {appState.phase === 'landing' && (
        <Landing
          onTeamRegistered={handleTeamRegistered}
          onAdminLogin={handleAdminLogin}
          gameStarted={appState.gameStarted}
          roomId={appState.roomId || 'room-default'}
          onRoomIdChange={handleRoomIdChange}
          industryType={industryType}
          onIndustryTypeChange={setIndustryType}
        />
      )}

      {appState.phase === 'roadmap' && appState.teamData && (
        <MissionRoadmap
          teamData={appState.teamData}
          onUpdateTeam={handleUpdateTeam}
          roomId={appState.roomId || 'room-default'}
          onAdminLogin={handleAdminLogin}
          onBackToLanding={handleBackToLanding}
        />
      )}

      {appState.phase === 'admin' && (
        <AdminDashboard onBack={handleBackToLanding} industryType={industryType} onIndustryTypeChange={setIndustryType} />
      )}
    </main>
  );
}
