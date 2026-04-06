import { useCallback } from 'react';
import { motion } from 'framer-motion';

const CHAR_EASE = [0.33, 1, 0.68, 1]; // equivalent to GSAP power3.out

function AnimatedText({
  text,
  className = '',
  delay = 0,
  stagger = 0.05,
  duration = 0.8,
  ease = CHAR_EASE,
  onComplete
}) {
  const chars = text.split('');
  const lastIndex = chars.length - 1;

  const handleLastChar = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <span
      className={className}
      aria-label={text}
      role="heading"
      aria-level="2"
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + i * stagger,
            duration,
            ease
          }}
          onAnimationComplete={i === lastIndex ? handleLastChar : undefined}
          style={{
            display: 'inline-block',
            willChange: 'transform, opacity'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

export default AnimatedText;
