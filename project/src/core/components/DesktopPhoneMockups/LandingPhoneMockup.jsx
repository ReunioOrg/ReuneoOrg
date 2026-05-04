import { CountdownCircleTimer } from 'react-countdown-circle-timer';

export const PROFILE_DATA = [
  { img: '/assets/kate_rodriguez.png', name: 'Kate Rodriguez' },
  { img: '/assets/tony_chopper.jpg', name: 'Tony Chopper' },
  { img: '/assets/lolita_johnson.png', name: 'Lolita Johnson' },
  { img: '/assets/eddy_nunez.png', name: 'Eddy Nunez' },
  { img: '/assets/sarah_ramirez.png', name: 'Sarah Ramirez' },
  { img: '/assets/ken_johnson.png', name: 'Ken Johnson' },
  { img: '/assets/topaz_jones.png', name: 'Topaz Jones' },
  { img: '/assets/sarah_riez.png', name: 'Sarah Riez' },
  { img: '/assets/amy_chang.png', name: 'Amy Chang' },
  { img: '/assets/blake_johnson.png', name: 'Blake Johnson' },
  { img: '/assets/wendy_blonde.png', name: 'Wendy Blonde' },
  { img: '/assets/mike_laos.png', name: 'Mike Laos' },
  { img: '/assets/loretta_garza.png', name: 'Loretta Garza' },
  { img: '/assets/kayla_villalobos.png', name: 'Kayla Villalobos' },
  { img: '/assets/sofia_cortez.png', name: 'Sofia Cortez' },
  { img: '/assets/yolanda_soap.png', name: 'Yolanda Soap' },
];

export const TIMER_STARTS = [480, 395, 512];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Preload profile images so timers / swaps render cleanly */
export function preloadImages(profiles) {
  return Promise.all(
    profiles.map(
      ({ img }) =>
        new Promise((resolve) => {
          const image = new window.Image();
          image.onload = resolve;
          image.onerror = resolve;
          image.src = img;
        })
    )
  );
}

/** Pure render — shared by desktop row-of-three and mobile outer pair */
export function PhoneMockup({ profile, slotIndex }) {
  return (
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
                  <span className="dpm-timer-time">
                    {mins}:{String(secs).padStart(2, '0')}
                  </span>
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
}
