import React, { useState, useEffect, useRef, useCallback } from 'react';
import './admin_checkin_tutorial_full.css';
import '../lobby/how_to_tutorial.css';
import UserIsReadyAnimation from '../lobby/user_is_ready_animation';
import { TutorialSlide2, TutorialSlide3 } from '../lobby/how_to_tutorial';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import CoolerGeneralMatchEventFlow from './cooler_general_match_event_flow';

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
            <line x1="58" y1="8" x2="78" y2="58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="18" y="2" width="55" height="58" rx="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
            <text x="45" y="16" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="800"
                  fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">SCAN ME</text>
            <rect x="27" y="20" width="36" height="34" rx="2" fill="#1a1a2e" />
            <rect x="30" y="23" width="9" height="9" rx="1.5" fill="#ffffff" />
            <rect x="31.5" y="24.5" width="6" height="6" rx="0.5" fill="#1a1a2e" />
            <rect x="51" y="23" width="9" height="9" rx="1.5" fill="#ffffff" />
            <rect x="52.5" y="24.5" width="6" height="6" rx="0.5" fill="#1a1a2e" />
            <rect x="30" y="39" width="9" height="9" rx="1.5" fill="#ffffff" />
            <rect x="31.5" y="40.5" width="6" height="6" rx="0.5" fill="#1a1a2e" />
            <rect x="44" y="35" width="4" height="4" fill="#ffffff" />
            <rect x="51" y="39" width="5" height="5" fill="#ffffff" />
            <rect x="44" y="43" width="5" height="4" fill="#ffffff" />
            <rect x="2" y="65" width="116" height="13" rx="4" fill="#3b82f6" />
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
    const [showFlash, setShowFlash] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [pressComplete, setPressComplete] = useState(false);

    useEffect(() => {
        if (!active) {
            setShowFlash(false);
            setShowPhoto(false);
            setShowComplete(false);
            setPressComplete(false);
            return;
        }

        const timers = [
            setTimeout(() => setShowFlash(true),     600),
            setTimeout(() => setShowFlash(false),   1050),
            setTimeout(() => setShowPhoto(true),    1150),
            setTimeout(() => setShowComplete(true), 2000),
            setTimeout(() => setPressComplete(true),2900),
            setTimeout(() => onDone?.(),            3400),
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

            {showFlash && <div className="act-camera-flash" />}
        </div>
    );
};

/* ── Scenes 7 & 8: Mock tag selection ───────────────────────────────────── */

/* Reusable component for both self and desiring phases */
const MockTagStep = ({ active, phase, allTags, autoSelected, selfComplete, onDone }) => {
    const [selectedTags, setSelectedTags] = useState([]);
    const [showBtn, setShowBtn] = useState(false);
    const [pressBtn, setPressBtn] = useState(false);

    const listRef = useRef(null);
    const tagItemRefs = useRef({});

    const isSelf = phase === 'self';
    const btnLabel = isSelf ? 'Continue' : 'Save';

    /* Scroll to the most recently selected tag */
    useEffect(() => {
        if (selectedTags.length === 0) return;
        const lastTag = selectedTags[selectedTags.length - 1];
        const el = tagItemRefs.current[lastTag];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedTags]);

    useEffect(() => {
        if (!active) {
            setSelectedTags([]);
            setShowBtn(false);
            setPressBtn(false);
            return;
        }

        const count = autoSelected.length;
        const baseDelay = 600;
        const tagInterval = 520;
        const lastTagTime = baseDelay + (count - 1) * tagInterval;
        const btnDelay  = lastTagTime + 720;
        const pressDelay = btnDelay + 800;
        const doneDelay  = pressDelay + 520;

        const timers = [];

        autoSelected.forEach((tag, i) => {
            timers.push(
                setTimeout(() => {
                    setSelectedTags(prev => [...prev, tag]);
                }, baseDelay + i * tagInterval)
            );
        });

        timers.push(setTimeout(() => setShowBtn(true),  btnDelay));
        timers.push(setTimeout(() => setPressBtn(true), pressDelay));
        timers.push(setTimeout(() => onDone?.(),        doneDelay));

        return () => timers.forEach(clearTimeout);
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="act-mock-signup act-tag-step">
            {/* Progress tabs */}
            <div className="act-tag-progress">
                <div className={`act-tag-tab${isSelf && !selfComplete ? ' act-tag-tab-active' : ''}${selfComplete ? ' act-tag-tab-complete' : ''}`}>
                    {selfComplete && <span className="act-tag-tab-check">✓</span>}
                    Who are you?
                </div>
                <div className={`act-tag-tab${!isSelf ? ' act-tag-tab-active' : ''}`}>
                    Who do you want to meet?
                </div>
            </div>

            {/* Phase heading */}
            <h2 className="act-tag-heading">
                {isSelf ? 'Who are you?' : 'Who do you want to meet?'}
            </h2>

            {/* Tag list */}
            <div className="act-tag-list" ref={listRef}>
                {allTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                        <div
                            key={tag}
                            ref={el => { tagItemRefs.current[tag] = el; }}
                            className={`act-tag-item${isSelected ? ' act-tag-item-selected' : ''}`}
                        >
                            <span className={`act-tag-checkbox${isSelected ? ' act-tag-checkbox-checked' : ''}`} />
                            <span className="act-tag-item-text">{tag}</span>
                        </div>
                    );
                })}
            </div>

            {/* Continue / Save button */}
            {showBtn && (
                <button className={`act-tag-btn${pressBtn ? ' act-tag-btn-press' : ''}`}>
                    {btnLabel}
                </button>
            )}
        </div>
    );
};

