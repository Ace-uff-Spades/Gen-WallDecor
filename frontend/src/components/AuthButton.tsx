'use client';

import { useAuth } from '@/lib/useAuth';

export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-lg bg-secondary" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-dark truncate max-w-[180px]">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white cursor-pointer"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 cursor-pointer"
    >
      Sign in with Google
    </button>
  );
}
