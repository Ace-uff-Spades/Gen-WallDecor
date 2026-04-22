'use client';

import { useAuth } from '@/lib/useAuth';

export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-dark-secondary" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-light/60 truncate max-w-[160px]">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-text-light/80 hover:border-white/40 hover:text-text-light transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="rounded-lg border border-white/20 px-4 py-1.5 text-sm font-medium text-text-light hover:bg-white/10 transition-colors cursor-pointer"
    >
      Sign in
    </button>
  );
}
