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

/* ── Scene 4: Phone that zooms to fill screen ───────────────────────────── */

const PhoneZoom = () => (
    <div className="act-zoom-phone-wrapper">
        <div className="act-phone act-phone-zooming">
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
    </div>
);

/* ── Scene 5: Mock signup — name step ───────────────────────────────────── */

const MockNameStep = ({ active }) => {
    const [typed, setTyped] = useState('');
    const [showValid, setShowValid] = useState(false);
    const [showContinue, setShowContinue] = useState(false);
    const [pressContinue, setPressContinue] = useState(false);

    const TARGET = 'Kate';

    useEffect(() => {
        if (!active) {
            setTyped('');
            setShowValid(false);
            setShowContinue(false);
            setPressContinue(false);
            return;
        }

        let typeInterval;
        const laterTimers = [];

        const startDelay = setTimeout(() => {
            let idx = 0;
            typeInterval = setInterval(() => {
                idx++;
                setTyped(TARGET.slice(0, idx));
                if (idx >= TARGET.length) {
                    clearInterval(typeInterval);
                    laterTimers.push(setTimeout(() => setShowValid(true), 400));
                    laterTimers.push(setTimeout(() => setShowContinue(true), 900));
                    laterTimers.push(setTimeout(() => setPressContinue(true), 1800));
                }
            }, 160);
        }, 500);

        return () => {
            clearTimeout(startDelay);
            if (typeInterval) clearInterval(typeInterval);
            laterTimers.forEach(clearTimeout);
        };
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="act-mock-signup">
            <p className="act-mock-header">Signup to join</p>

            <div className="act-mock-dots">
                <span className="act-mock-dot act-mock-dot-active" />
                <span className="act-mock-dot" />
            </div>

            <div className="act-mock-name-field">
                <label className="act-mock-label">Your Name</label>
                <div className={`act-mock-input-box${showValid ? ' act-mock-input-done' : ' act-mock-input-pulsing'}`}>
                    {typed.length === 0 ? (
                        <span className="act-mock-placeholder">Enter your name</span>
                    ) : (
                        <>
                            <span className="act-mock-typed">{typed}</span>
                            {!showValid && <span className="act-mock-cursor" />}
                        </>
                    )}
                </div>
                {showValid && (
                    <span className="act-mock-success">✓ Valid</span>
                )}
            </div>

            {showContinue && (
                <div className="act-mock-next-container">
                    <button className={`act-mock-continue-btn${pressContinue ? ' act-mock-btn-press' : ''}`}>
                        Continue →
                    </button>
                </div>
            )}
        </div>
    );
};

/* ── Scene 6: Mock signup — photo step ──────────────────────────────────── */

const MockPhotoStep = ({ active, onDone }) => {
    const [showModal, setShowModal] = useState(false);
    const [pressModal, setPressModal] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [pressComplete, setPressComplete] = useState(false);

    useEffect(() => {
        if (!active) {
            setShowModal(false);
            setPressModal(false);
            setShowFlash(false);
            setShowPhoto(false);
            setShowComplete(false);
            setPressComplete(false);
            return;
        }

        const timers = [
            setTimeout(() => setShowModal(true),    300),
            setTimeout(() => setPressModal(true),   1800),
            setTimeout(() => setShowModal(false),   2100),
            setTimeout(() => setShowFlash(true),    2700),
            setTimeout(() => setShowFlash(false),   3150),
            setTimeout(() => setShowPhoto(true),    3250),
            setTimeout(() => setShowComplete(true), 4100),
            setTimeout(() => setPressComplete(true),5000),
            setTimeout(() => onDone?.(),            5500),
        ];

        return () => timers.forEach(clearTimeout);
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="act-mock-signup">
            <div className="act-mock-dots">
                <span className="act-mock-dot act-mock-dot-done" />
                <span className="act-mock-dot act-mock-dot-active" />
            </div>

            <label className="act-mock-label act-mock-label-selfie">
                Take a Selfie (so people can find you)
            </label>

            <div className="act-mock-photo-area">
                {!showPhoto ? (
                    <div className="act-mock-upload-placeholder">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                             stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>Choose a photo...</span>
                    </div>
                ) : (
                    <img
                        src="/assets/kate_rodriguez.png"
                        alt="Kate"
                        className="act-mock-photo"
                    />
                )}
            </div>

            {showComplete && (
                <button className={`act-mock-primary-btn${pressComplete ? ' act-mock-btn-press' : ''}`}>
                    Complete Signup
                </button>
            )}

            {/* Camera flash */}
            {showFlash && <div className="act-camera-flash" />}

            {/* Selfie reminder modal */}
            {showModal && (
                <div className="act-selfie-modal-overlay">
                    <div className="act-selfie-modal-card">
                        <h2 className="act-selfie-modal-title">You Must Take a Selfie</h2>
                        <p className="act-selfie-modal-text">
                            Don't use old photos, people need to know how you look in order to find you in the room - trust us.
                        </p>
                        <button className={`act-selfie-modal-btn${pressModal ? ' act-mock-btn-press' : ''}`}>
                            Understood
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Main component ─────────────────────────────────────────────────────── */

const AdminCheckinTutorialFull = ({ isVisible, onComplete }) => {
    const [scene, setScene] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);

    /* Scenes 0-3: auto-advancing timers */
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

    /* Scene 4 → 5: after phone zoom completes (~1.1s anim + small buffer) */
    useEffect(() => {
        if (scene !== 4) return;
        const t = setTimeout(() => setScene(5), 1400);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 5 → 6: after typing + Continue press
       500ms start delay + 4×160ms typing = 1140ms
       + 1800ms until pressContinue = 2940ms total → advance at 3200ms */
    useEffect(() => {
        if (scene !== 5) return;
        const t = setTimeout(() => setScene(6), 3200);
        return () => clearTimeout(t);
    }, [scene]);

    const handleComplete = () => {
        setFadingOut(true);
        setTimeout(() => onComplete?.(), 400);
    };

    if (!isVisible) return null;

    const s = scene;

    return (
        <div className={`act-overlay${fadingOut ? ' act-overlay-exit' : ''}${s >= 4 ? ' act-overlay-white' : ''}`}>

            {/* ── Scenes 0-1: Scanning illustration ── */}
            <div className={`act-scene${s <= 1 ? ' act-scene-active' : ''}`}>
                <div className="act-header-area act-scan-headers" data-active-header={s <= 1 ? s : -1} style={{ marginTop: '36px' }}>
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
                        <div className="act-header-area" style={{ marginTop: '36px' }}>
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
                        <div className="act-header-area" style={{ marginTop: '36px' }}>
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
                            <CTAButton onClick={() => setScene(4)} />
                        </div>
                    </>
                )}
            </div>

            {/* ── Scene 4: Phone zoom → white ── */}
            <div className={`act-scene act-scene-zoom${s === 4 ? ' act-scene-active' : ''}`}>
                {s >= 4 && <PhoneZoom />}
            </div>

            {/* ── Scene 5: Mock signup – name ── */}
            <div className={`act-scene act-scene-mock${s === 5 ? ' act-scene-active' : ''}`}>
                {s >= 5 && <MockNameStep active={s === 5} />}
            </div>

            {/* ── Scene 6: Mock signup – photo ── */}
            <div className={`act-scene act-scene-mock${s === 6 ? ' act-scene-active' : ''}`}>
                {s >= 6 && <MockPhotoStep active={s === 6} onDone={handleComplete} />}
            </div>

        </div>
    );
};

export default AdminCheckinTutorialFull;
