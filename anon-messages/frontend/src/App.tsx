import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import SendMessagePage from './components/SendMessagePage';
import NavBar, { View } from './components/NavBar';

function Footer() {
  return (
    <footer className="text-center py-6 text-xs text-white/30">
      Powered by <span className="text-white/50">NicoDev</span>
    </footer>
  );
}

function AuthedApp() {
  const [view, setView] = useState<View>('inbox');
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? '' : 'light bg-paper text-ink min-h-screen'}>
      <NavBar active={view} onChange={setView} unreadCount={0} darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />
      <main className="pb-20 sm:pb-6">
        {view === 'inbox' && <Dashboard />}
        {view === 'profile' && <Profile />}
        <Footer />
      </main>
    </div>
  );
}

function Gate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return <AuthScreen />;
  return <AuthedApp />;
}

export default function App() {
  // The public "send an anonymous message" page lives at /u/<username> and
  // works without any login — check the URL before rendering the normal
  // logged-in-or-not gate.
  const match = window.location.pathname.match(/^\/u\/([a-zA-Z0-9_]+)\/?$/);
  if (match) {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ style: { background: '#131316', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' } }} />
        <SendMessagePage username={match[1]} />
      </>
    );
  }

  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{ style: { background: '#131316', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' } }} />
      <Gate />
    </AuthProvider>
  );
}
