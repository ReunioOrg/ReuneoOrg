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

/** Static per-slot screen content (no live timers) */
export const SLOT_CONTENT = [
  { table: 7, time: '6:12', tags: ['Software Developer', 'Investor'] },
  { table: 3, time: '5:08', tags: ['Content Creator', 'Brand Manager'] },
  { table: 12, time: '1:48', tags: ['Founder', 'Designer'] },
];

function DoubleArrow() {
  return (
    <svg className="dpm-tag-arrow" viewBox="0 0 28 12" aria-hidden="true">
      <path d="M1 6h26M6 1L1 6l5 5M22 1l5 5-5 5" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  const slot = SLOT_CONTENT[slotIndex % SLOT_CONTENT.length];
  return (
    <div className="dpm-phone" style={{ animationDelay: `${slotIndex * 170}ms` }}>
      <div className="dpm-screen">
        <h2 className="dpm-lobby-header">
          <span className="dpm-lobby-pop-burst">Go find {profile.name}!</span>
        </h2>

        <p className="dpm-table">AT TABLE: <span>{slot.table}</span></p>
        <div className="dpm-time-pill">{slot.time} left</div>
        <div className="dpm-tag-row">
          <span>{slot.tags[0]}</span>
          <DoubleArrow />
          <span>{slot.tags[1]}</span>
        </div>

        <div className="dpm-player-wrap">
          <img src={profile.img} alt={profile.name} className="dpm-player-photo" />
          <div className="dpm-player-name-badge">{profile.name}</div>
        </div>
        <span className="dpm-home-indicator" aria-hidden="true" />
      </div>
    </div>
  );
}
