import { useState, useEffect, useRef } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import './DesktopPhoneMockups.css';

const PROFILE_DATA = [
  { img: '/assets/kate_rodriguez.png',    name: 'Kate Rodriguez' },
  { img: '/assets/tony_chopper.jpg',      name: 'Tony Chopper' },
  { img: '/assets/lolita_johnson.png',    name: 'Lolita Johnson' },
  { img: '/assets/eddy_nunez.png',        name: 'Eddy Nunez' },
  { img: '/assets/sarah_ramirez.png',     name: 'Sarah Ramirez' },
  { img: '/assets/ken_johnson.png',       name: 'Ken Johnson' },
  { img: '/assets/topaz_jones.png',       name: 'Topaz Jones' },
  { img: '/assets/sarah_riez.png',        name: 'Sarah Riez' },
  { img: '/assets/amy_chang.png',         name: 'Amy Chang' },
  { img: '/assets/blake_johnson.png',     name: 'Blake Johnson' },
  { img: '/assets/wendy_blonde.png',      name: 'Wendy Blonde' },
  { img: '/assets/mike_laos.png',         name: 'Mike Laos' },
  { img: '/assets/loretta_garza.png',     name: 'Loretta Garza' },
  { img: '/assets/kayla_villalobos.png',  name: 'Kayla Villalobos' },
  { img: '/assets/sofia_cortez.png',      name: 'Sofia Cortez' },
  { img: '/assets/yolanda_soap.png',      name: 'Yolanda Soap' },
];

const TIMER_STARTS = [480, 395, 512];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Preload an array of image URLs; resolves when every one is loaded (or errored) */
function preloadImages(profiles) {
  return Promise.all(
    profiles.map(
      ({ img }) =>
        new Promise((resolve) => {
          const image = new window.Image();
          image.onload = resolve;
          image.onerror = resolve; // still proceed on broken image
          image.src = img;
        })
    )
  );
}

/* Pure render — no internal state; photo shows immediately since images are preloaded */
const PhoneMockup = ({ profile, slotIndex }) => (
  <div className="dpm-phone" style={{ animationDelay: `${slotIndex * 170}ms` }}>
    <div className="dpm-screen">

      <h2 className="dpm-lobby-header">
        <span className="dpm-lobby-pop-burst">Go find {profile.name}!</span>
      </h2>

      <div className="dpm-timer-wrap">
        <CountdownCircleTimer
          isPlaying
          duration={600}
          initialRemainingTime={TIMER_STARTS[slotIndex]}
          colors={['#64B5F6', '#2196F3', '#1976D2']}
          colorsTime={[600, 300, 0]}
          size={86}
          strokeWidth={7}
          trailColor="#f0f1f4"
          strokeLinecap="round"
          onComplete={() => ({ shouldRepeat: true })}
        >
          {({ remainingTime }) => {
            const mins = Math.floor(remainingTime / 60);
            const secs = remainingTime % 60;
            return (
              <div className="dpm-timer-inner">
                <span className="dpm-timer-time">{mins}:{String(secs).padStart(2, '0')}</span>
                <span className="dpm-timer-label">time left</span>
              </div>
            );
          }}
        </CountdownCircleTimer>
      </div>

      <div className="dpm-player-wrap">
        <img src={profile.img} alt={profile.name} className="dpm-player-photo" />
        <div className="dpm-player-name-badge">{profile.name}</div>
      </div>

    </div>
  </div>
);

const DesktopPhoneMockups = () => {
  const [sets] = useState(() => {
    const picked = shuffle(PROFILE_DATA).slice(0, 6);
    return [picked.slice(0, 3), picked.slice(3, 6)];
  });

  const [activeSet, setActiveSet] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  /* Ref so the interval callback always sees the current activeSet without being a dependency */
  const activeSetRef = useRef(0);

  /* Preload both groups upfront so the very first display is clean */
  useEffect(() => {
    preloadImages(sets.flat());
  }, [sets]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = 1 - activeSetRef.current;
      const nextGroup = sets[nextIndex];

      /* Wait until every image in the next group is cached, then transition */
      preloadImages(nextGroup).then(() => {
        setFadingOut(true);
        setTimeout(() => {
          activeSetRef.current = nextIndex;
          setActiveSet(nextIndex);
          setAnimKey(prev => prev + 1);
          setFadingOut(false);
        }, 500);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [sets]);

  return (
    <div className="dpm-wrapper">
      <div
        key={animKey}
        className={`dpm-row${fadingOut ? ' dpm-fading-out' : ''}`}
      >
        {sets[activeSet].map((profile, i) => (
          <PhoneMockup key={i} profile={profile} slotIndex={i} />
        ))}
      </div>
    </div>
  );
};

export default DesktopPhoneMockups;
