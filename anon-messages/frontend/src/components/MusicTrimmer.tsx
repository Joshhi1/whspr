import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Check, ArrowLeft } from 'lucide-react';
import type { Track } from './MusicPicker';

const CLIP_LENGTH = 10; // seconds — how much of the preview actually gets sent
const FALLBACK_DURATION = 30; // Deezer previews are ~30s; used until metadata loads

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  track: Track;
  initialStart?: number;
  onConfirm: (startTime: number) => void;
  onBack: () => void;
}

export default function MusicTrimmer({ track, initialStart = 0, onConfirm, onBack }: Props) {
  const [duration, setDuration] = useState(FALLBACK_DURATION);
  const [start, setStart] = useState(initialStart);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => {
    const audio = new Audio(track.previewUrl!);
    audioRef.current = audio;

    const updateDuration = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.min(audio.duration, FALLBACK_DURATION));
      }
    };
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    const handleTimeUpdate = () => {
      if (audio.currentTime >= startRef.current + CLIP_LENGTH) {
        audio.pause();
        setPlaying(false);
      }
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.previewUrl]);

  const maxStart = Math.max(0, duration - CLIP_LENGTH);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.currentTime = start;
      audio.play();
      setPlaying(true);
    }
  };

  const handleDragStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = start;
    audio.play();
    setPlaying(true);
  };

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxStart);
    setStart(value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
  };

  const windowPercent = duration > 0 ? (CLIP_LENGTH / duration) * 100 : 100;
  const startPercent = duration > 0 ? (start / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="w-full sm:max-w-sm glass rounded-t-xl2 sm:rounded-xl2 p-5">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={onBack} className="text-white/50 hover:text-white transition" aria-label="Back to search">
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-display text-base font-semibold">Pick the part to send</h2>
        </div>

        <div className="flex items-center gap-3 mb-5">
          {track.albumArt && <img src={track.albumArt} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" alt="" />}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{track.title}</p>
            <p className="text-xs text-white/40 truncate">{track.artist}</p>
          </div>
        </div>

        <div className="relative h-2.5 rounded-full bg-white/10 mb-2 overflow-hidden">
          <div
            className="absolute top-0 bottom-0 bg-white rounded-full transition-all"
            style={{ left: `${startPercent}%`, width: `${windowPercent}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={maxStart}
          step={0.5}
          value={start}
          onChange={handleDrag}
          onPointerDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="w-full accent-white mb-1"
          aria-label="Drag to choose which part of the song to send"
        />

        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-white/40">
            {formatTime(start)} – {formatTime(start + CLIP_LENGTH)}
          </p>
          <p className="text-xs text-white/30">{CLIP_LENGTH}s clip</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 transition flex-shrink-0"
            aria-label={playing ? 'Pause' : 'Preview this part'}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => onConfirm(start)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white text-ink font-medium py-3 text-sm hover:bg-white/90 active:scale-[0.98] transition"
          >
            <Check size={15} /> Use this part
          </button>
        </div>
      </div>
    </div>
  );
}
