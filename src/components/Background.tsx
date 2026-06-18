"use client";

import { useEffect, useRef } from "react";

/**
 * Calm, anime-style nature background that gently parallaxes on scroll:
 * layered hills, a soft sun, pine forest silhouettes and floating leaves.
 * Sits fixed behind all content; pointer-events disabled.
 */
export default function Background() {
  const skyRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        if (sunRef.current) sunRef.current.style.transform = `translateY(${y * 0.12}px)`;
        if (farRef.current) farRef.current.style.transform = `translateY(${y * 0.05}px)`;
        if (midRef.current) midRef.current.style.transform = `translateY(${-y * 0.06}px)`;
        if (nearRef.current) nearRef.current.style.transform = `translateY(${-y * 0.14}px)`;
        if (skyRef.current) skyRef.current.style.opacity = `${Math.max(0.5, 1 - y / 1400)}`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* sky gradient */}
      <div
        ref={skyRef}
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #060a14 0%, #04060c 40%, #000000 75%, #000000 100%)",
        }}
      />

      {/* soft moon glow */}
      <div
        ref={sunRef}
        className="absolute left-1/2 top-[12%] h-56 w-56 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.20) 0%, rgba(56,189,248,0.07) 45%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* far hills */}
      <div ref={farRef} className="absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 375 260" preserveAspectRatio="xMidYMax slice" className="h-[70vh] w-full">
          <path
            d="M0 180 Q90 120 190 165 T375 150 V260 H0 Z"
            fill="#080c16"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* mid forest line */}
      <div ref={midRef} className="absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 375 220" preserveAspectRatio="xMidYMax slice" className="h-[58vh] w-full">
          <path d="M0 170 Q120 110 220 160 T375 140 V220 H0 Z" fill="#05080f" opacity="0.95" />
          {/* pine trees */}
          {[18, 60, 110, 165, 215, 270, 320, 355].map((x, i) => (
            <Pine key={i} x={x} y={172 - (i % 3) * 6} s={0.9 + (i % 3) * 0.18} c="#04060c" />
          ))}
        </svg>
      </div>

      {/* near foreground trees */}
      <div ref={nearRef} className="absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 375 180" preserveAspectRatio="xMidYMax slice" className="h-[40vh] w-full">
          <path d="M0 150 Q110 130 200 150 T375 145 V180 H0 Z" fill="#000000" />
          {[-6, 70, 150, 250, 340].map((x, i) => (
            <Pine key={i} x={x} y={160} s={1.5 + (i % 2) * 0.4} c="#000000" />
          ))}
        </svg>
      </div>

      {/* floating leaves / food bits */}
      {LEAVES.map((l, i) => (
        <span
          key={i}
          className="absolute text-lg"
          style={{
            left: `${l.left}%`,
            top: "-6vh",
            opacity: 0,
            animation: `float-leaf ${l.dur}s linear ${l.delay}s infinite`,
            filter: "saturate(0.7)",
          }}
        >
          {l.emoji}
        </span>
      ))}
    </div>
  );
}

function Pine({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} style={{ transformOrigin: "center" }}>
      <rect x="-1.5" y="0" width="3" height="10" fill="#04060c" />
      <path d="M0 -26 L9 -6 L-9 -6 Z" fill={c} />
      <path d="M0 -18 L11 2 L-11 2 Z" fill={c} />
      <path d="M0 -10 L13 8 L-13 8 Z" fill={c} />
    </g>
  );
}

const LEAVES = [
  { emoji: "💧", left: 8, dur: 22, delay: 0 },
  { emoji: "❄️", left: 22, dur: 28, delay: 4 },
  { emoji: "💧", left: 40, dur: 24, delay: 9 },
  { emoji: "🫐", left: 58, dur: 30, delay: 2 },
  { emoji: "✨", left: 72, dur: 26, delay: 7 },
  { emoji: "💧", left: 86, dur: 32, delay: 12 },
  { emoji: "❄️", left: 94, dur: 27, delay: 15 },
];
