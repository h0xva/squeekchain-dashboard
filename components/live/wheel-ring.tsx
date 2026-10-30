"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const ARC_R = 170;
const CIRCUMFERENCE = 2 * Math.PI * ARC_R;
const TICKS = 120;
const RUNGS = 40;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// Rounded so server and browser trigonometry agree to the digit (no hydration drift).
const round = (value: number) => Math.round(value * 100) / 100;
function polar(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: round(radius * Math.cos(radians)), y: round(radius * Math.sin(radians)) };
}

/**
 * The WHEELY9000 as an instrument. The outer arc is progress to the next Squeek
 * block; the inner wheel turns at a rate derived from the measured wheel speed,
 * coasts to a stop when Squeektoshi rests, and lights the sensor each time its
 * magnet passes - one magnet pass is one unit of work.
 */
export function WheelRing({
  progress,
  blockKey,
  turning,
  speedKmh,
  dim = false,
  children,
}: {
  progress: number | null;
  /** The upcoming block height; an increase means a block was just found. */
  blockKey: number | null;
  turning: boolean;
  speedKmh: number | null;
  dim?: boolean;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const value = useMotionValue(progress === null ? 0 : clamp01(progress));
  const dashOffset = useTransform(value, (latest) => CIRCUMFERENCE * (1 - clamp01(latest)));
  const headX = useTransform(value, (latest) => polar(ARC_R, clamp01(latest) * 360).x);
  const headY = useTransform(value, (latest) => polar(ARC_R, clamp01(latest) * 360).y);
  const lastKey = useRef(blockKey);
  const [pulses, setPulses] = useState(0);

  useEffect(() => {
    if (progress === null) return;
    const target = clamp01(progress);
    const previousKey = lastKey.current;
    lastKey.current = blockKey;
    if (reduce) {
      value.set(target);
      return;
    }
    const foundBlock = previousKey !== null && blockKey !== null && blockKey > previousKey;
    if (!foundBlock) {
      const controls = animate(value, target, { type: "spring", stiffness: 42, damping: 16 });
      return () => controls.stop();
    }
    // Close the lap, flash, then start the next one from zero.
    let cancelled = false;
    let next: ReturnType<typeof animate> | null = null;
    const finish = animate(value, 1, { duration: 0.55, ease: [0.4, 0, 0.2, 1] });
    void finish.then(() => {
      if (cancelled) return;
      value.set(0);
      setPulses((count) => count + 1);
      next = animate(value, target, { type: "spring", stiffness: 42, damping: 16 });
    });
    return () => {
      cancelled = true;
      finish.stop();
      next?.stop();
    };
  }, [progress, blockKey, reduce, value]);

  // Wheel rotation runs outside React: one rAF loop writing a transform.
  const wheel = useRef<SVGGElement>(null);
  const sensor = useRef<SVGGElement>(null);
  const targetSpeed = useRef(0);
  useEffect(() => {
    targetSpeed.current = turning && speedKmh ? Math.min(speedKmh, 12) * 30 : 0; // degrees per second
  }, [turning, speedKmh]);
  useEffect(() => {
    if (reduce) return;
    let frame = 0;
    let last = performance.now();
    let angle = 0;
    let omega = 0;
    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      omega += (targetSpeed.current - omega) * Math.min(1, dt * 1.4);
      const previous = angle;
      angle = (angle + omega * dt) % 360;
      wheel.current?.setAttribute("transform", `rotate(${angle.toFixed(2)})`);
      if (omega > 2 && angle < previous) {
        sensor.current?.animate([{ opacity: 1 }, { opacity: 0.28 }], { duration: 750, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [reduce]);

  const lit = progress === null ? 0 : Math.floor(clamp01(progress) * TICKS);

  return (
    <div className="relative aspect-square w-full select-none">
      <svg viewBox="-200 -200 400 400" className="absolute inset-0 size-full overflow-visible" role="presentation">
        <defs>
          <linearGradient id="ring-arc" x1="-170" y1="-170" x2="170" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3d7bff" />
            <stop offset="0.55" stopColor="#2bd4f0" />
            <stop offset="1" stopColor="#a5f3ff" />
          </linearGradient>
          <radialGradient id="ring-core">
            <stop offset="0" stopColor="#0a0e15" stopOpacity="0.96" />
            <stop offset="0.72" stopColor="#0a0e15" stopOpacity="0.7" />
            <stop offset="1" stopColor="#0a0e15" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ring-ambient">
            <stop offset="0.55" stopColor="#2bd4f0" stopOpacity="0" />
            <stop offset="0.82" stopColor="#2bd4f0" stopOpacity="0.07" />
            <stop offset="1" stopColor="#2bd4f0" stopOpacity="0" />
          </radialGradient>
          <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <circle r="200" fill="url(#ring-ambient)" />

        {/* Scale: 120 ticks, lit up to the current progress. */}
        <g>
          {Array.from({ length: TICKS }, (_, index) => {
            const major = index % 10 === 0;
            const a = polar(major ? 179 : 183, index * 3);
            const b = polar(191, index * 3);
            const on = index < lit;
            return (
              <line
                key={index}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeLinecap="round"
                strokeWidth={major ? 2 : 1.4}
                style={{
                  stroke: on ? "#2bd4f0" : "#3a4558",
                  opacity: on ? (major ? 1 : 0.75) : major ? 0.9 : 0.5,
                  transition: "stroke 400ms ease, opacity 400ms ease",
                }}
              />
            );
          })}
        </g>

        {/* Progress arc */}
        <circle r={ARC_R} fill="none" stroke="rgb(43 212 240 / 0.07)" strokeWidth="9" />
        {progress !== null ? (
          <g transform="rotate(-90)">
            <motion.circle
              r={ARC_R}
              fill="none"
              stroke="url(#ring-arc)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: dashOffset }}
              filter="url(#ring-glow)"
              opacity={0.65}
            />
            <motion.circle
              r={ARC_R}
              fill="none"
              stroke="url(#ring-arc)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: dashOffset }}
            />
          </g>
        ) : (
          <circle r={ARC_R} fill="none" stroke="#3a4558" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="2 9" />
        )}
        {progress !== null ? (
          <g>
            <motion.circle cx={headX} cy={headY} r="14" fill="#2bd4f0" opacity="0.18" />
            <motion.circle cx={headX} cy={headY} r="5.5" fill="#eafcff" />
          </g>
        ) : null}

        {/* Block found: a gold shockwave from the arc. */}
        {pulses > 0 ? (
          <motion.circle
            key={pulses}
            r={ARC_R}
            fill="none"
            stroke="#f5b83d"
            strokeWidth="3"
            initial={{ scale: 1, opacity: 0.95 }}
            animate={{ scale: 1.16, opacity: 0 }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}

        {/* The wheel */}
        <g opacity={dim ? 0.4 : 1} style={{ transition: "opacity 600ms ease" }}>
          <g ref={wheel}>
            <circle r="150" fill="none" stroke="rgb(150 180 255 / 0.2)" strokeWidth="1.5" />
            <circle r="133" fill="none" stroke="rgb(150 180 255 / 0.1)" strokeWidth="1" />
            {Array.from({ length: RUNGS }, (_, index) => {
              const a = polar(133, index * (360 / RUNGS));
              const b = polar(150, index * (360 / RUNGS));
              return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgb(150 180 255 / 0.16)" strokeWidth="1.5" />;
            })}
            {Array.from({ length: 8 }, (_, index) => {
              const a = polar(24, index * 45 + 22.5);
              const b = polar(133, index * 45 + 22.5);
              return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgb(150 180 255 / 0.07)" strokeWidth="1" />;
            })}
            <circle r="24" fill="none" stroke="rgb(150 180 255 / 0.12)" />
            {/* The magnet */}
            <rect x="-5" y="-149" width="10" height="15" rx="2.5" fill="#f5b83d" />
            <rect x="-9" y="-153" width="18" height="23" rx="5" fill="#f5b83d" opacity="0.18" />
          </g>
          {/* The sensor: fixed at the top, lights on every magnet pass */}
          <g ref={sensor} opacity="0.28">
            <rect x="-2" y="-163" width="4" height="9" rx="2" fill="#2bd4f0" />
            <circle cx="0" cy="-158" r="9" fill="#2bd4f0" opacity="0.35" filter="url(#ring-glow)" />
          </g>
        </g>

        <circle r="128" fill="url(#ring-core)" />
      </svg>
      <div className="absolute inset-[22%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
