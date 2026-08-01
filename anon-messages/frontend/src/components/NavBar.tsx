import React from 'react';
import { Inbox, User, Moon, Sun } from 'lucide-react';

export type View = 'inbox' | 'profile';

interface Props {
  active: View;
  onChange: (v: View) => void;
  unreadCount: number;
  darkMode: boolean;
  onToggleDark: () => void;
}

const ITEMS: { id: View; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function NavBar({ active, onChange, unreadCount, darkMode, onToggleDark }: Props) {
  return (
    <>
      {/* Desktop top bar */}
      <nav className="hidden sm:flex items-center justify-between max-w-xl mx-auto px-4 py-4 sticky top-0 z-20 bg-ink/80 backdrop-blur-md">
        <span className="font-display text-lg font-semibold">Whispr</span>
        <div className="flex items-center gap-1">
          {ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition ${
                active === id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
              {id === 'inbox' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          <button onClick={onToggleDark} className="p-2 rounded-full text-white/50 hover:text-white transition" aria-label="Toggle theme">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 glass flex items-center justify-around py-2.5">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
              active === id ? 'text-white' : 'text-white/40'
            }`}
          >
            <Icon size={19} />
            {label}
            {id === 'inbox' && unreadCount > 0 && (
              <span className="absolute top-0 right-1 bg-red-500 rounded-full w-2 h-2" />
            )}
          </button>
        ))}
      </nav>
    </>
  );
}
