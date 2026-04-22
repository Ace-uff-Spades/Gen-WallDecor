'use client';

import Link from 'next/link';
import AuthButton from './AuthButton';
import { useAuth } from '../lib/useAuth';

export default function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark h-14 flex items-center">
      <div className="w-full flex items-center justify-between px-6 lg:px-10">
        <Link
          href="/"
          className="font-mono text-xs tracking-widest uppercase text-text-light font-medium"
        >
          GenWallDecor
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/admin/usage"
              className="px-3 py-1.5 text-sm font-medium text-text-light/60 hover:text-text-light transition-colors"
            >
              Admin
            </Link>
          )}
          <Link
            href="/history"
            className="px-3 py-1.5 text-sm font-medium text-text-light/60 hover:text-text-light transition-colors"
          >
            History
          </Link>
          <div className="ml-2">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
