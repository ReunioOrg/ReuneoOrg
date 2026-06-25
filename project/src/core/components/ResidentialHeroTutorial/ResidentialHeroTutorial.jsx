import React, { useEffect, useRef, useState } from 'react';
import AdminCheckinTutorialFull from '../../Tutorials/admin_checkin_tutorial_full';
import './ResidentialHeroTutorial.css';

const MAX_LOOPS = 8;
const MAX_SESSION_MS = 5 * 60 * 1000;

function ResidentialHeroTutorial() {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [sessionPaused, setSessionPaused] = useState(false);
  const sessionStartRef = useRef(null);
  const loopCountRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && sessionStartRef.current == null) {
          sessionStartRef.current = Date.now();
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const canContinueLooping = () => {
    if (sessionStartRef.current && Date.now() - sessionStartRef.current > MAX_SESSION_MS) {
      return false;
    }
    return loopCountRef.current < MAX_LOOPS;
  };

  const handleComplete = () => {
    loopCountRef.current += 1;
    if (inView && canContinueLooping()) {
      setRunKey((k) => k + 1);
    } else {
      setSessionPaused(true);
    }
  };

  const isPlaying = inView && !sessionPaused;

  return (
    <div ref={containerRef} className="res-hero-tutorial">
      {isPlaying ? (
        <AdminCheckinTutorialFull
          key={runKey}
          isVisible
          embedded
          startFromScene={13}
          onComplete={handleComplete}
          showSkip={false}
        />
      ) : (
        <div className="res-hero-tutorial-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}

export default ResidentialHeroTutorial;