/* ── Shuffle utility (Fisher-Yates) ─────────────────────────────────────── */

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* ── Tag split: determine how many go to self vs desiring ───────────────── */

function splitTags(shuffled) {
    const n = shuffled.length;
    let selfCount;
    if (n === 2) selfCount = 1;
    else if (n === 3) selfCount = 2;
    else if (n <= 5) selfCount = 2;
    else selfCount = 3;

    const desiringCount = Math.min(3, n - selfCount);
    return {
        selfTags: shuffled.slice(0, selfCount),
        desiringTags: shuffled.slice(selfCount, selfCount + desiringCount),
    };
}

/* ── Scene 11-15 data & components ──────────────────────────────────────── */

const MOCK_PROFILES = [
    { src: '/assets/kate_rodriguez.png',  name: 'Kate Rodriguez' },
    { src: '/assets/tony_chopper.jpg',    name: 'Tony Chopper' },
    { src: '/assets/lolita_johnson.png',  name: 'Lolita Johnson' },
    { src: '/assets/eddy_nunez.png',      name: 'Eddy Nunez' },
    { src: '/assets/sarah_ramirez.png',   name: 'Sarah Ramirez' },
    { src: '/assets/ken_johnson.png',     name: 'Ken Johnson' },
    { src: '/assets/topaz_jones.png',     name: 'Topaz Jones' },
    { src: '/assets/sarah_riez.png',      name: 'Sarah Riez' },
    { src: '/assets/amy_chang.png',       name: 'Amy Chang' },
    { src: '/assets/blake_johnson.png',   name: 'Blake Johnson' },
    { src: '/assets/wendy_blonde.png',    name: 'Wendy B.' },
    { src: '/assets/mike_laos.png',       name: 'Mike Laos' },
    { src: '/assets/loretta_garza.png',   name: 'Loretta Garza' },
    { src: '/assets/kayla_villalobos.png',name: 'Kayla V.' },
    { src: '/assets/sofia_cortez.png',    name: 'Sofia Cortez' },
    { src: '/assets/yolanda_soap.png',    name: 'Yolanda Soap' },
];

/* Admin mock — isolated pill bar with CTA pulse, pinned near top */
const MockAdminStart = ({ showPulse, showPress }) => (
    <div className="act-admin-start-wrapper">
        <div className="act-admin-pill-track">
            <div className={`act-admin-pill act-admin-pill-start pill-on-top${showPress ? ' act-admin-pill-press' : ''}`}>
                Start
                {showPulse && !showPress && (
                    <>
                        <span className="act-cta-ring act-cta-ring-1" />
                        <span className="act-cta-ring act-cta-ring-2" />
                    </>
                )}
            </div>
            <div className="act-admin-pill act-admin-pill-end-inactive">End</div>
        </div>
    </div>
);

