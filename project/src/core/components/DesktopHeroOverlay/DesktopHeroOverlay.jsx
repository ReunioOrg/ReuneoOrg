import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AnimatedText from '../AnimatedText/AnimatedText';
import './DesktopHeroOverlay.css';

const PHASES = [
  {
    taglines: [
      { text: 'Real Events',      position: 'hero-mid-left',  delay: 0 },
      { text: 'Real Connections',  position: 'hero-mid-right', delay: 0.15 },
    ]
  },
  {
    taglines: [
      { text: 'Real Engagement', position: 'hero-low-left',  delay: 0 },
      { text: 'for a Stronger Community',               position: 'hero-low-right', delay: 0.15 },
    ]
  }
];

const HOLD_DURATION = 900;
const GAP_BETWEEN_PHASES = 150;
const LOOP_PAUSE = 1500;

const phaseExitVariant = {
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

function DesktopHeroOverlay() {
  const [phase, setPhase] = useState(0);
  const loopRef = useRef(0);
  const completedCountRef = useRef(0);
  const holdTimerRef = useRef(null);
  const gapTimerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
    };
  }, []);

  useEffect(() => {
    completedCountRef.current = 0;
  }, [phase]);

  const handleTaglineComplete = useCallback(() => {
    completedCountRef.current += 1;
    const taglinesInPhase = PHASES[phase].taglines.length;

    if (completedCountRef.current >= taglinesInPhase) {
      holdTimerRef.current = setTimeout(() => {
        setPhase(-1);
        const isLastPhase = phase >= PHASES.length - 1;
        const delay = isLastPhase
          ? 500 + LOOP_PAUSE
          : 500 + GAP_BETWEEN_PHASES;

        gapTimerRef.current = setTimeout(() => {
          if (isLastPhase) {
            loopRef.current += 1;
            setPhase(0);
          } else {
            setPhase(phase + 1);
          }
        }, delay);
      }, HOLD_DURATION);
    }
  }, [phase]);

  if (prefersReducedMotion) return null;

  const currentPhase = PHASES[phase];

  return createPortal(
    <div className="desktop-hero-overlay" aria-live="polite">
      <AnimatePresence mode="wait">
        {currentPhase && (
          <motion.div
            key={`${loopRef.current}-${phase}`}
            variants={phaseExitVariant}
            exit="exit"
            style={{ position: 'absolute', inset: 0 }}
          >
            {currentPhase.taglines.map((tagline, i) => (
              <AnimatedText
                key={i}
                text={tagline.text}
                className={`hero-tagline ${tagline.position}`}
                delay={tagline.delay}
                onComplete={handleTaglineComplete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export default DesktopHeroOverlay;
