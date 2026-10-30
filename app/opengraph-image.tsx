import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Squeekchain community dashboard — live from the WHEELY9000";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "node_modules/geist/dist/fonts", file));

function polar(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: 260 + radius * Math.cos(radians), y: 260 + radius * Math.sin(radians) };
}

/** Static share card. Decorative ring only: no live number is baked into the image. */
export default async function OpenGraphImage() {
  const [semibold, regular, mono] = await Promise.all([
    font("geist-sans/Geist-SemiBold.ttf"),
    font("geist-sans/Geist-Regular.ttf"),
    font("geist-mono/GeistMono-Regular.ttf"),
  ]);
  const arcEnd = polar(200, 268);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "radial-gradient(900px 500px at 15% -10%, rgba(61,123,255,0.22), transparent 70%), #05070b",
          color: "#eaf0fa",
          fontFamily: "Geist",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 640, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="52" height="52" viewBox="0 0 32 32">
              <circle cx="9.6" cy="7.4" r="3.4" fill="#eaf0fa" />
              <circle cx="22.4" cy="7.4" r="3.4" fill="#eaf0fa" />
              <circle cx="16" cy="18" r="11" fill="#0a0e15" stroke="#2bd4f0" strokeWidth="2.6" />
              <path d="M16 11.2v13.6M9.2 18h13.6M11.2 13.2l9.6 9.6M20.8 13.2l-9.6 9.6" stroke="#2bd4f0" strokeOpacity="0.55" strokeWidth="1.2" />
              <circle cx="16" cy="18" r="2.2" fill="#0a0e15" stroke="#eaf0fa" strokeWidth="1.2" />
              <rect x="25.3" y="16.2" width="3.4" height="3.6" rx="1" fill="#f5b83d" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.6 }}>Squeekchain</span>
              <span style={{ fontFamily: "Geist Mono", fontSize: 15, letterSpacing: 3, color: "#7c889e" }}>COMMUNITY DASHBOARD</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1.02 }}>Live from</div>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1.02, color: "#2bd4f0" }}>
              the wheel.
            </div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 26, lineHeight: 1.4, color: "#a3b0c4", maxWidth: 560 }}>
              Watch Squeektoshi mine the next Squeek block — telemetry, analytics and Squeek portfolios.
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {["Live telemetry", "Analytics", "Portfolios", "Sepolia"].map((label, index) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: `1px solid ${index === 0 ? "rgba(61,220,151,0.35)" : "rgba(150,180,255,0.16)"}`,
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 18,
                  color: "#a3b0c4",
                }}
              >
                {index === 0 ? <div style={{ width: 9, height: 9, borderRadius: 9, background: "#3ddc97" }} /> : null}
                {label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", position: "absolute", right: 40, top: 55 }}>
          <svg width="520" height="520" viewBox="0 0 520 520">
            {Array.from({ length: 96 }, (_, index) => {
              const major = index % 8 === 0;
              const a = polar(major ? 226 : 231, index * 3.75);
              const b = polar(241, index * 3.75);
              const lit = index < 72;
              return (
                <line
                  key={index}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={lit ? "#2bd4f0" : "#3a4558"}
                  strokeOpacity={lit ? (major ? 1 : 0.75) : 0.6}
                  strokeWidth={major ? 2.6 : 1.8}
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx="260" cy="260" r="200" fill="none" stroke="rgba(43,212,240,0.08)" strokeWidth="12" />
            <path
              d={`M 260 60 A 200 200 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
              fill="none"
              stroke="#2bd4f0"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <circle cx={arcEnd.x} cy={arcEnd.y} r="9" fill="#eafcff" />
            <circle cx="260" cy="260" r="172" fill="none" stroke="rgba(150,180,255,0.2)" strokeWidth="2" />
            <circle cx="260" cy="260" r="152" fill="none" stroke="rgba(150,180,255,0.1)" strokeWidth="1.5" />
            {Array.from({ length: 40 }, (_, index) => {
              const a = polar(152, index * 9);
              const b = polar(172, index * 9);
              return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(150,180,255,0.18)" strokeWidth="2" />;
            })}
            <rect x="254" y="89" width="12" height="18" rx="3" fill="#f5b83d" transform="rotate(38 260 260)" />
          </svg>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 520,
              height: 520,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: "Geist Mono", fontSize: 18, letterSpacing: 4, color: "#7c889e" }}>NEXT BLOCK</span>
            <span style={{ fontSize: 44, fontWeight: 600, marginTop: 8, letterSpacing: -1 }}>in progress</span>
            <span style={{ display: "flex", marginTop: 14, fontSize: 18, color: "#f5b83d" }}>5,600 SQK per block</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
