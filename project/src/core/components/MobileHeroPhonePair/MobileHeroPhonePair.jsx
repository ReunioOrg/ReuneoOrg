import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { PhoneMockup, PROFILE_DATA, shuffle, preloadImages } from '../DesktopPhoneMockups/LandingPhoneMockup.jsx';
import '../DesktopPhoneMockups/DesktopPhoneMockups.css';
import './MobileHeroPhonePair.css';

const MHPP_GAP_PX = 14;
const MHPP_BTN_PAD_PX = 16;
/** CTA gap below header (12) + button height (56), mirrors App.jsx constants */
const MHPP_CTA_BLOCK_PX = 74;
const MHPP_SECTION_GAP_PX = 28;
/** Outer two phones from the desktop trio (indices 0 & 2), full-size side by side, scaled for mobile hero */
export default function MobileHeroPhonePair() {
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

  const rootRef = useRef(null);
  const rowRef = useRef(null);
  const [layout, setLayout] = useState({
    scale: 0.62,
    nw: 388,
    nh: 372,
    clipW: 182,
    viewportH: 245,
  });

  const updateLayout = useCallback(() => {
    const root = rootRef.current;
    const row = rowRef.current;
    if (!root || !row) return;

    const stripW = root.clientWidth;
    const stripH = root.clientHeight;
    if (stripW < 48 || stripH < 48) return;

    const phoneEl = row.querySelector('.dpm-phone');
    if (!phoneEl) return;

    const pw = phoneEl.offsetWidth;
    const ph = phoneEl.offsetHeight;
    /** Full phones side by side (no crop) + room for side buttons on both outer edges */
    const clipW = pw + MHPP_BTN_PAD_PX * 2;
    const nw = clipW * 2 + MHPP_GAP_PX;
    const nh = ph + MHPP_BTN_PAD_PX;
    /* v5: phones sit a normal section gap under the CTA; hero shell shrinks to fit (no dead band) */
    const scale = (stripW * 0.94) / nw;
    const viewportH = nh * scale;
    const hdr = document.querySelector('[data-mhero-header]');
    const shell = root.closest('.landing-hero-shell');
    const rootTop = root.getBoundingClientRect().top;
    if (hdr) {
      const pad = Math.max(0, hdr.getBoundingClientRect().bottom - rootTop + MHPP_CTA_BLOCK_PX + MHPP_SECTION_GAP_PX);
      root.style.paddingTop = `${pad}px`;
      if (shell) {
        const shellTop = shell.getBoundingClientRect().top;
        shell.style.height = `${Math.round(rootTop - shellTop + pad + viewportH + 20)}px`;
      }
    }

    setLayout({ scale, nw, nh, clipW, viewportH });
  }, []);

  useLayoutEffect(() => {
    updateLayout();

    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(root);
    const hdrEl = document.querySelector('[data-mhero-header]');
    if (hdrEl) ro.observe(hdrEl);
    return () => ro.disconnect();
  }, [updateLayout, activeSet, fadingOut, animKey]);

  const profiles = sets[activeSet];
  const outerLeft = profiles[0];
  const outerRight = profiles[2];

  return (
    <div ref={rootRef} className="mhpp-root">
      <div
        className="mhpp-viewport"
        style={{
          width: layout.nw * layout.scale,
          height: layout.viewportH,
        }}
      >
        <div
          className="mhpp-inner"
          style={{
            width: layout.nw,
            height: layout.nh,
            transform: `scale(${layout.scale})`,
          }}
        >
          <div
            ref={rowRef}
            key={animKey}
            className={`mhpp-row${fadingOut ? ' mhpp-row--fade-out' : ''}`}
          >
            <div className="mhpp-clip" style={{ width: layout.clipW, height: layout.nh }}>
              <div className="mhpp-shift">
                <PhoneMockup profile={outerLeft} slotIndex={0} />
              </div>
            </div>
            <div className="mhpp-clip" style={{ width: layout.clipW, height: layout.nh }}>
              <div className="mhpp-shift">
                <PhoneMockup profile={outerRight} slotIndex={2} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
