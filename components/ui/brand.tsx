import { useId } from "react";

/** The mark: the WHEELY9000 seen head-on, with two ears and the gold magnet. */
export function HamsterMark({ size = 30, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}-ring`} x1="4" y1="6" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5b8cff" />
          <stop offset="1" stopColor="#2bd4f0" />
        </linearGradient>
      </defs>
      <circle cx="9.6" cy="7.4" r="3.4" fill="#eaf0fa" />
      <circle cx="22.4" cy="7.4" r="3.4" fill="#eaf0fa" />
      <circle cx="16" cy="18" r="11" fill="#0a0e15" stroke={`url(#${id}-ring)`} strokeWidth="2.6" />
      <g stroke="#2bd4f0" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round">
        <path d="M16 11.2v13.6M9.2 18h13.6M11.2 13.2l9.6 9.6M20.8 13.2l-9.6 9.6" />
      </g>
      <circle cx="16" cy="18" r="2.2" fill="#0a0e15" stroke="#eaf0fa" strokeWidth="1.2" />
      <rect x="25.3" y="16.2" width="3.4" height="3.6" rx="1" fill="#f5b83d" />
    </svg>
  );
}

export function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}
