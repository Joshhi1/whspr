import React, { useEffect, useRef, useState } from 'react';
import { Search, Play, Pause, Check, X } from 'lucide-react';
import { api } from '../lib/api';

export interface Track {
  id: number;
  title: string;
  artist: string;
  albumArt: string | null;
  previewUrl: string | null;
}

interface Props {
  onSelect: (track: Track) => void;
  onClose: () => void;
}

export default function MusicPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setTracks([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { tracks } = await api(`/public/music/search?q=${encodeURIComponent(query)}`, { auth: false });
        setTracks(tracks);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePreview = (track: Track) => {
    if (!track.previewUrl) return;

    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(track.previewUrl);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm glass rounded-t-xl2 sm:rounded-xl2 p-5 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-semibold">Add a song</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-line px-3.5 py-2.5 mb-3 flex-shrink-0">
          <Search size={15} className="text-white/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a song…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-white/30"
          />
        </div>

        <div className="overflow-y-auto flex-1 space-y-1.5 -mx-1 px-1">
          {loading && <div className="h-14 skeleton rounded-xl" />}

          {!loading &&
            tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition">
                <button
                  onClick={() => togglePreview(track)}
                  disabled={!track.previewUrl}
                  className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden group disabled:opacity-40"
                  aria-label="Preview"
                >
                  {track.albumArt && <img src={track.albumArt} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    {playingId === track.id ? <Pause size={16} /> : <Play size={16} />}
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-white/40 truncate">{track.artist}</p>
                </div>
                <button
                  onClick={() => onSelect(track)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white text-white hover:text-ink transition flex-shrink-0"
                  aria-label="Select this song"
                >
                  <Check size={14} />
                </button>
              </div>
            ))}

          {!loading && query && tracks.length === 0 && (
            <p className="text-center text-white/40 text-sm py-8">No songs found</p>
          )}
        </div>
      </div>
    </div>
  );
}
