import React, { useState } from 'react';
import { Mail, KeyRound, User, AtSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { api, ApiError } from '../lib/api';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back');
      } else {
        const { session } = await api('/auth/register', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ email, password, username, displayName }),
        });
        // Apply the session the backend already created, so the frontend
        // doesn't need a second round-trip login.
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        toast.success('Account created');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : (err as Error).message;
      toast.error(message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm glass rounded-xl2 p-8 animate-slide-up">
        <h1 className="font-display text-2xl font-semibold mb-1">Whispr</h1>
        <p className="text-white/50 text-sm mb-6">
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </p>

        {mode === 'register' && (
          <>
            <label className="block mb-3">
              <span className="text-xs text-white/50 mb-1.5 block">Display name</span>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-line px-3.5 py-3 focus-within:border-white/30 transition-colors">
                <User size={16} className="text-white/40" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-white/30"
                />
              </div>
            </label>
            <label className="block mb-3">
              <span className="text-xs text-white/50 mb-1.5 block">Username</span>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-line px-3.5 py-3 focus-within:border-white/30 transition-colors">
                <AtSign size={16} className="text-white/40" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  pattern="[a-z0-9_]+"
                  placeholder="janedoe"
                  className="bg-transparent outline-none text-sm w-full placeholder:text-white/30"
                />
              </div>
            </label>
          </>
        )}

        <label className="block mb-3">
          <span className="text-xs text-white/50 mb-1.5 block">Email</span>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-line px-3.5 py-3 focus-within:border-white/30 transition-colors">
            <Mail size={16} className="text-white/40" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-transparent outline-none text-sm w-full placeholder:text-white/30"
            />
          </div>
        </label>

        <label className="block mb-5">
          <span className="text-xs text-white/50 mb-1.5 block">Password</span>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-line px-3.5 py-3 focus-within:border-white/30 transition-colors">
            <KeyRound size={16} className="text-white/40" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-transparent outline-none text-sm w-full placeholder:text-white/30"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-white text-ink font-medium py-3 text-sm hover:bg-white/90 active:scale-[0.98] transition disabled:opacity-50"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-white/40 text-xs text-center mt-5">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="underline text-white/70 hover:text-white"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
}
