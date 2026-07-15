import { motion } from "framer-motion";

const NUM_PARTICLES = 40;
const particles = Array.from({ length: NUM_PARTICLES }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  duration: Math.random() * 20 + 20,
  delay: Math.random() * -20,
  moveX: (Math.random() - 0.5) * 20,
  moveY: (Math.random() - 0.5) * 20,
  color: ['#22D3EE', '#EC4899', '#A855F7'][Math.floor(Math.random() * 3)]
}));

/** Builds a smooth sinusoidal SVG path centered at centerY */
function sinePath(centerY: number, amp: number, period: number, reps: number): string {
  const hw = period / 2;
  const startX = -(reps * period);
  const endX = reps * period;
  let d = `M ${startX} ${centerY} `;
  // First half-wave (goes to trough)
  d += `C ${startX + hw * 0.33} ${centerY - amp}, ${startX + hw * 0.67} ${centerY - amp}, ${startX + hw} ${centerY} `;
  let x = startX + hw;
  let up = true;
  while (x + hw <= endX) {
    const peakY = up ? centerY + amp : centerY - amp;
    d += `S ${x + hw * 0.67} ${peakY}, ${x + hw} ${centerY} `;
    x += hw;
    up = !up;
  }
  return d;
}

export default function AuroraBackground() {
  // 3 waves — same path, phase-shifted by 1/3 period each → they cross each other
  const PERIOD = 1440;  // px, one full sine cycle
  const AMP = 140;  // px, amplitude — more visible sinusoidal shape
  const CENTER_Y = 1350;  // center in the 4320×2700 rotated viewBox
  const REPS = 6;     // periods left & right for seamless scroll

  const WAVE_PATH = sinePath(CENTER_Y, AMP, PERIOD, REPS);

  // 6 waves — 60° phase offsets (PERIOD/6 = 240px) → max crossing density
  const waves = [
    { phase: 0, colors: ['#22D3EE', '#EC4899', '#A855F7', '#22D3EE'], sw: 2.5 },
    { phase: -240, colors: ['#EC4899', '#A855F7', '#22D3EE', '#EC4899'], sw: 2 },
    { phase: -480, colors: ['#A855F7', '#22D3EE', '#EC4899', '#A855F7'], sw: 2.5 },
    { phase: -720, colors: ['#22D3EE', '#A855F7', '#EC4899', '#22D3EE'], sw: 2 },
    { phase: -960, colors: ['#EC4899', '#22D3EE', '#A855F7', '#EC4899'], sw: 2.5 },
    { phase: -1200, colors: ['#A855F7', '#EC4899', '#22D3EE', '#A855F7'], sw: 2 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -10, background: '#070B17' }}>

      {/* ── Depth grid ── */}
      <div className="absolute inset-0" style={{
        zIndex: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* ── Aurora blobs ── */}
      <motion.div style={{
        position: 'absolute', zIndex: 10, top: '-30%', left: '-20%', width: '140vw', height: '100vh',
        background: 'radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0.10) 35%, transparent 65%)',
        filter: 'blur(120px)'
      }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 50, 0], scale: [1, 1.06, 0.97, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }} />

      <motion.div style={{
        position: 'absolute', zIndex: 10, top: '-25%', right: '-20%', width: '130vw', height: '90vh',
        background: 'radial-gradient(ellipse at 80% 15%, rgba(168,85,247,0.22) 0%, rgba(168,85,247,0.10) 35%, transparent 65%)',
        filter: 'blur(130px)'
      }}
        animate={{ x: [0, -50, 30, 0], y: [0, 60, -20, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }} />

      <motion.div style={{
        position: 'absolute', zIndex: 10, bottom: '-30%', left: '10%', width: '80vw', height: '80vh',
        background: 'radial-gradient(ellipse at 50% 80%, rgba(91,140,255,0.18) 0%, rgba(91,140,255,0.08) 40%, transparent 65%)',
        filter: 'blur(110px)'
      }}
        animate={{ x: [0, 60, -60, 0], y: [0, -20, 30, 0], scale: [1, 1.15, 0.92, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }} />

      {/* ── 3 Diagonal intersecting sinusoidal waves ──────────────────
          Container is rotated −32° so waves are oriented bottom-left→top-right.
          All 3 waves are the SAME sinusoid, just phase-shifted by 480px (120°).
          Phase offset guarantees they cross each other exactly twice per period.
          They scroll together (same speed) so the crossing pattern is dynamic
          as colors shift independently.
      ─────────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: '300vw', height: '300vh',
        transform: 'translate(-50%, -50%) rotate(-32deg)',
        zIndex: 20,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}
          viewBox="0 0 4320 2700" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="wg" x="-5%" y="-800%" width="110%" height="1700%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          {waves.map((w, i) => (
            <motion.path
              key={i}
              d={WAVE_PATH}
              fill="none"
              strokeWidth={w.sw}
              filter="url(#wg)"
              animate={{
                x: [w.phase, w.phase - PERIOD],   // scroll one full period → seamless loop
                stroke: w.colors,
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                x: { duration: 14, repeat: Infinity, ease: 'linear' },
                stroke: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 2 },
              }}
            />
          ))}
        </svg>
      </div>

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}vw`,
              top: `${p.y}vh`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              opacity: 0.5
            }}
            animate={{
              x: [0, p.moveX + 'vw', 0],
              y: [0, p.moveY + 'vh', 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* ── Film-grain noise ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 30, opacity: 0.025, mixBlendMode: 'soft-light',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px'
      }} />
    </div>
  );
}
