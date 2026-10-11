import type { ServiceId } from '../data/catalog';

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      className="mark"
      style={{ width: size, height: size }}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.6" />
      <circle
        cx="20"
        cy="20"
        r="10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity=".55"
      />
    </svg>
  );
}

export function Brand({ size = 30, fontSize }: { size?: number; fontSize?: string }) {
  return (
    <div className="brand" style={fontSize ? { fontSize } : undefined}>
      <BrandMark size={size} />
      Threshold
    </div>
  );
}

export function IconWeather() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M17 17a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.7A3.8 3.8 0 0 0 7 18h10Z" />
    </svg>
  );
}

export function IconGithub() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M12 2.2c-5.4 0-9.8 4.4-9.8 9.8 0 4.3 2.8 8 6.7 9.3.5.1.7-.2.7-.5v-1.9c-2.7.6-3.3-1.3-3.3-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.3-1.1.6-1.4-2.2-.2-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.6-.1-.2-.4-1.2.1-2.6 0 0 .8-.3 2.7 1a9 9 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.6.6.6 1 1.5 1 2.6 0 3.8-2.3 4.6-4.5 4.9.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5 3.9-1.3 6.7-5 6.7-9.3 0-5.4-4.4-9.8-9.8-9.8Z" />
    </svg>
  );
}

/** Logo Google officiel (4 couleurs fixes, pas `currentColor` — reste identique en thème clair/sombre). */
export function IconGoogle() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function IconRss() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M4 4a16 16 0 0 1 16 16" />
      <path d="M4 10a10 10 0 0 1 10 10" />
      <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSun() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" />
    </svg>
  );
}

export function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.5 16.5 21 21" strokeLinecap="round" />
    </svg>
  );
}

export function IconBell() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconGrip() {
  return (
    <svg className="wcard-grip" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="6" cy="5" r="1.4" fill="currentColor" />
      <circle cx="6" cy="10" r="1.4" fill="currentColor" />
      <circle cx="6" cy="15" r="1.4" fill="currentColor" />
      <circle cx="13" cy="5" r="1.4" fill="currentColor" />
      <circle cx="13" cy="10" r="1.4" fill="currentColor" />
      <circle cx="13" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconMore() {
  return (
    <svg className="icon" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFinance() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 17l5-5 4 4 7-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHackerNews() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="14" rx="2" strokeLinejoin="round" />
      <path d="M8 9l3 3-3 3M13 15h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSpotify() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: '#1DB954', stroke: 'none' }}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function IconLinkedin() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: '#0A66C2', stroke: 'none' }}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
    </svg>
  );
}

export function IconYoutube() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: '#FF0000', stroke: 'none' }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
    </svg>
  );
}

export function IconUptimeRobot() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#22c55e" strokeWidth="1.8">
      <path d="M3 12h4l2.5 6 4-14 2 8h5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMaps() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" style={{ fill: '#8b5cf6', stroke: 'none' }}>
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
    </svg>
  );
}

export function IconGmail() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#ea4335" />
      <path d="M2 5l10 8 10-8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconOutlook() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#0a66c2" />
      <path d="M2 5l10 8 10-8" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ServiceIcon({ service }: { service: ServiceId }) {
  if (service === 'weather') return <IconWeather />;
  if (service === 'github') return <IconGithub />;
  if (service === 'rss') return <IconRss />;
  if (service === 'finance') return <IconFinance />;
  if (service === 'spotify') return <IconSpotify />;
  if (service === 'linkedin') return <IconLinkedin />;
  if (service === 'youtube') return <IconYoutube />;
  if (service === 'uptimerobot') return <IconUptimeRobot />;
  if (service === 'maps') return <IconMaps />;
  if (service === 'gmail') return <IconGmail />;
  if (service === 'outlook') return <IconOutlook />;
  return <IconHackerNews />;
}

export function IconDashboard() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconServices() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z" />
      <path d="M12 12 4.5 7.5M12 12l7.5-4.5M12 12v9" />
    </svg>
  );
}

export function IconAdmin() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6.5v5.2c0 4.2 2.8 7.2 7 8.3 4.2-1.1 7-4.1 7-8.3V6.5L12 3Z" />
      <path d="M9.5 12.2 11.2 14l3.5-4" />
    </svg>
  );
}

export function IconProfile() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.6-3.2 4-4.8 6.5-4.8s4.9 1.6 6.5 4.8" />
    </svg>
  );
}

export function IconLogout() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" />
      <path d="M14 16l4-4-4-4M18 12H9" />
    </svg>
  );
}

export function IconBook() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" />
    </svg>
  );
}

export function IconBookmark() {
  return (
    <svg className="icon icon-fill" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h9A1.5 1.5 0 0 1 18 3.5v17.1a.6.6 0 0 1-.95.49L12 17.5l-5.05 3.59A.6.6 0 0 1 6 20.6V3.5Z" />
    </svg>
  );
}

export function IconChevron({ dir = 'right' }: { dir?: 'left' | 'right' }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
    </svg>
  );
}

export function IconFlame() {
  return (
    <svg className="icon icon-fill" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2c.5 3-1.5 4.5-3 6.5S7 12.6 7 14.5A5 5 0 0 0 17 15c0-2.2-1-3.8-2-5 .1 1.4-.4 2.6-1.4 3 .5-3.3-.4-8.3-1.6-11Z" />
    </svg>
  );
}
