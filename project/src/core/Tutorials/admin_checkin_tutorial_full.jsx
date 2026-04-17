import React, { useState, useEffect } from 'react';
import './admin_checkin_tutorial_full.css';

const PersonIcon = ({ color = '#3b82f6' }) => (
    <svg viewBox="0 0 32 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="10" r="9" fill={color} />
        <rect x="5" y="26" width="22" height="48" rx="11" fill={color} />
    </svg>
);

const ScanPhone = () => (
    <div className="act-phone">
        <div className="act-phone-speaker" />
        <div className="act-phone-screen">
            <div className="act-viewfinder">
                <span className="act-vf-corner act-vf-tl" />
                <span className="act-vf-corner act-vf-tr" />
                <span className="act-vf-corner act-vf-bl" />
                <span className="act-vf-corner act-vf-br" />
                <div className="act-scan-line" />
            </div>
        </div>
        <div className="act-phone-home" />
    </div>
);

const TableWithQR = ({ className }) => (
    <div className={`act-table-group${className ? ' ' + className : ''}`}>
        <svg viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="act-table-svg">
            {/* Easel back-support leg */}
            <line x1="58" y1="8" x2="78" y2="58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            {/* Sign card */}
            <rect x="18" y="2" width="55" height="58" rx="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
            {/* SCAN ME label */}
            <text x="45" y="16" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="800"
                  fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">SCAN ME</text>
            {/* QR code block */}
            <rect x="27" y="20" width="36" height="34" rx="2" fill="#1a1a2e" />
            {/* Position markers */}
            <rect x="30" y="23" width="9" height="9" rx="1.5" fill="#ffffff" />
            <rect x="31.5" y="24.5" width="6" height="6" rx="0.5" fill="#1a1a2e" />
            <rect x="51" y="23" width="9" height="9" rx="1.5" fill="#ffffff" />
            <rect x="52.5" y="24.5" width="6" height="6" rx="0.5" fill="#1a1a2e" />
            <rect x="30" y="39" width="9" height="9" rx="1.5" fill="#ffffff" />
            <rect x="31.5" y="40.5" width="6" height="6" rx="0.5" fill="#1a1a2e" />
            {/* Data pattern */}
            <rect x="44" y="35" width="4" height="4" fill="#ffffff" />
            <rect x="51" y="39" width="5" height="5" fill="#ffffff" />
            <rect x="44" y="43" width="5" height="4" fill="#ffffff" />
            {/* Table surface */}
            <rect x="2" y="65" width="116" height="13" rx="4" fill="#3b82f6" />
            {/* Table legs */}
            <rect x="10" y="78" width="9" height="55" rx="3" fill="#3b82f6" />
            <rect x="101" y="78" width="9" height="55" rx="3" fill="#3b82f6" />
        </svg>
    </div>
);

const CTAButton = ({ onClick }) => (
    <div className="act-cta-wrapper" onClick={onClick}>
        <button className="act-cta-btn" aria-label="Continue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff"
                 strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
            </svg>
        </button>
        <span className="act-cta-ring act-cta-ring-1" />
        <span className="act-cta-ring act-cta-ring-2" />
    </div>
);

const AdminCheckinTutorialFull = ({ isVisible, onComplete }) => {
    const [scene, setScene] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);

    useEffect(() => {
        if (!isVisible) {
            setScene(0);
            setFadingOut(false);
            return;
        }

        const timers = [
            setTimeout(() => setScene(1), 3000),
            setTimeout(() => setScene(2), 6000),
            setTimeout(() => setScene(3), 9500),
        ];
        return () => timers.forEach(clearTimeout);
    }, [isVisible]);

    const handleComplete = () => {
        setFadingOut(true);
        setTimeout(() => onComplete?.(), 400);
    };

    if (!isVisible) return null;

    const s = scene;

    return (
        <div className={`act-overlay${fadingOut ? ' act-overlay-exit' : ''}`}>

            {/* ── Scenes 0-1: Scanning illustration ── */}
            <div className={`act-scene${s <= 1 ? ' act-scene-active' : ''}`}>
                <div className="act-header-area act-scan-headers" data-active-header={s <= 1 ? s : -1}>
                    <p className="act-header-text act-sh-0">
                        I start pairing people after a handful have scanned &amp; joined
                    </p>
                    <p className="act-header-text act-sh-1">
                        Its a pairing machine! As new people arrive they also get paired up immediately!
                    </p>
                </div>

                <div className="act-stage">
                    <div className="act-illustration">
                        <div className="act-person-group act-person-enter">
                            <div className="act-person-bounce">
                                <PersonIcon />
                            </div>
                            <ScanPhone />
                        </div>
                        <span className="act-arrow">&rarr;</span>
                        <TableWithQR className="act-table-enter" />
                    </div>
                </div>
            </div>

            {/* ── Scene 2: Cat on the beach ── */}
            <div className={`act-scene${s === 2 ? ' act-scene-active' : ''}`}>
                {s >= 2 && (
                    <>
                        <div className="act-header-area">
                            <p className="act-header-text act-single-header">
                                I'm not a natural event host, so the app helps me relax while everyone makes quality connections.
                            </p>
                        </div>
                        <div className="act-stage">
                            <div className="act-cat-frame">
                                <img
                                    src="/assets/relaxing_cat_beach.png"
                                    alt="Relaxing cat on beach"
                                    className="act-cat-img"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Scene 3: Final + CTA ── */}
            <div className={`act-scene${s === 3 ? ' act-scene-active' : ''}`}>
                {s >= 3 && (
                    <>
                        <div className="act-header-area">
                            <p className="act-header-text act-single-header">
                                After scanning, I tell them just one thing: &ldquo;Just listen to the app&rsquo;s instructions&rdquo;
                            </p>
                        </div>
                        <div className="act-stage">
                            <div className="act-illustration act-reenter">
                                <div className="act-person-group act-person-reenter">
                                    <div className="act-person-bounce">
                                        <PersonIcon />
                                    </div>
                                    <ScanPhone />
                                </div>
                                <span className="act-arrow">&rarr;</span>
                                <TableWithQR />
                            </div>
                            <CTAButton onClick={handleComplete} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminCheckinTutorialFull;
