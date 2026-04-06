'use client';

import React, { useState, useCallback } from 'react';
import { R11_WORD_STORY, R11_MISSION_IMAGE, R11_CLEAR_MSG, R11_WORDS_EN, R11_WORDS_KR, R11_FILLER_EN, R11_FILLER_KR, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
  industryType: number;
}

type Phase = 'intro' | 'version-select' | 'playing' | 'result';
type VersionType = 'en' | 'kr';

const GRID_SIZE = 8;

interface WordItem { answer: string; question: string }

function shuffleArray<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function buildGrid(words: WordItem[], filler: string): { grid: string[][]; positions: Record<string, { r: number; c: number }[]> } {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
  const positions: Record<string, { r: number; c: number }[]> = {};
  const directions = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[-1,1],[1,-1]];

  for (const wordObj of words) {
    const word = wordObj.answer;
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 300) {
      attempts++;
      const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
      const minR = dr === -1 ? word.length - 1 : 0;
      const maxR = dr === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;
      const minC = dc === -1 ? word.length - 1 : 0;
      const maxC = dc === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;
      if (maxR < minR || maxC < minC) continue;

      const row = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
      const col = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

      let canPlace = true;
      const pos: { r: number; c: number }[] = [];
      for (let i = 0; i < word.length; i++) {
        const r = row + i * dr;
        const c = col + i * dc;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || (grid[r][c] !== '' && grid[r][c] !== word[i])) {
          canPlace = false;
          break;
        }
        pos.push({ r, c });
      }
      if (canPlace) {
        pos.forEach((p, i) => { grid[p.r][p.c] = word[i]; });
        positions[word] = pos;
        placed = true;
      }
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = filler[Math.floor(Math.random() * filler.length)];
      }
    }
  }
  return { grid, positions };
}

