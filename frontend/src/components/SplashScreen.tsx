import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeShaderBackground from './ThreeShaderBackground';

const TITLE = 'CoreVision Studio';
const SUBTITLE = 'Develop, Analyze and Optimize Computer Vision Models for Apple Silicon Deployment';
const SPLASH_DURATION_MS = 3800; // total before exit begins

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('exit'), SPLASH_DURATION_MS);
    const t2 = setTimeout(() => onDone(), SPLASH_DURATION_MS + 800); // wait for exit anim
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const letters = TITLE.split('');

  return (
    <AnimatePresence>
      {phase === 'enter' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <ThreeShaderBackground />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem' }}>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative' }}
            >
              {/* Glow ring behind logo */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
              <img
                src="/corevision_logo.png"
                alt="CoreVision Logo"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  borderRadius: '20px',
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))',
                }}
              />
            </motion.div>

            {/* Animated title — letter by letter */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
                {letters.map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.5 + i * 0.04,
                      type: 'spring',
                      stiffness: 160,
                      damping: 22,
                    }}
                    style={{
                      display: 'inline-block',
                      color: char === ' ' ? 'transparent' : 'transparent',
                      backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #818cf8 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      whiteSpace: 'pre',
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.8 }}
                style={{
                  marginTop: '1rem',
                  color: '#94a3b8',
                  fontSize: '1rem',
                  maxWidth: '480px',
                  lineHeight: 1.6,
                  textAlign: 'center',
                  margin: '1rem auto 0 auto',
                }}
              >
                {SUBTITLE}
              </motion.p>
            </div>

            {/* Animated underline */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '320px', opacity: 1 }}
              transition={{ delay: 1.8, duration: 1.0, ease: 'easeOut' }}
              style={{
                height: '2px',
                background: 'linear-gradient(to right, transparent, rgba(165,180,252,0.6), transparent)',
                borderRadius: '2px',
              }}
            />

            {/* Loading dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#6D5DFB',
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
