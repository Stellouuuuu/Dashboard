import { useId } from 'react';
import type { ServiceId } from '../data/catalog';

/** Abstract cover art keyed by service — ready for spotify / whatsapp. */
export function CardCover({
  service,
  variant = 0,
}: {
  service: ServiceId;
  variant?: number;
}) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className={`wcard-cover wcard-cover--${service}`} data-variant={variant % 3} aria-hidden="true">
      <CoverArt service={service} variant={variant} uid={uid} />
      <div className="wcard-cover-shade" />
    </div>
  );
}

function CoverArt({
  service,
  variant,
  uid,
}: {
  service: ServiceId;
  variant: number;
  uid: string;
}) {
  switch (service) {
    case 'weather':
      return <WeatherArt v={variant} uid={uid} />;
    case 'github':
      return <GithubArt v={variant} uid={uid} />;
    case 'rss':
      return <RssArt v={variant} uid={uid} />;
    case 'spotify':
      return <SpotifyArt v={variant} uid={uid} />;
    case 'whatsapp':
      return <WhatsappArt v={variant} uid={uid} />;
    default:
      return <WeatherArt v={0} uid={uid} />;
  }
}

function WeatherArt({ v, uid }: { v: number; uid: string }) {
  const skies = [
    ['#0b1a2e', '#1a4a6e', '#5ecfff'],
    ['#1a1030', '#3d2a6b', '#c084fc'],
    ['#0e2030', '#1e5a4a', '#3dd68c'],
  ][v % 3];
  return (
    <svg className="wcard-cover-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`wx-sky-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skies[0]} />
          <stop offset="55%" stopColor={skies[1]} />
          <stop offset="100%" stopColor={skies[2]} />
        </linearGradient>
        <radialGradient id={`wx-sun-${uid}`} cx="72%" cy="28%" r="35%">
          <stop offset="0%" stopColor="#ffe08a" stopOpacity="1" />
          <stop offset="40%" stopColor="#ff9f0a" stopOpacity=".85" />
          <stop offset="100%" stopColor="#ff9f0a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#wx-sky-${uid})`} />
      <circle cx="290" cy="70" r="90" fill={`url(#wx-sun-${uid})`} />
      <ellipse cx="110" cy="150" rx="70" ry="28" fill="#fff" opacity=".22" />
      <ellipse cx="150" cy="140" rx="48" ry="22" fill="#fff" opacity=".28" />
      <ellipse cx="250" cy="175" rx="90" ry="32" fill="#fff" opacity=".14" />
      <path
        d="M0 200 Q80 170 160 190 T320 175 T400 200 V240 H0Z"
        fill="#0a1624"
        opacity=".45"
      />
      <circle cx="80" cy="90" r="6" fill="#fff" opacity=".5" />
      <circle cx="200" cy="50" r="3" fill="#fff" opacity=".4" />
      <circle cx="340" cy="120" r="4" fill="#fff" opacity=".35" />
    </svg>
  );
}

