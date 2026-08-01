import React, { useRef, useState } from 'react';
import { Camera, LogOut, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { profile, refreshProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api('/profile', { method: 'PATCH', body: JSON.stringify({ display_name: displayName, bio }) });
      await refreshProfile();
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    try {
      await api('/profile/avatar', { method: 'POST', body: form, isForm: true });
      await refreshProfile();
      toast.success('Profile picture updated');
    } catch {
      toast.error('Could not upload image');
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ newPassword }) });
      setNewPassword('');
      toast.success('Password changed');
    } catch {
      toast.error('Could not change password');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Your profile</h1>
        <a
          href={`/u/${profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition"
        >
          View your link <ExternalLink size={12} />
        </a>
      </div>

      <div className="glass rounded-xl2 p-6 flex flex-col items-center">
        <div className="relative">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${profile.username}`}
            className="w-24 h-24 rounded-full object-cover"
            alt={profile.display_name}
          />
          <button
            onClick={() => fileInput.current?.click()}
            className="absolute bottom-0 right-0 bg-white text-ink rounded-full p-2 hover:bg-white/90 transition"
            aria-label="Change profile picture"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </div>
        <p className="text-white/40 text-sm mt-3">@{profile.username}</p>
      </div>

      <div className="glass rounded-xl2 p-6 space-y-4">
        <label className="block">
          <span className="text-xs text-white/50 mb-1.5 block">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-white/5 rounded-xl px-3.5 py-2.5 text-sm outline-none border border-transparent focus:border-white/20"
          />
        </label>
        <label className="block">
          <span className="text-xs text-white/50 mb-1.5 block">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full bg-white/5 rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none border border-transparent focus:border-white/20"
          />
        </label>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="rounded-xl bg-white text-ink text-sm font-medium px-4 py-2 hover:bg-white/90 transition disabled:opacity-50"
        >
          Save changes
        </button>
      </div>

      <div className="glass rounded-xl2 p-6 space-y-4">
        <h2 className="text-sm font-medium">Change password</h2>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="w-full bg-white/5 rounded-xl px-3.5 py-2.5 text-sm outline-none border border-transparent focus:border-white/20"
        />
        <button
          onClick={changePassword}
          className="rounded-xl bg-white/10 text-sm font-medium px-4 py-2 hover:bg-white/15 transition"
        >
          Update password
        </button>
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 py-3 transition"
      >
        <LogOut size={15} /> Log out
      </button>
    </div>
  );
}
