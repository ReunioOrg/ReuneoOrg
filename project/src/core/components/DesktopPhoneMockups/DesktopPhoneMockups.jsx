import { useState, useEffect, useRef } from 'react';
import { PhoneMockup, PROFILE_DATA, shuffle, preloadImages } from './LandingPhoneMockup.jsx';
import './DesktopPhoneMockups.css';

const DesktopPhoneMockups = () => {
  const [sets] = useState(() => {
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
    const interval = setInterval(() => {
      const nextIndex = 1 - activeSetRef.current;
      const nextGroup = sets[nextIndex];

      preloadImages(nextGroup).then(() => {
        setFadingOut(true);
        setTimeout(() => {
          activeSetRef.current = nextIndex;
          setActiveSet(nextIndex);
          setAnimKey((prev) => prev + 1);
          setFadingOut(false);
        }, 500);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [sets]);

  return (
    <div className="dpm-wrapper">
      <div key={animKey} className={`dpm-row${fadingOut ? ' dpm-fading-out' : ''}`}>
        {sets[activeSet].map((profile, i) => (
          <PhoneMockup key={i} profile={profile} slotIndex={i} />
        ))}
      </div>
    </div>
  );
};

export default DesktopPhoneMockups;