function GithubArt({ v, uid }: { v: number; uid: string }) {
  const tones = [
    ['#12081c', '#2a1450', '#c084fc'],
    ['#0c1018', '#1a2740', '#5ecfff'],
    ['#140a20', '#3a1838', '#ff6b9d'],
  ][v % 3];
  return (
    <svg className="wcard-cover-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`gh-bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tones[0]} />
          <stop offset="100%" stopColor={tones[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#gh-bg-${uid})`} />
      {/* isometric cubes */}
      <g transform="translate(220,40)" opacity=".95">
        <path d="M0 40 L50 10 L100 40 L50 70Z" fill={tones[2]} opacity=".9" />
        <path d="M0 40 L50 70 L50 130 L0 100Z" fill={tones[2]} opacity=".55" />
        <path d="M100 40 L50 70 L50 130 L100 100Z" fill={tones[2]} opacity=".35" />
      </g>
      <g transform="translate(80,90)" opacity=".7">
        <path d="M0 30 L35 8 L70 30 L35 52Z" fill="#fff" opacity=".25" />
        <path d="M0 30 L35 52 L35 95 L0 73Z" fill="#fff" opacity=".12" />
        <path d="M70 30 L35 52 L35 95 L70 73Z" fill="#fff" opacity=".08" />
      </g>
      {/* code dashes */}
      <g stroke={tones[2]} strokeWidth="3" strokeLinecap="round" opacity=".55">
        <line x1="40" y1="50" x2="120" y2="50" />
        <line x1="40" y1="68" x2="160" y2="68" />
        <line x1="40" y1="86" x2="100" y2="86" />
      </g>
      <circle cx="340" cy="180" r="50" fill={tones[2]} opacity=".15" />
    </svg>
  );
}

function RssArt({ v, uid }: { v: number; uid: string }) {
  const tones = [
    ['#1a0e04', '#5c2e08', '#ff9f0a'],
    ['#180c10', '#4a1820', '#ff6b7a'],
    ['#101018', '#2a2840', '#e8c07a'],
  ][v % 3];
  return (
    <svg className="wcard-cover-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`rss-bg-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={tones[0]} />
          <stop offset="60%" stopColor={tones[1]} />
          <stop offset="100%" stopColor={tones[2]} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#rss-bg-${uid})`} />
      {/* concentric broadcast arcs */}
      <g fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity=".28">
        <path d="M80 200 A120 120 0 0 1 200 80" />
        <path d="M80 200 A80 80 0 0 1 160 120" />
        <path d="M80 200 A40 40 0 0 1 120 160" />
      </g>
      <circle cx="80" cy="200" r="16" fill="#fff" opacity=".85" />
      {/* floating paper cards */}
      <g transform="translate(240,50) rotate(8)">
        <rect width="110" height="70" rx="10" fill="#fff" opacity=".18" />
        <rect x="14" y="16" width="70" height="6" rx="3" fill="#fff" opacity=".35" />
        <rect x="14" y="30" width="50" height="6" rx="3" fill="#fff" opacity=".22" />
      </g>
      <g transform="translate(260,120) rotate(-6)">
        <rect width="90" height="55" rx="8" fill="#fff" opacity=".12" />
      </g>
    </svg>
  );
}

function SpotifyArt({ v, uid }: { v: number; uid: string }) {
  const tones = [
    ['#04140c', '#0d3d28', '#1ed760'],
    ['#061018', '#0a3a40', '#1db954'],
    ['#0a1010', '#143828', '#3dd68c'],
  ][v % 3];
  return (
    <svg className="wcard-cover-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`sp-bg-${uid}`} cx="40%" cy="40%" r="70%">
          <stop offset="0%" stopColor={tones[2]} stopOpacity=".55" />
          <stop offset="50%" stopColor={tones[1]} />
          <stop offset="100%" stopColor={tones[0]} />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#sp-bg-${uid})`} />
      {/* vinyl */}
      <circle cx="150" cy="120" r="78" fill="#0a0a0a" opacity=".75" />
      <circle cx="150" cy="120" r="78" fill="none" stroke={tones[2]} strokeWidth="3" opacity=".7" />
      <circle cx="150" cy="120" r="28" fill={tones[2]} opacity=".9" />
      <circle cx="150" cy="120" r="10" fill="#0a0a0a" />
      {/* equalizer bars */}
      <g fill={tones[2]} opacity=".75" transform="translate(260,70)">
        <rect x="0" y="40" width="14" height="60" rx="4" />
        <rect x="22" y="20" width="14" height="80" rx="4" />
        <rect x="44" y="35" width="14" height="65" rx="4" />
        <rect x="66" y="10" width="14" height="90" rx="4" />
        <rect x="88" y="28" width="14" height="72" rx="4" />
      </g>
    </svg>
  );
}

function WhatsappArt({ v, uid }: { v: number; uid: string }) {
  const tones = [
    ['#06140f', '#0b3d2e', '#25d366'],
    ['#081218', '#0e3a45', '#128c7e'],
    ['#0a1410', '#1a4a38', '#34eb7a'],
  ][v % 3];
  return (
    <svg className="wcard-cover-svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`wa-bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tones[0]} />
          <stop offset="100%" stopColor={tones[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#wa-bg-${uid})`} />
      {/* chat bubbles */}
      <g transform="translate(50,55)">
        <rect width="160" height="56" rx="18" fill={tones[2]} opacity=".85" />
        <path d="M24 56 L40 56 L28 72Z" fill={tones[2]} opacity=".85" />
        <rect x="18" y="18" width="90" height="8" rx="4" fill="#fff" opacity=".45" />
        <rect x="18" y="32" width="60" height="8" rx="4" fill="#fff" opacity=".28" />
      </g>
      <g transform="translate(190,120)">
        <rect width="150" height="50" rx="16" fill="#fff" opacity=".16" />
        <path d="M130 50 L146 50 L140 66Z" fill="#fff" opacity=".16" />
        <rect x="16" y="16" width="80" height="8" rx="4" fill="#fff" opacity=".35" />
        <rect x="16" y="30" width="50" height="8" rx="4" fill="#fff" opacity=".22" />
      </g>
      <circle cx="340" cy="60" r="36" fill={tones[2]} opacity=".25" />
      <circle cx="60" cy="190" r="24" fill={tones[2]} opacity=".2" />
    </svg>
  );
}