/* End lobby mock — Start is now dimmed/used, End pill is active with pulse */
const MockAdminEnd = ({ showPulse, showPress }) => (
    <div className="act-admin-start-wrapper">
        <div className="act-admin-pill-track">
            <div className="act-admin-pill act-admin-pill-end-inactive-s13">Start</div>
            <div className={`act-admin-pill act-admin-pill-end-active pill-on-top${showPress ? ' act-admin-pill-press' : ''}`}>
                End
                {showPulse && !showPress && (
                    <>
                        <span className="act-cta-ring act-cta-ring-1" />
                        <span className="act-cta-ring act-cta-ring-2" />
                    </>
                )}
            </div>
        </div>
    </div>
);

/* Interrim "Creating Pairs…" — real fill-bar animation matching lobby-progress-interrim */
const MockInterrimBar = () => (
    <div className="act-admin-start-wrapper">
        <div className="act-admin-pill-track act-interrim-track">
            <div className="act-interrim-label-text">Creating Pairs…</div>
        </div>
    </div>
);

/* Active state — simplified mock of admin_lobby_view active state */
const MOCK_PAIRS = [
    { p1: MOCK_PROFILES[0], p2: MOCK_PROFILES[1], tag1: null,         tag2: null },
    { p1: MOCK_PROFILES[2], p2: MOCK_PROFILES[3], tag1: null,         tag2: null },
    { p1: MOCK_PROFILES[4], p2: MOCK_PROFILES[5], tag1: null,         tag2: null },
];

