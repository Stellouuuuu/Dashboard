import { useTheme } from '../theme/ThemeProvider';
import { IconMoon, IconSun } from './Icons';

interface ThemeToggleProps {
  /** Compact icon button (nav) or Dark/Light segmented pill (sidebar). */
  variant?: 'icon' | 'pill';
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <div className="theme-pill" role="group" aria-label="Thème">
        <button
          type="button"
          className={`theme-pill-btn${isDark ? ' active' : ''}`}
          onClick={() => setTheme('dark')}
          aria-pressed={isDark}
        >
          <IconMoon />
          <span>Dark</span>
        </button>
        <button
          type="button"
          className={`theme-pill-btn${!isDark ? ' active' : ''}`}
          onClick={() => setTheme('light')}
          aria-pressed={!isDark}
        >
          <IconSun />
          <span>Light</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
