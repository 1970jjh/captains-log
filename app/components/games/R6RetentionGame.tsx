'use client';

import React, { useState, useRef, useEffect } from 'react';
import { R6_STORY, R6_MISSION_IMAGE, R6_SONG_URL, R6_LYRICS, R6_LEADER_ROLES, R6_CLEAR_MESSAGE, MISSIONS } from '../../constants';

interface Props {
  onComplete: (score: number, timeSeconds: number) => void;
  onBack: () => void;
  startTime: number;
}

type Phase = 'intro' | 'playing' | 'result';

export default function R6RetentionGame({ onComplete, onBack, startTime }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mission = MISSIONS[5];

  // Count total blanks
  const totalBlanks = R6_LYRICS.reduce((sum, l) => sum + l.blanks.length, 0);
  const filledCount = Object.keys(answers).length;
  const allFilled = filledCount >= totalBlanks;

  // Audio controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
  }, [phase]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekAudio = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  const handleSeekBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Generate unique key for each blank
  const getBlankKey = (lineIdx: number, blankIdx: number) => `${lineIdx}-${blankIdx}`;

  const handleInputChange = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleCheck = () => {
    let correct = 0;
    R6_LYRICS.forEach((line, li) => {
      line.blanks.forEach((blank, bi) => {
        const key = getBlankKey(li, bi);
        const userAnswer = (answers[key] || '').trim().replace(/\s/g, '');
        const correctAnswer = blank.answer.replace(/\s/g, '');
        if (userAnswer === correctAnswer) correct++;
      });
    });
    setCorrectCount(correct);
    setPhase('result');
    // Stop music
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleClear = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const ratio = totalBlanks > 0 ? correctCount / totalBlanks : 0;
    const scorePercent = 15 + ratio * 85; // 15% minimum, up to 100%
    const finalScore = Math.round(mission.score * (scorePercent / 100));
    onComplete(finalScore, elapsed);
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
        <p className="text-cl-text/70 text-sm mb-4 leading-relaxed whitespace-pre-line">{R6_STORY}</p>

        <div className="nb-card p-2 mb-5">
          <img src={R6_MISSION_IMAGE} alt="6월 미션 안내" className="w-full rounded-lg border-2 border-cl-border" />
        </div>

        <div className="nb-card p-4 bg-cl-gold/10 border-cl-gold mb-5">
          <h3 className="text-sm font-black text-cl-navy mb-2">&#127919; 미션 규칙</h3>
          <ul className="text-xs text-cl-text/70 space-y-1 leading-relaxed">
            <li>&bull; 노래를 들으며 가사의 <strong>빈칸(초성 힌트)</strong>을 채우세요</li>
            <li>&bull; 모든 빈칸을 채우면 <strong>&lsquo;팀 리더 역할 확인&rsquo;</strong> 버튼 활성화</li>
            <li>&bull; 전부 틀려도 <strong>통과는 됩니다!</strong> 단, 정답 수에 따라 점수 차등</li>
            <li>&bull; 확인 후 정답 가사 + 팀장의 12가지 역할 정리를 확인할 수 있습니다</li>
          </ul>
        </div>

        <button onClick={() => setPhase('playing')} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          &#127925; 노래 듣고 빈칸 채우기!
        </button>
      </div>
    );
  }

  // ============ RESULT ============
  if (phase === 'result') {
    return (
      <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">&#127942;</div>
          <h2 className="text-2xl font-black text-cl-green font-[family-name:var(--font-space)] mb-1">MISSION CLEAR!</h2>
        </div>

        {/* Score */}
        <div className="nb-card p-4 mb-4 text-center">
          <span className="text-4xl font-black text-cl-navy font-[family-name:var(--font-mono)]">{correctCount}</span>
          <span className="text-cl-text/40 text-lg">/{totalBlanks} 정답</span>
          <div className="mt-2 text-sm text-cl-text/50">
            미션 점수: <strong className="text-cl-navy text-lg">{Math.round(mission.score * ((15 + (correctCount / totalBlanks) * 85) / 100))}</strong>/{mission.score}점
          </div>
        </div>

        {/* Full Lyrics with answers */}
        <div className="nb-card p-4 mb-4 bg-cl-bg">
          <h3 className="text-sm font-bold text-cl-navy mb-3">&#127925; 정답 가사 &mdash; 항해일지 (Captain&apos;s Log)</h3>
          <div className="space-y-1.5 text-sm">
            {R6_LYRICS.map((line, li) => {
              if (!line.line) return <div key={li} className="h-3" />;

              let displayLine = line.line;
              line.blanks.forEach((blank, bi) => {
                const key = getBlankKey(li, bi);
                const userAnswer = (answers[key] || '').trim();
                const isCorrect = userAnswer.replace(/\s/g, '') === blank.answer.replace(/\s/g, '');
                const marker = isCorrect
                  ? `<span class="font-bold text-cl-green">${blank.answer}</span>`
                  : `<span class="font-bold text-cl-red line-through">${userAnswer || '?'}</span> <span class="font-bold text-cl-navy">${blank.answer}</span>`;
                displayLine = displayLine.replace(`({${bi}})`, marker);
              });

              return (
                <p key={li} className="text-cl-text/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: displayLine }} />
              );
            })}
          </div>
        </div>

        {/* 12 Roles */}
        <div className="nb-card p-4 mb-4">
          <h3 className="text-sm font-bold text-cl-navy mb-3">&#128218; 팀 리더의 12가지 역할</h3>
          <div className="grid grid-cols-2 gap-2">
            {R6_LEADER_ROLES.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-cl-bg">
                <span className="text-lg shrink-0">{r.icon}</span>
                <div>
                  <span className="font-bold text-cl-text">{r.role}</span>
                  <p className="text-cl-text/50 text-[10px] mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Insight */}
        <div className="nb-card p-4 bg-cl-navy/5 mb-5">
          <p className="text-sm text-cl-text/70 leading-relaxed whitespace-pre-line">{R6_CLEAR_MESSAGE}</p>
        </div>

        <button onClick={handleClear} className="nb-btn w-full py-3 bg-cl-navy text-white text-sm">
          NEXT MISSION &rarr;
        </button>
      </div>
    );
  }

  // ============ PLAYING ============
  return (
    <div className="nb-card rounded-2xl p-5 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <button onClick={onBack} className="text-cl-text/40 hover:text-cl-text text-sm">&larr; BACK</button>
        <span className="nb-badge bg-cl-navy text-white text-[10px]">
          {filledCount}/{totalBlanks} 입력됨
        </span>
      </div>

      <h2 className="text-lg font-bold text-cl-navy font-[family-name:var(--font-space)] mb-3">
        &#127925; 항해일지 (Captain&apos;s Log)
      </h2>

      {/* Audio Player */}
      <div className="nb-card p-4 mb-5 bg-cl-navy/5 border-cl-navy">
        <audio ref={audioRef} src={R6_SONG_URL} preload="metadata" />

        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => seekAudio(-10)} className="nb-btn px-2.5 py-1.5 bg-white text-cl-text text-xs">
            -10s
          </button>
          <button onClick={togglePlay} className="nb-btn px-5 py-2 bg-cl-navy text-white text-sm">
            {isPlaying ? '&#9208; 일시정지' : '&#9654; 재생'}
          </button>
          <button onClick={() => seekAudio(10)} className="nb-btn px-2.5 py-1.5 bg-white text-cl-text text-xs">
            +10s
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-cl-text/40 w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeekBar}
            className="flex-1 h-2 accent-cl-navy"
          />
          <span className="text-[10px] font-[family-name:var(--font-mono)] text-cl-text/40 w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Lyrics with blanks */}
      <div className="space-y-2 mb-6">
        {R6_LYRICS.map((line, li) => {
          if (!line.line) return <div key={li} className="h-2" />;

          if (line.blanks.length === 0) {
            return (
              <p key={li} className="text-sm text-cl-text/60 leading-relaxed">
                {line.line}
              </p>
            );
          }

          // Render line with inline inputs
          const parts = line.line.split(/\(\{(\d+)\}\)/);
          let blankIndex = 0;

          return (
            <p key={li} className="text-sm text-cl-text/70 leading-loose flex flex-wrap items-center gap-0.5">
              {parts.map((part, pi) => {
                if (pi % 2 === 0) {
                  return <span key={pi}>{part}</span>;
                }
                const bi = blankIndex++;
                const blank = line.blanks[bi];
                if (!blank) return null;
                const key = getBlankKey(li, bi);
                const charWidth = Math.max(blank.answer.length * 1.2, 3);

                return (
                  <span key={pi} className="inline-flex items-center gap-0.5 mx-0.5">
                    <input
                      type="text"
                      value={answers[key] || ''}
                      onChange={e => handleInputChange(key, e.target.value)}
                      placeholder={blank.hint}
                      className="nb-input py-1 px-2 text-sm text-center font-bold text-cl-navy bg-cl-gold/10 border-cl-gold/50"
                      style={{ width: `${charWidth}em`, minWidth: '3em' }}
                    />
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>

      {/* Submit */}
      <button
        onClick={handleCheck}
        disabled={!allFilled}
        className="nb-btn w-full py-3 bg-cl-navy text-white text-sm disabled:opacity-40"
      >
        {allFilled ? '&#128270; 팀 리더 역할 확인' : `빈칸을 모두 채워주세요 (${filledCount}/${totalBlanks})`}
      </button>
    </div>
  );
}
