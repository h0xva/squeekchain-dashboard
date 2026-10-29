"use client";

import { useId } from "react";

/** A small instrument illustration: the wheel moves only with confirmed activity. */
export function WheelScene({ running }: { running: boolean }) {
  const id = `wheel-${useId().replace(/:/g, "")}`;
  return <div className={`wheel-scene ${running ? "wheel-is-running" : ""}`}>
    <svg viewBox="0 0 360 240" role="img" aria-label={`Squeektoshi in the WHEELY9000 hamster wheel, ${running ? "running" : "stationary"}`}>
      <defs>
        <radialGradient id={`${id}-aura`}><stop stopColor="#326dd2" stopOpacity=".17" /><stop offset="1" stopColor="#326dd2" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7c9abc" /><stop offset=".28" stopColor="#2f4664" /><stop offset=".58" stopColor="#182b44" /><stop offset="1" stopColor="#4c6d98" /></linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#8cbbff" /><stop offset=".3" stopColor="#486f9f" /><stop offset=".68" stopColor="#243a58" /><stop offset="1" stopColor="#6493cf" /></linearGradient>
        <linearGradient id={`${id}-fur`} x1="0" y1="0" x2=".65" y2="1"><stop stopColor="#f4d59c" /><stop offset=".55" stopColor="#d3a163" /><stop offset="1" stopColor="#a77344" /></linearGradient>
        <linearGradient id={`${id}-belly`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#fff1d1" /><stop offset="1" stopColor="#e6c18c" /></linearGradient>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#354253" /><stop offset="1" stopColor="#1a222e" /></linearGradient>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>

      <ellipse cx="185" cy="118" rx="150" ry="116" fill={`url(#${id}-aura)`} />
      <ellipse cx="185" cy="216" rx="91" ry="8" fill="#03080f" opacity=".75" filter={`url(#${id}-shadow)`} />
      <path d="M62 217H309M77 225H292" stroke="#283243" strokeWidth=".6" opacity=".55" />
      <path d="M177 116L152 209H214L190 117" fill={`url(#${id}-metal)`} stroke="#486081" strokeWidth="1" />
      <path d="M165 164L154 208H169L179 164" fill="#7386a1" opacity=".14" />
      <path d="M137 208H228L242 216H123Z" fill={`url(#${id}-base)`} stroke="#3c4d66" strokeWidth="1" />
      <path d="M133 217H235" stroke="#10151c" strokeWidth="4" strokeLinecap="round" />

      <circle cx="180" cy="108" r="88" fill="#101b2b" fillOpacity=".62" stroke="#1b2a3f" strokeWidth="9" />
      <circle cx="180" cy="108" r="81.5" fill="none" stroke="#314966" strokeWidth=".8" />
      <g className="wheel-scene-spokes">
        {Array.from({ length: 16 }, (_, index) => <g key={index} transform={`rotate(${index * 22.5} 180 108)`}><path d="M180 29V101" stroke="#3d5679" strokeWidth="1" opacity=".5" /><path d="M176 22H184V29H176Z" fill="#6383ae" opacity=".45" /></g>)}
        <circle cx="180" cy="108" r="68" fill="none" stroke="#1d324e" strokeWidth=".7" strokeDasharray="2 7" />
      </g>
      <circle cx="180" cy="108" r="8" fill={`url(#${id}-metal)`} stroke="#58779b" strokeWidth="1" />
      <circle cx="180" cy="108" r="2.3" fill="#89a7ca" />

      <ellipse cx="180" cy="189" rx="43" ry="7" fill="#06101e" opacity=".55" />
      <g transform="translate(0 15)">
      <g className="wheel-scene-hamster">
        <path d="M209 153Q223 150 222 158Q218 166 211 161" fill="#cda074" stroke="#ab7d56" strokeWidth="1" />
        <g className="wheel-scene-leg-back"><path d="M187 164L195 173L205 171" fill="none" stroke="#ba8c61" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></g>
        <path d="M149 136Q150 122 163 124Q169 113 186 117Q208 118 216 137Q223 157 204 166Q185 176 161 164Q146 157 149 136Z" fill={`url(#${id}-fur)`} />
        <path d="M148 140Q139 137 140 147Q141 160 163 165Q173 171 185 169Q176 155 169 149Q160 140 148 140Z" fill={`url(#${id}-belly)`} />
        <path d="M158 132Q145 120 151 111Q162 103 170 116L172 128" fill={`url(#${id}-fur)`} />
        <path d="M159 125Q151 118 155 114Q162 111 166 120L166 125" fill="#dfa99a" />
        <path d="M150 132Q142 132 138 140Q135 147 145 152L157 150" fill={`url(#${id}-fur)`} />
        <ellipse cx="143" cy="146" rx="3.1" ry="2.2" fill="#a5695c" />
        <ellipse cx="157" cy="135" rx="3.1" ry="3.5" fill="#27221e" />
        <circle cx="157.8" cy="134" r=".9" fill="#fff8e6" />
        <path d="M145 151Q148 154 151 151M139 146L129 144M140 149L129 151" fill="none" stroke="#c1a07b" strokeWidth=".8" strokeLinecap="round" />
        <path d="M182 129Q200 125 207 139" fill="none" stroke="#ffe3b0" strokeWidth="2" opacity=".35" strokeLinecap="round" />
        <g className="wheel-scene-leg-front"><path d="M166 158L157 169L146 169" fill="none" stroke="#efc994" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><path d="M200 160L207 169L216 165" fill="none" stroke="#e3b780" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></g>
        <path d="M173 144L164 151L157 150" fill="none" stroke="#e7bd88" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      </g>

      <circle cx="180" cy="108" r="90" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="4" />
      <path d="M104 66A90 90 0 0 1 217 26" fill="none" stroke="#a6caff" strokeWidth="1.3" opacity=".6" strokeLinecap="round" />
      <path d="M254 156A90 90 0 0 1 220 189" fill="none" stroke="#719be4" strokeWidth="1.5" opacity=".55" strokeLinecap="round" />
      <rect x="231" y="43" width="15" height="23" rx="3" transform="rotate(38 231 43)" fill="#263b57" stroke="#5879a5" strokeWidth=".8" />
      <circle cx="232" cy="55" r="2" fill={running ? "#73d6b1" : "#738097"} />

      <g fontFamily="Inter, Arial, sans-serif" fontSize="7" fill="#6a7890" letterSpacing="1.2"><text x="23" y="29">WHEELY9000</text><text x="23" y="40" fontSize="6" fill="#46536a">UNIT 001</text></g>
      <g transform="translate(294 185)"><path d="M0 0H20M0 4H12M0 8H16" stroke="#34455f" strokeWidth="1" /><circle cx="25" cy="0" r="1.5" fill={running ? "#528fff" : "#4b5363"} /></g>
    </svg>
    <style>{`
      .wheel-scene{width:100%;max-width:390px;margin:0 auto;aspect-ratio:3/2}.wheel-scene svg{width:100%;height:100%;display:block;overflow:visible}.wheel-scene-spokes{transform-origin:180px 108px}.wheel-is-running .wheel-scene-spokes{animation:squeek-wheel-turn 15s linear infinite}.wheel-scene-hamster{transform-origin:180px 164px}.wheel-is-running .wheel-scene-hamster{animation:squeek-hamster-run .38s ease-in-out infinite}.wheel-scene-leg-front,.wheel-scene-leg-back{transform-origin:180px 160px}.wheel-is-running .wheel-scene-leg-front{animation:squeek-hamster-legs .38s ease-in-out infinite alternate}.wheel-is-running .wheel-scene-leg-back{animation:squeek-hamster-legs .38s ease-in-out infinite alternate-reverse}@keyframes squeek-wheel-turn{to{transform:rotate(360deg)}}@keyframes squeek-hamster-run{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-2px) rotate(1deg)}}@keyframes squeek-hamster-legs{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}@media(prefers-reduced-motion:reduce){.wheel-scene *{animation:none!important}}
    `}</style>
  </div>;
}
