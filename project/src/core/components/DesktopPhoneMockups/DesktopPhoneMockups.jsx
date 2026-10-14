import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { PhoneMockup, PROFILE_DATA, shuffle, preloadImages } from './LandingPhoneMockup.jsx';
import './DesktopPhoneMockups.css';

const ROTATE_MS = 4500;
const FADE_MS = 500;

/** Six profiles in PROFILE_DATA order, Sarah Ramirez first. One profile per set. */
function setsStartingWithSarah() {
  const start = PROFILE_DATA.findIndex((p) => p.name === 'Sarah Ramirez');
  const from = start < 0 ? 0 : start;
  return Array.from({ length: 6 }, (_, i) => [
    PROFILE_DATA[(from + i) % PROFILE_DATA.length],
  ]);
}

/**
 * Homepage (default): shuffle six profiles into two rows of three and swap
 * them every 4.5s with a 0.5s fade. `singleRotating` shows one phone and
 * walks six profiles in order from Sarah Ramirez, on that same clock.
 */
const DesktopPhoneMockups = ({ singleRotating = false }) => {
  const [sets] = useState(() => {
    if (singleRotating) return setsStartingWithSarah();
    const picked = shuffle(PROFILE_DATA).slice(0, 6);
    return [picked.slice(0, 3), picked.slice(3, 6)];
  });

  const [activeSet, setActiveSet] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const activeSetRef = useRef(0);

  useEffect(() => {
    preloadImages(sets.flat());
  }, [sets]);

  useEffect(() => {
    if (
      singleRotating
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      const nextIndex = (activeSetRef.current + 1) % sets.length;
      const nextGroup = sets[nextIndex];

      preloadImages(nextGroup).then(() => {
        setFadingOut(true);
        setTimeout(() => {
          activeSetRef.current = nextIndex;
          setActiveSet(nextIndex);
          setAnimKey((prev) => prev + 1);
          setFadingOut(false);
        }, FADE_MS);
      });
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, [sets, singleRotating]);

  const holdEntrance = singleRotating && animKey === 0;

  return (
    <div className={singleRotating ? 'dpm-single' : 'dpm-wrapper'}>
      <div
        key={animKey}
        className={`dpm-row${fadingOut ? ' dpm-fading-out' : ''}${holdEntrance ? ' dpm-single-hold' : ''}`}
      >
        {sets[activeSet].map((profile, i) => (
          <PhoneMockup
            key={singleRotating ? profile.name : i}
            profile={profile}
            slotIndex={singleRotating ? activeSet % 3 : i}
            animationDelayMs={singleRotating ? 0 : undefined}
          />
        ))}
      </div>
    </div>
  );
};

DesktopPhoneMockups.propTypes = {
  singleRotating: PropTypes.bool,
};

export default DesktopPhoneMockups;
