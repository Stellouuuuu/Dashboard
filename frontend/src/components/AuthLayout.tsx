import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Icons';
import { ThemeToggle } from './ThemeToggle';
import { SkipLink } from './SkipLink';
import { AuthBackdrop } from './AuthBackdrop';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <SkipLink />
      <AuthBackdrop />
      <header className="auth-topbar">
        <Link to="/" className="brand-link">
          <Brand size={26} fontSize="1.05rem" />
        </Link>
        <ThemeToggle />
      </header>
      <main id="main-content" className="auth-main">
        {children}
      </main>
    </div>
  );
}
