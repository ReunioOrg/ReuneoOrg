import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { PhoneMockup, PROFILE_DATA, shuffle, preloadImages } from '../DesktopPhoneMockups/LandingPhoneMockup.jsx';
import '../DesktopPhoneMockups/DesktopPhoneMockups.css';
import './MobileHeroPhonePair.css';

const MHPP_GAP_PX = 14;

/**
 * Fraction of each mockup’s height to show — scales with strip height so XR-class screens
 * reveal ~78%, compact phones stay nearer ~70%. Higher = lower crop line so the hero’s
 * rounded bottom clips chrome instead of leaving a flat band above the curve.
 */
function mhppVerticalFraction(stripH) {
  if (!Number.isFinite(stripH) || stripH < 80) return 0.7;
  if (stripH >= 420) return 0.82;
  if (stripH >= 340) return 0.78;
  if (stripH >= 260) return 0.74;
  if (stripH >= 200) return 0.7;
  return 0.66;
}

/** Outer two phones from the desktop trio (indices 0 & 2), cropped + scaled for mobile hero */
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
    const clipW = (pw * 2) / 3;
    const nw = clipW + MHPP_GAP_PX + clipW;
    const frac = mhppVerticalFraction(stripH);
    const nh = ph * frac;

    /** Uniform scale so the whole cropped band fits — avoids SE chopping when width-only scale exceeds strip height */
    const scale = Math.min(stripW / nw, stripH / nh);
    const viewportH = nh * scale;

    setLayout({ scale, nw, nh, clipW, viewportH });
  }, []);

  useLayoutEffect(() => {
    updateLayout();

    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(root);
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
              <div className="mhpp-shift mhpp-shift--left">
                <PhoneMockup profile={outerLeft} slotIndex={0} />
              </div>
            </div>
            <div className="mhpp-clip" style={{ width: layout.clipW, height: layout.nh }}>
              <div className="mhpp-shift mhpp-shift--right">
                <PhoneMockup profile={outerRight} slotIndex={2} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
