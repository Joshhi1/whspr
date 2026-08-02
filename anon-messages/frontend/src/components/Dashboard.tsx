import React, { useEffect, useRef, useState } from 'react';
import { Copy, Share2, Trash2, MessageCircleOff, RefreshCw, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  body: string;
  music_title: string | null;
  music_artist: string | null;
  music_preview_url: string | null;
  music_album_art: string | null;
  is_read: boolean;
  created_at: string;
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = (msg: Message) => {
    if (!msg.music_preview_url) return;
    if (playingId === msg.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(msg.music_preview_url);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(msg.id);
  };

  const link = profile ? `${window.location.origin}/u/${profile.username}` : '';

  const load = async () => {
    try {
      const { messages } = await api('/messages');
      setMessages(messages);
    } catch {
      toast.error('Could not load your inbox');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('inbox-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${profile.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied');
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Send me an anonymous message', url: link });
      } catch {
        // user cancelled — no-op
      }
    } else {
      copyLink();
    }
  };

  const markRead = async (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    try {
      await api(`/messages/${id}/read`, { method: 'PATCH' });
    } catch {
      // silent — not critical if this fails
    }
  };

  const remove = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await api(`/messages/${id}`, { method: 'DELETE' });
    } catch {
      toast.error('Could not delete message');
      load();
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="glass rounded-xl2 p-6 text-center">
        <p className="text-xs text-white/50 mb-2">Your link</p>
        <p className="font-display text-lg font-semibold break-all mb-4">{link}</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/15 px-4 py-2 text-sm transition"
          >
            <Copy size={14} /> Copy
          </button>
          <button
            onClick={shareLink}
            className="flex items-center gap-1.5 rounded-full bg-white text-ink hover:bg-white/90 px-4 py-2 text-sm font-medium transition"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Your messages</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 skeleton rounded-xl2" />
          <div className="h-20 skeleton rounded-xl2" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center text-white/40 text-sm py-16 flex flex-col items-center gap-2">
          <MessageCircleOff size={24} className="text-white/20" />
          Share your link to start receiving messages
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => !msg.is_read && markRead(msg.id)}
              className={`glass rounded-xl2 p-4 transition ${!msg.is_read ? 'border-white/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-white/90 whitespace-pre-wrap break-words flex-1">{msg.body}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(msg.id);
                  }}
                  className="text-white/30 hover:text-red-400 transition flex-shrink-0"
                  aria-label="Delete message"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {msg.music_title && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePreview(msg);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg bg-white/5 hover:bg-white/10 p-2 mt-2 transition text-left"
                >
                  {msg.music_album_art && (
                    <img src={msg.music_album_art} className="w-9 h-9 rounded-md object-cover flex-shrink-0" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{msg.music_title}</p>
                    <p className="text-[11px] text-white/40 truncate">{msg.music_artist}</p>
                  </div>
                  <span className="text-white/60 flex-shrink-0">
                    {playingId === msg.id ? <Pause size={14} /> : <Play size={14} />}
                  </span>
                </button>
              )}
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-white/40">{timeAgo(msg.created_at)}</p>
                {!msg.is_read && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
