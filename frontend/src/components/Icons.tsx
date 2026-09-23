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

export function IconRss() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M4 4a16 16 0 0 1 16 16" />
      <path d="M4 10a10 10 0 0 1 10 10" />
      <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSpotify() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path
        d="M7.5 10.2c3.2-1 6.8-.8 9.5.6M8.2 13c2.5-.7 5.3-.5 7.4.6M8.8 15.6c1.8-.5 3.8-.4 5.4.4"
        stroke="var(--bg, #050505)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconWhatsapp() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5a8 8 0 0 0-6.9 12l-1 3.5 3.6-.9A8 8 0 1 0 12 3.5Z" />
      <path
        d="M9.2 9.4c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .4.4.6 1 1.2 1.6 1.6.2.1.3.1.4 0l.5-.4c.2-.1.4-.2.6-.1l1.7.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1 .4-1.6.3a7 7 0 0 1-4.4-2.5 7 7 0 0 1-1.6-3.2c-.1-.6.1-1.2.3-1.6Z"
        fill="var(--bg, #050505)"
        stroke="none"
      />
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

export function ServiceIcon({ service }: { service: ServiceId }) {
  if (service === 'weather') return <IconWeather />;
  if (service === 'github') return <IconGithub />;
  if (service === 'rss') return <IconRss />;
  if (service === 'spotify') return <IconSpotify />;
  return <IconWhatsapp />;
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