export default function R11CoachingGame({ onComplete, onBack, startTime }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [version, setVersion] = useState<VersionType>('en');
  const [words, setWords] = useState<WordItem[]>([]);
  const [grid, setGrid] = useState<string[][]>([]);
  const [wordPositions, setWordPositions] = useState<Record<string, { r: number; c: number }[]>>({});
  const [selectedCells, setSelectedCells] = useState<{ r: number; c: number }[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const mission = MISSIONS[10];

  const initGame = useCallback((ver: VersionType) => {
    const w = ver === 'en' ? [...R11_WORDS_EN] : [...R11_WORDS_KR];
    const filler = ver === 'en' ? R11_FILLER_EN : R11_FILLER_KR;
    const { grid: g, positions: p } = buildGrid(w, filler);
    setWords(w);
    setGrid(g);
    setWordPositions(p);
    setSelectedCells([]);
    setFoundWords([]);
    setCurrentQ(0);
    setConsecutiveErrors(0);
  }, []);

  const reshuffleGrid = useCallback(() => {
    const filler = version === 'en' ? R11_FILLER_EN : R11_FILLER_KR;
    const remaining = words.filter(w => !foundWords.includes(w.answer));
    const found = words.filter(w => foundWords.includes(w.answer));
    const { grid: g, positions: p } = buildGrid([...found, ...remaining], filler);
    setGrid(g);
    setWordPositions(p);
    setSelectedCells([]);
    setConsecutiveErrors(0);
  }, [version, words, foundWords]);

  const handleVersionSelect = (ver: VersionType) => {
    setVersion(ver);
    initGame(ver);
    setPhase('playing');
  };

  const handleCellClick = (r: number, c: number) => {
    // Already found cell?
    const isInFound = foundWords.some(w => wordPositions[w]?.some(p => p.r === r && p.c === c));
    if (isInFound) return;

    const isAlready = selectedCells.some(cell => cell.r === r && cell.c === c);
    if (isAlready) {
      setSelectedCells(prev => prev.filter(cell => !(cell.r === r && cell.c === c)));
      return;
    }

    const newSelected = [...selectedCells, { r, c }];
    setSelectedCells(newSelected);

    const currentWord = words[currentQ]?.answer;
    if (!currentWord) return;

    const currentString = newSelected.map(cell => grid[cell.r][cell.c]).join('');
    const reverseString = currentString.split('').reverse().join('');

    if (currentString === currentWord || reverseString === currentWord) {
      // Found!
      setFoundWords(prev => [...prev, currentWord]);
      setSelectedCells([]);
      setConsecutiveErrors(0);

      if (currentQ + 1 >= words.length) {
        setTimeout(() => setPhase('result'), 500);
      } else {
        setCurrentQ(prev => prev + 1);
      }
    } else if (currentString.length >= currentWord.length) {
      // Wrong — too many chars selected
      setMistakes(prev => prev + 1);
      const newConsec = consecutiveErrors + 1;
      setConsecutiveErrors(newConsec);
      setSelectedCells([]);

      if (newConsec >= 3) {
        // Reshuffle grid
        setTimeout(() => reshuffleGrid(), 300);
      }
    }
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const penalty = mistakes * 2;
    const finalScore = Math.max(Math.round(mission.score * 0.6), mission.score - penalty);
    onComplete(finalScore, elapsed);
  };

  const isCellInFoundWord = (r: number, c: number) => {
    return foundWords.some(w => wordPositions[w]?.some(p => p.r === r && p.c === c));
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
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R11_WORD_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R11_MISSION_IMAGE} alt="11월 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-5">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#127919; 미션 규칙</h3>
          <ul className="text-xs text-cl-text/70 space-y-1 leading-relaxed">
            <li>&bull; <strong>영어 버전</strong> 또는 <strong>한글 버전</strong> 중 택 1</li>
            <li>&bull; 8&times;8 글자판에서 전략 키워드 <strong>10개</strong> 찾기</li>
            <li>&bull; 문제를 읽고, 정답 글자를 <strong>순서대로 클릭</strong></li>
            <li>&bull; 잘못된 글자 선택 시 초기화 + 오답 카운트</li>
            <li>&bull; <strong>연속 3회 오답</strong> 시 &rarr; 글자판 재배치!</li>
            <li>&bull; 오답 1회당 <strong>-2점</strong> (최소 {Math.round(mission.score * 0.6)}점 보장)</li>
          </ul>
        </div>

        <button onClick={() => setPhase('version-select')} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#127919; 버전 선택하기
        </button>
      </div>
    );
  }

  // ============ VERSION SELECT ============
  if (phase === 'version-select') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <button onClick={() => setPhase('intro')} className="text-cl-text/40 hover:text-cl-text text-sm mb-4">&larr; BACK</button>
        <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-4 text-center">전략적 사고 버전 선택</h2>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleVersionSelect('en')} className="nb-card p-6 text-center nb-card-hover hover:border-cl-navy transition-all">
            <div className="text-3xl mb-2">&#127462;</div>
            <h3 className="font-black text-cl-navy text-lg mb-1">영어 버전</h3>
            <p className="text-xs text-cl-text/50">SWOT, OKR, KPI, MECE...</p>
            <p className="text-[10px] text-cl-text/30 mt-2">3~4글자 영문 약어</p>
          </button>
          <button onClick={() => handleVersionSelect('kr')} className="nb-card p-6 text-center nb-card-hover hover:border-cl-navy transition-all">
            <div className="text-3xl mb-2">&#127472;&#127479;</div>
            <h3 className="font-black text-cl-navy text-lg mb-1">한글 버전</h3>
            <p className="text-xs text-cl-text/50">애자일, 피봇, 블루오션...</p>
            <p className="text-[10px] text-cl-text/30 mt-2">2~5글자 한글 용어</p>
          </button>
        </div>
      </div>
    );
  }

  // ============ RESULT ============
  if (phase === 'result') {
    const penalty = mistakes * 2;
    const finalScore = Math.max(Math.round(mission.score * 0.6), mission.score - penalty);

    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">&#127942;</div>
          <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
          <p className="text-sm text-cl-text/50">전략적 사고 마스터! ({version === 'en' ? '영어' : '한글'} 버전)</p>
        </div>

        <div className="nb-card p-4 mb-4 text-center">
          <span className="text-4xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{finalScore}</span>
          <span className="text-cl-text/40 text-lg">/{mission.score}점</span>
          <div className="text-xs text-cl-text/40 mt-1">오답 {mistakes}회 (감점 -{penalty}점)</div>
          {mistakes === 0 && <div className="nb-badge bg-cl-gold text-cl-text border-cl-gold mt-2 text-xs">&#127775; PERFECT!</div>}
        </div>

        {/* Answers review */}
        <div className="nb-card p-4 mb-4">
          <h3 className="text-sm font-bold text-cl-navy mb-3">&#128218; 10가지 전략 키워드</h3>
          <div className="space-y-1.5">
            {words.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-cl-bg">
                <span className="font-black text-cl-navy font-[family-name:var(--font-mono)] w-16 shrink-0">{w.answer}</span>
                <span className="text-cl-text/50 flex-1 text-[11px]">{w.question.substring(0, 50)}...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="nb-card p-4 bg-cl-navy/5 mb-5">
          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R11_CLEAR_MSG}</p>
        </div>

        <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          NEXT MISSION &rarr;
        </button>
      </div>
    );
  }

  // ============ PLAYING ============
  const currentWord = words[currentQ];
  const currentString = selectedCells.map(cell => grid[cell.r]?.[cell.c] || '').join('');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="nb-card rounded-2xl p-3 mb-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr;</button>
          <div className="flex items-center gap-3">
            <span className="nb-badge bg-cl-green/20 text-cl-green border-cl-green text-[10px]">&#10003; {foundWords.length}/10</span>
            <span className="text-xs text-cl-red font-[family-name:var(--font-mono)] font-bold">&times; {mistakes}회</span>
            <span className="nb-badge bg-cl-navy text-white text-[10px]">{version === 'en' ? 'ENG' : 'KOR'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Question */}
        <div className="space-y-3">
          <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold">
            <div className="flex items-center gap-2 mb-2">
              <span className="nb-badge bg-cl-navy text-white text-xs">Q{currentQ + 1}</span>
              <span className="text-xs text-cl-text/40 font-[family-name:var(--font-mono)]">{currentWord?.answer.length}글자</span>
            </div>
            <p className="text-sm text-cl-text/80 leading-relaxed">{currentWord?.question}</p>
          </div>

          {/* Word list */}
          <div className="nb-card p-3">
            <h3 className="text-[10px] font-bold text-cl-text/40 mb-2 font-[family-name:var(--font-mono)]">FOUND</h3>
            <div className="flex flex-wrap gap-1.5">
              {words.map((w, i) => (
                <span key={i} className={`nb-badge text-[9px] ${
                  foundWords.includes(w.answer) ? 'bg-cl-green/20 text-cl-green border-cl-green' :
                  i === currentQ ? 'bg-cl-gold/30 text-cl-navy border-cl-gold' :
                  'bg-gray-100 text-cl-text/30'
                }`}>
                  {foundWords.includes(w.answer) ? w.answer : i === currentQ ? `Q${i+1} ???` : `Q${i+1}`}
                </span>
              ))}
            </div>
          </div>

          {/* Selection display */}
          <div className="nb-card p-3 text-center">
            <span className="text-xs text-cl-text/40 font-[family-name:var(--font-mono)]">현재 선택: </span>
            <span className="text-lg font-black text-cl-navy font-[family-name:var(--font-mono)] tracking-widest">{currentString || '...'}</span>
            {selectedCells.length > 0 && (
              <button onClick={() => setSelectedCells([])} className="block mx-auto mt-1 text-[10px] text-cl-red font-[family-name:var(--font-mono)] hover:underline">
                선택 초기화
              </button>
            )}
          </div>

          {consecutiveErrors >= 2 && (
            <div className="nb-card p-2 bg-cl-red/10 border-cl-red text-center">
              <p className="text-[10px] text-cl-red font-bold">&#9888; {consecutiveErrors}회 연속 오답! 1회 더 틀리면 글자판이 재배치됩니다!</p>
            </div>
          )}
        </div>

        {/* Right: Grid */}
        <div className="flex flex-col items-center">
          <div className="nb-card p-3 inline-block">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
              {grid.map((row, r) => row.map((char, c) => {
                const isSelected = selectedCells.some(cell => cell.r === r && cell.c === c);
                const isFound = isCellInFoundWord(r, c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all border-2 ${
                      isFound ? 'bg-cl-green/20 text-cl-green border-cl-green' :
                      isSelected ? 'bg-cl-navy text-white border-cl-navy shadow-[0_0_10px_rgba(30,58,95,0.5)] scale-105' :
                      'bg-white text-cl-text/60 border-cl-border/20 hover:bg-cl-navy/5 hover:border-cl-navy/40'
                    }`}
                  >
                    {char}
                  </button>
                );
              }))}
            </div>
          </div>
          <p className="text-[10px] text-cl-text/30 mt-2 font-[family-name:var(--font-mono)]">
            글자를 순서대로 클릭하세요 (가로/세로/대각선)
          </p>
        </div>
      </div>
    </div>
  );
}
