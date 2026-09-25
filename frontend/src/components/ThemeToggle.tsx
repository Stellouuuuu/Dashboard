import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { IconMoon, IconSun } from './Icons';

interface ThemeToggleProps {
  /** Compact icon button (nav) or Dark/Light segmented pill (sidebar). */
  variant?: 'icon' | 'pill';
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <div className="theme-pill" role="group" aria-label={t('theme.label')}>
        <button
          type="button"
          className={`theme-pill-btn${isDark ? ' active' : ''}`}
          onClick={() => setTheme('dark')}
          aria-pressed={isDark}
        >
          <IconMoon />
          <span>{t('theme.dark')}</span>
        </button>
        <button
          type="button"
          className={`theme-pill-btn${!isDark ? ' active' : ''}`}
          onClick={() => setTheme('light')}
          aria-pressed={!isDark}
        >
          <IconSun />
          <span>{t('theme.light')}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      title={isDark ? t('theme.light') : t('theme.dark')}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
