import React, { useEffect, useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, ApiError } from '../lib/api';

interface PublicProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const MAX_LENGTH = 500;

export default function SendMessagePage({ username }: { username: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { profile } = await api(`/public/${username}`, { auth: false });
        setProfile(profile);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await api(`/public/${username}/send`, {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ body: body.trim() }),
      });
      setSent(true);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not send your message';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink px-6">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink px-6 text-center">
        <div>
          <p className="text-white/70 text-sm mb-2">This link doesn't exist.</p>
          <a href="/" className="text-white/40 text-xs underline hover:text-white/70">
            Get your own anonymous message link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm glass rounded-xl2 p-8 animate-slide-up text-center">
        <img
          src={profile.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${profile.username}`}
          className="w-16 h-16 rounded-full object-cover mx-auto mb-4"
          alt={profile.display_name}
        />
        <h1 className="font-display text-lg font-semibold mb-1">{profile.display_name}</h1>
        <p className="text-white/40 text-sm mb-6">Send an anonymous message</p>

        {sent ? (
          <div className="py-8 flex flex-col items-center gap-3 animate-pop">
            <CheckCircle2 size={32} className="text-white/70" />
            <p className="text-sm text-white/80">Sent. Hindi ka makikilala nyan bui.</p>
            <button
              onClick={() => {
                setBody('');
                setSent(false);
              }}
              className="text-xs text-white/50 underline hover:text-white/80 mt-2"
            >
              Send another
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Say something…"
              rows={4}
              className="w-full bg-white/5 rounded-xl p-3.5 text-sm outline-none resize-none border border-line focus:border-white/30 transition-colors placeholder:text-white/30"
            />
            <div className="flex items-center justify-between mt-2 mb-4">
              <p className="text-xs text-white/30">Kung torpe ka ito gamitin mo</p>
              <p className="text-xs text-white/30">
                {body.length}/{MAX_LENGTH}
              </p>
            </div>
            <button
              onClick={send}
              disabled={!body.trim() || sending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-ink font-medium py-3 text-sm hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-50"
            >
              <Send size={15} />
              {sending ? 'Sending…' : 'Send anonymously'}
            </button>
          </>
        )}

        <a href="/" className="block text-xs text-white/30 underline hover:text-white/60 mt-6">
          Get your own link
        </a>
      </div>
    </div>
  );
}
