// src/components/InteractiveNebulaShader.tsx
// Giant premium CSS nebula orbs — no WebGL, no particles, pure Apple-style depth

import React, { useMemo } from "react";
import { motion } from "framer-motion";

// 4 strictly approved premium palettes only
const PALETTES = [
  { from: 'rgba(34,211,238,0.35)', to: 'rgba(168,85,247,0.15)' }, // A: Cyan → Violet
  { from: 'rgba(91,140,255,0.35)', to: 'rgba(139,92,246,0.15)' }, // B: Blue → Purple
  { from: 'rgba(0,212,255,0.35)', to: 'rgba(255,107,255,0.15)' }, // C: Cyan → Fuchsia
  { from: 'rgba(124,92,255,0.35)', to: 'rgba(34,211,238,0.15)' }, // D: Purple → Cyan
];

// Glow color to match each palette's primary
const GLOW_COLORS = [
  'rgba(34,211,238,0.12)',   // Cyan
  'rgba(91,140,255,0.12)',   // Blue
  'rgba(0,212,255,0.12)',    // Ice Cyan
  'rgba(124,92,255,0.12)',   // Purple
];

interface OrbConfig {
  id: number;
  palette: typeof PALETTES[0];
  glow: string;
  size: number;
  x: string;
  y: string;
  xPath: string[];
  yPath: string[];
  duration: number;
  delay: number;
  scaleRange: [number, number];
}

export default function InteractiveNebulaShader() {
  const orbs = useMemo<OrbConfig[]>(() => {
    const orbDefs = [
      // Top-left cluster
      { pi: 0, x: '8%', y: '10%', sz: 450, dur: 22, delay: 0, xr: [-30, 30], yr: [-20, 40] },
      { pi: 1, x: '15%', y: '25%', sz: 280, dur: 28, delay: 3, xr: [-50, 20], yr: [-40, 20] },
      // Top-right cluster
      { pi: 2, x: '75%', y: '8%', sz: 380, dur: 26, delay: 6, xr: [20, -40], yr: [-30, 50] },
      { pi: 3, x: '88%', y: '20%', sz: 220, dur: 30, delay: 1, xr: [-20, 40], yr: [-20, 30] },
      // Center area
      { pi: 0, x: '45%', y: '38%', sz: 350, dur: 35, delay: 8, xr: [-60, 60], yr: [-30, 30] },
      { pi: 1, x: '55%', y: '55%', sz: 200, dur: 24, delay: 12, xr: [-40, 40], yr: [-40, 40] },
      // Bottom-left cluster
      { pi: 2, x: '10%', y: '68%', sz: 400, dur: 32, delay: 4, xr: [-30, 60], yr: [-50, 20] },
      { pi: 3, x: '22%', y: '82%', sz: 180, dur: 20, delay: 9, xr: [-60, 30], yr: [-30, 40] },
      // Bottom-right cluster
      { pi: 0, x: '78%', y: '70%', sz: 320, dur: 27, delay: 5, xr: [20, -50], yr: [-40, 20] },
      { pi: 1, x: '90%', y: '85%', sz: 240, dur: 33, delay: 15, xr: [-30, 30], yr: [-50, 10] },
      // Extra depth
      { pi: 2, x: '35%', y: '72%', sz: 180, dur: 29, delay: 7, xr: [-40, 50], yr: [-20, 50] },
      { pi: 3, x: '62%', y: '22%', sz: 200, dur: 25, delay: 11, xr: [-30, 40], yr: [-40, 30] },
    ];

    return orbDefs.map((def, i) => ({
      id: i,
      palette: PALETTES[def.pi],
      glow: GLOW_COLORS[def.pi],
      size: def.sz,
      x: def.x,
      y: def.y,
      xPath: [`${def.xr[0]}px`, `${def.xr[1]}px`, `${(def.xr[0] + def.xr[1]) / 2}px`, `${def.xr[0]}px`],
      yPath: [`${def.yr[0]}px`, `${def.yr[1]}px`, `${(def.yr[0] + def.yr[1]) / 2}px`, `${def.yr[0]}px`],
      duration: def.dur,
      delay: def.delay,
      scaleRange: [0.9, 1.1] as [number, number],
    }));
  }, []);

  return (
    <>
      {orbs.map(orb => (
        <motion.div
          key={orb.id}
          className="fixed pointer-events-none z-[-4]"
          style={{
            left: orb.x,
            top: orb.y,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            marginLeft: `-${orb.size / 2}px`,
            marginTop: `-${orb.size / 2}px`,
            borderRadius: '9999px',
            background: `radial-gradient(circle at center, ${orb.palette.from}, ${orb.palette.to}, transparent 70%)`,
            filter: `blur(${Math.round(orb.size * 0.28)}px)`,
            boxShadow: `0 0 ${orb.size}px ${Math.round(orb.size * 0.15)}px ${orb.glow}`,
            willChange: 'transform',
          }}
          animate={{
            x: orb.xPath,
            y: orb.yPath,
            scale: [orb.scaleRange[0], orb.scaleRange[1], orb.scaleRange[0]],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