const MockActiveState = ({ customTags, active }) => {
    const tag1 = customTags && customTags[0] ? customTags[0] : null;
    const tag2 = customTags && customTags[1] ? customTags[1] : null;

    const [showKatePulse, setShowKatePulse] = useState(false);

    useEffect(() => {
        if (!active) {
            setShowKatePulse(false);
            return;
        }
        /* Pulse both avatars immediately on entry */
        const t = setTimeout(() => setShowKatePulse(true), 300);
        return () => clearTimeout(t);
    }, [active]);

    return (
        <div className="act-active-mock">

            {/* Header shown immediately at top of scene */}
            <div className="act-s13-header">
                <p className="act-active-blur-header-text">
                    Everyone will check their phones, find their person, and start chatting!
                    <span className="act-blur-conf-burst">
                        <span className="act-bconf act-bconf-1" />
                        <span className="act-bconf act-bconf-2" />
                        <span className="act-bconf act-bconf-3" />
                        <span className="act-bconf act-bconf-4" />
                        <span className="act-bconf act-bconf-5" />
                        <span className="act-bconf act-bconf-6" />
                        <span className="act-bconf act-bconf-7" />
                        <span className="act-bconf act-bconf-8" />
                    </span>
                </p>
            </div>

            {/* Paired Players section */}
            <div className="act-section-header">
                Paired Players: <span className="act-section-header-count">65</span>
            </div>
            <div className="act-player-grid">
                {MOCK_PAIRS.map(({ p1, p2 }, idx) => (
                    <div key={idx} className="act-paired-player-card">
                        <div className="act-matched-pair-badge">Matched</div>
                        <div className="act-paired-players-row">
                            <div className="act-paired-player-col">
                                {/* Kate's avatar — pulse ring on first card */}
                                <div className={`act-avatar-pulse-wrap${idx === 0 && showKatePulse ? ' act-avatar-pulsing' : ''}`}>
                                    <img src={p1.src} alt={p1.name} className="act-paired-avatar" />
                                    {idx === 0 && showKatePulse && (
                                        <>
                                            <span className="act-avatar-ring act-avatar-ring-1" />
                                            <span className="act-avatar-ring act-avatar-ring-2" />
                                        </>
                                    )}
                                </div>
                                <span className="act-paired-name">{p1.name}</span>
                                {tag1 && (
                                    <div className="act-matched-player-tag">
                                        <span className="act-matching-tag-pill">{tag1}</span>
                                    </div>
                                )}
                            </div>
                            <div className="act-paired-player-col">
                                {/* Tony's avatar — same pulse ring on first card */}
                                <div className={`act-avatar-pulse-wrap${idx === 0 && showKatePulse ? ' act-avatar-pulsing' : ''}`}>
                                    <img src={p2.src} alt={p2.name} className="act-paired-avatar" />
                                    {idx === 0 && showKatePulse && (
                                        <>
                                            <span className="act-avatar-ring act-avatar-ring-1" />
                                            <span className="act-avatar-ring act-avatar-ring-2" />
                                        </>
                                    )}
                                </div>
                                <span className="act-paired-name">{p2.name}</span>
                                {tag2 && (
                                    <div className="act-matched-player-tag">
                                        <span className="act-matching-tag-pill">{tag2}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* Scene 14: Kate's profile icon zooms to fill the screen */
const MockProfileZoom = ({ zoomed }) => (
    <div className="act-profile-zoom-wrapper">
        <img
            src="/assets/kate_rodriguez.png"
            alt="Kate Rodriguez"
            className={`act-profile-zoom-img${zoomed ? ' act-profile-zoom-in' : ''}`}
        />
    </div>
);

/* Helper: title-case a tag string */
const titleCase = str => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

/* Kate's lobby view — Go find Tony! — layout matches real lobby.jsx paired state */
const MockLobbyView = ({ active, customTags, hasTags, showTableNumbers }) => {
    const [showCard, setShowCard] = useState(false);

    const tag1 = hasTags && customTags && customTags[0] ? customTags[0] : null;
    const tag2 = hasTags && customTags && customTags[1] ? customTags[1] : null;

    useEffect(() => {
        if (!active) { setShowCard(false); return; }
        const t = setTimeout(() => setShowCard(true), 200);
        return () => clearTimeout(t);
    }, [active]);

    return (
        <div className="act-lobby-mock">

            {/* "Go find!" header */}
            <h2 className="act-lobby-header">
                <span className="act-lobby-pop-burst">
                    Go find Tony Chopper!
                </span>
            </h2>

            {/* Table number — only if enabled */}
            {showTableNumbers && (
                <div className="act-table-number">
                    <h3 style={{ color: '#4b73ef' }}>at table: 5</h3>
                </div>
            )}

            {/* Timer — 5x speed: duration and initialRemainingTime scaled ÷5,
                display multiplied ×5 so numbers show real-world values */}
            <div className="act-lobby-timer-wrap">
                <CountdownCircleTimer
                    isPlaying={active}
                    duration={96}
                    initialRemainingTime={81}
                    colors={['#64B5F6', '#2196F3', '#1976D2']}
                    colorsTime={[96, 48, 0]}
                    size={100}
                    strokeWidth={8}
                    trailColor="#f0f1f4"
                    strokeLinecap="round"
                >
                    {({ remainingTime }) => {
                        const real = Math.round((typeof remainingTime === 'number' ? remainingTime : 81) * 5);
                        const mins = Math.floor(real / 60);
                        const secs = real % 60;
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.35rem', color: '#1a1a2e', fontWeight: 700, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>{mins}:{String(secs).padStart(2, '0')}</span>
                                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>time left</span>
                            </div>
                        );
                    }}
                </CountdownCircleTimer>
            </div>

            {/* Bidirectional match banner — shown when tags exist */}
            {tag1 && tag2 && (
                <div className="act-match-banner">
                    <span className="act-match-tag">
                        <span className="act-match-tag-text">{titleCase(tag1)}</span>
                    </span>
                    <div className="act-match-arrow" />
                    <span className="act-match-tag">
                        <span className="act-match-tag-text">{titleCase(tag2)}</span>
                    </span>
                </div>
            )}

            {/* PlayerCard */}
            {showCard && (
                <div className="act-lobby-player-card-wrap">
                    <img src="/assets/tony_chopper.jpg" alt="Tony Chopper" className="act-lobby-player-photo" />
                    <div className="act-lobby-player-name-badge">Tony Chopper</div>
                </div>
            )}
        </div>
    );
};

/* Tony's lobby view — Go find Kate! — mirror of MockLobbyView from Tony's perspective */
const MockTonyLobbyView = ({ active, customTags, hasTags, showTableNumbers }) => {
    const [showCard, setShowCard] = useState(false);

    const tag1 = hasTags && customTags && customTags[0] ? customTags[0] : null;
    const tag2 = hasTags && customTags && customTags[1] ? customTags[1] : null;

    useEffect(() => {
        if (!active) { setShowCard(false); return; }
        const t = setTimeout(() => setShowCard(true), 200);
        return () => clearTimeout(t);
    }, [active]);

    return (
        <div className="act-lobby-mock">

            {/* "Go find!" header */}
            <h2 className="act-lobby-header">
                <span className="act-lobby-pop-burst">
                    Go find Kate Rodriguez!
                </span>
            </h2>

            {/* Table number — only if enabled */}
            {showTableNumbers && (
                <div className="act-table-number">
                    <h3 style={{ color: '#4b73ef' }}>at table: 5</h3>
                </div>
            )}

            {/* Timer — continues from where Kate's scene ended.
                Kate ran 4500ms at 5x = 22.5s simulated. 405 − 22.5 = 382.5s real → ÷5 = 76.5 scaled */}
            <div className="act-lobby-timer-wrap">
                <CountdownCircleTimer
                    isPlaying={active}
                    duration={96}
                    initialRemainingTime={76.5}
                    colors={['#64B5F6', '#2196F3', '#1976D2']}
                    colorsTime={[96, 48, 0]}
                    size={100}
                    strokeWidth={8}
                    trailColor="#f0f1f4"
                    strokeLinecap="round"
                >
                    {({ remainingTime }) => {
                        const real = Math.round((typeof remainingTime === 'number' ? remainingTime : 76.5) * 5);
                        const mins = Math.floor(real / 60);
                        const secs = real % 60;
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.35rem', color: '#1a1a2e', fontWeight: 700, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>{mins}:{String(secs).padStart(2, '0')}</span>
                                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>time left</span>
                            </div>
                        );
                    }}
                </CountdownCircleTimer>
            </div>

            {/* Bidirectional match banner */}
            {tag1 && tag2 && (
                <div className="act-match-banner">
                    <span className="act-match-tag">
                        <span className="act-match-tag-text">{titleCase(tag2)}</span>
                    </span>
                    <div className="act-match-arrow" />
                    <span className="act-match-tag">
                        <span className="act-match-tag-text">{titleCase(tag1)}</span>
                    </span>
                </div>
            )}

            {/* PlayerCard — Kate */}
            {showCard && (
                <div className="act-lobby-player-card-wrap">
                    <img src="/assets/kate_rodriguez.png" alt="Kate Rodriguez" className="act-lobby-player-photo" />
                    <div className="act-lobby-player-name-badge">Kate Rodriguez</div>
                </div>
            )}
        </div>
    );
};

/* ── Scene 16: Video ending with two header messages ───────────────────── */

const ENDING_HEADERS = [
    'Turn your event into a connection engine',
    'No app, just a QR code and passion for conversation',
];

const MockVideoEnding = ({ active }) => {
    const [phase, setPhase] = useState(0);
    // phases: 0=idle, 1=h1 in, 2=h1 out, 3=h2 in

    useEffect(() => {
        if (!active) { setPhase(0); return; }
        const timers = [
            setTimeout(() => setPhase(1), 100),
            setTimeout(() => setPhase(2), 2300),
            setTimeout(() => setPhase(3), 2700),
        ];
        return () => timers.forEach(clearTimeout);
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="act-video-ending">
            <video className="act-video-ending-bg" autoPlay muted playsInline>
                <source src="/assets/demo_app_home_video_X2_small.mp4" type="video/mp4" />
            </video>
            <div className="act-video-ending-scrim" />
            {(phase === 1 || phase === 2) && (
                <p className={`act-video-header${phase === 2 ? ' act-video-header-out' : ' act-video-header-in'}`}>
                    {ENDING_HEADERS[0]}
                </p>
            )}
            {phase === 3 && (
                <p className="act-video-header act-video-header-in">
                    {ENDING_HEADERS[1]}
                </p>
            )}
        </div>
    );
};

/* ── Main component ─────────────────────────────────────────────────────── */

const AdminCheckinTutorialFull = ({ isVisible, onComplete, customTags, showTableNumbers, stopAfterReady = false, startFromScene = 3, stopBeforeEnd = false, showSkip = false }) => {
    const [scene, setScene] = useState(startFromScene);
    const [fadingOut, setFadingOut] = useState(false);
    const [showReady, setShowReady] = useState(false);
    const [showAdminPulse, setShowAdminPulse] = useState(false);
    const [showAdminPress, setShowAdminPress] = useState(false);
    const [cardZoomed, setCardZoomed] = useState(false);
    const [showCmef, setShowCmef] = useState(false);
    const [showEndPulse, setShowEndPulse] = useState(false);
    const [showEndPress, setShowEndPress] = useState(false);

    /* Stable callback so CMEF's isVisible effect never re-runs due to a new
       function reference produced by AdminLobbyView's 1-second polling re-renders. */
    const handleCmefComplete = useCallback(() => {
        setShowCmef(false);
        if (stopBeforeEnd) {
            setScene(99);
            setFadingOut(true);
            setTimeout(() => onComplete?.(), 400);
        } else {
            setScene(17);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* One-time shuffle of tags — computed when tutorial becomes visible */
    const tagSplitRef = useRef(null);
    const hasTags = Array.isArray(customTags) && customTags.length >= 2;

    useEffect(() => {
        if (isVisible && hasTags && !tagSplitRef.current) {
            tagSplitRef.current = splitTags(shuffleArray(customTags));
        }
        if (!isVisible) {
            tagSplitRef.current = null;
        }
    }, [isVisible, hasTags]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Reset state when tutorial is hidden */
    useEffect(() => {
        if (!isVisible) {
            setScene(startFromScene);
            setFadingOut(false);
            setShowReady(false);
            setShowAdminPulse(false);
            setShowAdminPress(false);
            setCardZoomed(false);
            setShowCmef(false);
            setShowEndPulse(false);
            setShowEndPress(false);
        }
    }, [isVisible]);

    /* Scene 3 → 4: auto-advance after 4.5s on scene 3 */
    useEffect(() => {
        if (scene !== 3) return;
        const t = setTimeout(() => setScene(4), 4500);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 4 → 5: after phone zoom completes */
    useEffect(() => {
        if (scene !== 4) return;
        const t = setTimeout(() => setScene(5), 3600);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 5 → 6 */
    useEffect(() => {
        if (scene !== 5) return;
        const t = setTimeout(() => setScene(6), 3200);
        return () => clearTimeout(t);
    }, [scene]);

    /* After "You're ready!" ends → continue to admin-start scenes, or close if stopAfterReady */
    const handleAfterReady = () => {
        if (stopAfterReady) {
            /* Don't setShowReady(false) — UserIsReadyAnimation is already running its own
               Framer exit internally. Let both it and the act-overlay fade simultaneously. */
            setScene(99);
            setFadingOut(true);
            setTimeout(() => onComplete?.(), 400);
        } else {
            setShowReady(false);
            setScene(11);
        }
    };

    /* After scene 17 → actually close the tutorial */
    const handleFinalComplete = () => {
        setFadingOut(true);
        setTimeout(() => onComplete?.(), 400);
    };

    /* Scene 7 → 8: volume slide auto-advances after 4000ms (both branches) */
    useEffect(() => {
        if (scene !== 7) return;
        const t = setTimeout(() => setScene(8), 4000);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 8 end: pause slide auto-advances after 3500ms.
       no-tags  → trigger You're Ready directly
       has-tags → advance to tag selection (scene 9) */
    useEffect(() => {
        if (scene !== 8) return;
        const t = setTimeout(() => {
            if (hasTags) setScene(9);
            else setShowReady(true);
        }, 3500);
        return () => clearTimeout(t);
    }, [scene, hasTags]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Scene 6 advances to 7 regardless — tags branch shows tag selection,
       no-tags branch shows the how-to slides (volume + pause) */
    const handleAfterPhoto = () => {
        setScene(7);
    };

    /* Scene 11: CTA pulse → press → advance to interrim */
    useEffect(() => {
        if (scene !== 11) return;
        setShowAdminPulse(false);
        setShowAdminPress(false);
        const timers = [
            setTimeout(() => setShowAdminPulse(true), 1200),
            setTimeout(() => setShowAdminPress(true), 2500),
            setTimeout(() => setScene(12), 4000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [scene]);

    /* Scene 12 → 13 */
    useEffect(() => {
        if (scene !== 12) return;
        const t = setTimeout(() => setScene(13), 1600);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 13 → 14 */
    useEffect(() => {
        if (scene !== 13) return;
        const t = setTimeout(() => setScene(14), 3500);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 14: zoom Kate's profile photo → advance to lobby view */
    useEffect(() => {
        if (scene !== 14) return;
        setCardZoomed(false);
        const timers = [
            setTimeout(() => setCardZoomed(true), 100),
            setTimeout(() => setScene(15), 1300),
        ];
        return () => timers.forEach(clearTimeout);
    }, [scene]);

    /* Scene 15 → 16 (Tony's lobby view) */
    useEffect(() => {
        if (scene !== 15) return;
        const t = setTimeout(() => setScene(16), 4500);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 16 → CMEF section → 17 (video ending) */
    useEffect(() => {
        if (scene !== 16) return;
        const t = setTimeout(() => setShowCmef(true), 4500);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 17: End lobby — CTA pulse → press → advance to video */
    useEffect(() => {
        if (scene !== 17) return;
        setShowEndPulse(false);
        setShowEndPress(false);
        const timers = [
            setTimeout(() => setShowEndPulse(true), 1200),
            setTimeout(() => setShowEndPress(true), 2500),
            setTimeout(() => setScene(18), 4000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [scene]);

    /* Scene 18 → final complete (6500ms covers both video headers + breathing room) */
    useEffect(() => {
        if (scene !== 18) return;
        const t = setTimeout(() => handleFinalComplete(), 6500);
        return () => clearTimeout(t);
    }, [scene]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isVisible) return null;

    const s = scene;
    const split = tagSplitRef.current;

    return (
        <>
        <div className={`act-overlay${fadingOut ? ' act-overlay-exit' : ''}${s >= 4 ? ' act-overlay-white' : ''}`} style={s === 18 ? { zIndex: 10002 } : undefined}>

            {/* ── Scene 3: Opening scene ── */}
            <div className={`act-scene${s === 3 ? ' act-scene-active' : ''}`}>
                {s >= 3 && (
                    <>
                        <div className="act-header-area" style={{ marginTop: '36px' }}>
                            <p className="act-header-text act-single-header">
                                After scanning, tell them one thing: &ldquo;Listen to the app&rsquo;s instructions&rdquo;
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
                        </div>
                    </>
                )}
            </div>

            {/* ── Scene 4: Phone zoom → white ── */}
            <div className={`act-scene act-scene-zoom${s === 4 ? ' act-scene-active' : ''}`}>
                {s >= 4 && (
                    <>
                        <PhoneZoom />
                        <p className="act-how-people-join">How Attendees Join!</p>
                    </>
                )}
            </div>

            {/* ── Scene 5: Mock signup – name ── */}
            <div className={`act-scene act-scene-mock${s === 5 ? ' act-scene-active' : ''}`}>
                {s >= 5 && <MockNameStep active={s === 5} />}
            </div>

            {/* ── Scene 6: Mock signup – photo ── */}
            <div className={`act-scene act-scene-mock${s === 6 ? ' act-scene-active' : ''}`}>
                {s >= 6 && <MockPhotoStep active={s === 6} onDone={handleAfterPhoto} />}
            </div>

            {/* ── Scene 7: Volume slide (both branches) ── */}
            <div className={`act-scene act-scene-mock act-howto-scene${s === 7 ? ' act-scene-active' : ''}`}>
                {s >= 7 && (
                    <div className="tutorial-container act-howto-container">
                        <div className="tutorial-slide current">
                            <TutorialSlide2 isActive={s === 7} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Scene 8: Pause slide (both branches) ── */}
            <div className={`act-scene act-scene-mock act-howto-scene${s === 8 ? ' act-scene-active' : ''}`}>
                {s >= 8 && (
                    <div className="tutorial-container act-howto-container">
                        <div className="tutorial-slide current">
                            <TutorialSlide3 isActive={s === 8} onPauseClicked={null} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Tag sequence persistent header (scenes 9–10) ── */}
            {hasTags && (s === 9 || s === 10) && (
                <p className="act-tag-sequence-header">
                    Pair people by matching interests or roles
                </p>
            )}

            {/* ── Scene 9: Tag selection – Who are you? (tags branch only) ── */}
            {hasTags && (
                <div className={`act-scene act-scene-mock act-scene-tag${s === 9 ? ' act-scene-active' : ''}`}>
                    {s >= 9 && split && (
                        <MockTagStep
                            active={s === 9}
                            phase="self"
                            allTags={customTags}
                            autoSelected={split.selfTags}
                            selfComplete={false}
                            onDone={() => setScene(10)}
                        />
                    )}
                </div>
            )}

            {/* ── Scene 10: Tag selection – Who do you want to meet? (tags branch only) ── */}
            {hasTags && (
                <div className={`act-scene act-scene-mock act-scene-tag${s === 10 ? ' act-scene-active' : ''}`}>
                    {s >= 10 && split && (
                        <MockTagStep
                            active={s === 10}
                            phase="desiring"
                            allTags={customTags}
                            autoSelected={split.desiringTags}
                            selfComplete={true}
                            onDone={() => setShowReady(true)}
                        />
                    )}
                </div>
            )}

            {/* ── Scene 11: Isolated Start button with CTA pulse ── */}
            <div className={`act-scene act-scene-mock${s === 11 ? ' act-scene-active' : ''}`}>
                {s >= 11 && (
                    <>
                        <p className="act-admin-scene-header-text">
                            Click Start after a few people have joined!
                        </p>
                        <MockAdminStart showPulse={showAdminPulse} showPress={showAdminPress} />
                    </>
                )}
            </div>

            {/* ── Scene 12: Creating Pairs… interrim ── */}
            <div className={`act-scene act-scene-mock${s === 12 ? ' act-scene-active' : ''}`}>
                {s >= 12 && (
                    <>
                        <p className="act-admin-scene-header-text">
                            Click Start after a few people have joined!
                        </p>
                        <MockInterrimBar />
                    </>
                )}
            </div>

            {/* ── Scene 13: Active state — profiles + centered timer ── */}
            <div className={`act-scene act-scene-mock${s === 13 ? ' act-scene-active' : ''}`}>
                {s >= 13 && <MockActiveState customTags={customTags} active={s === 13} />}
            </div>

            {/* ── Scene 14: Zoom into Kate's profile photo ── */}
            <div className={`act-scene act-scene-mock act-scene-profile-zoom${s === 14 ? ' act-scene-active' : ''}`}>
                {s >= 14 && <MockProfileZoom zoomed={cardZoomed} />}
            </div>

            {/* ── Scene 15: Kate's lobby view ── */}
            <div className={`act-scene act-scene-mock${s === 15 ? ' act-scene-active' : ''}`}>
                {s >= 15 && (
                    <MockLobbyView
                        active={s === 15}
                        customTags={customTags}
                        hasTags={hasTags}
                        showTableNumbers={showTableNumbers}
                    />
                )}
            </div>

            {/* ── Scene 16: Tony's lobby view ── */}
            <div className={`act-scene act-scene-mock${s === 16 ? ' act-scene-active' : ''}`}>
                {s >= 16 && (
                    <MockTonyLobbyView
                        active={s === 16 && !showCmef}
                        customTags={customTags}
                        hasTags={hasTags}
                        showTableNumbers={showTableNumbers}
                    />
                )}
            </div>

            {/* ── Scene 17: End lobby ── */}
            <div className={`act-scene act-scene-mock${s === 17 ? ' act-scene-active' : ''}`}>
                {s >= 17 && (
                    <>
                        <p className="act-admin-scene-header-text">
                            When you&rsquo;re done, click End to close the lobby!
                        </p>
                        <MockAdminEnd showPulse={showEndPulse} showPress={showEndPress} />
                    </>
                )}
            </div>

            {/* ── Scene 18: Video ending ── */}
            <div className={`act-scene act-scene-video${s === 18 ? ' act-scene-active' : ''}`}>
                {s >= 18 && <MockVideoEnding active={s === 18} />}
            </div>

        </div>

        {/* ── CMEF section: 2nd + 3rd reshuffle → engagement header ── */}
        {showCmef && (
            <CoolerGeneralMatchEventFlow
                isVisible={showCmef}
                variant="compact"
                startScene={22}
                stopAfterScene={26}
                embedded
                hideSkip
                onComplete={handleCmefComplete}
            />
        )}

        {/* ── "You're ready!" animation — plays after Save in scene 8/10 ── */}
        <UserIsReadyAnimation
            isVisible={showReady}
            onAnimationEnd={handleAfterReady}
            mainText="You're ready!"
            subText="You will be paired up soon."
        />

        {/* ── Skip button — contextual chunks only ── */}
        {showSkip && !fadingOut && (
            <button className="act-skip-btn" onClick={handleFinalComplete}>
                Skip
            </button>
        )}
        </>
    );
};

export default AdminCheckinTutorialFull;
