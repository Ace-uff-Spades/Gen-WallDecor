'use client';

import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-secondary bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-primary">
            GenWallDecor
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/create"
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-secondary hover:text-text-darker"
            >
              Create
            </Link>
            <Link
              href="/history"
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-secondary hover:text-text-darker"
            >
              History
            </Link>
          </div>
        </div>
        <AuthButton />
      </div>
    </nav>
  );
}
