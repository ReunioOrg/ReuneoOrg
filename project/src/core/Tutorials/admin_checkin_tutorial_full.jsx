import React, { useState, useEffect, useRef } from 'react';
import './admin_checkin_tutorial_full.css';
import '../lobby/how_to_tutorial.css';
import UserIsReadyAnimation from '../lobby/user_is_ready_animation';
import { TutorialSlide2, TutorialSlide3 } from '../lobby/how_to_tutorial';

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

            {showFlash && <div className="act-camera-flash" />}

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

/* ── Scenes 7 & 8: Mock tag selection ───────────────────────────────────── */

/* Reusable component for both self and desiring phases */
const MockTagStep = ({ active, phase, allTags, autoSelected, selfComplete, onDone }) => {
    const [selectedTags, setSelectedTags] = useState([]);
    const [showBtn, setShowBtn] = useState(false);
    const [pressBtn, setPressBtn] = useState(false);

    const isSelf = phase === 'self';
    const btnLabel = isSelf ? 'Continue' : 'Save';

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
            <div className="act-tag-list">
                {allTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                        <div
                            key={tag}
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

/* ── Main component ─────────────────────────────────────────────────────── */

const AdminCheckinTutorialFull = ({ isVisible, onComplete, customTags }) => {
    const [scene, setScene] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);
    const [showReady, setShowReady] = useState(false);

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

    /* Scenes 0-3: auto-advancing timers */
    useEffect(() => {
        if (!isVisible) {
            setScene(0);
            setFadingOut(false);
            setShowReady(false);
            return;
        }

        const timers = [
            setTimeout(() => setScene(1), 3000),
            setTimeout(() => setScene(2), 6000),
            setTimeout(() => setScene(3), 9500),
        ];
        return () => timers.forEach(clearTimeout);
    }, [isVisible]);

    /* Scene 4 → 5: after phone zoom completes */
    useEffect(() => {
        if (scene !== 4) return;
        const t = setTimeout(() => setScene(5), 1400);
        return () => clearTimeout(t);
    }, [scene]);

    /* Scene 5 → 6 */
    useEffect(() => {
        if (scene !== 5) return;
        const t = setTimeout(() => setScene(6), 3200);
        return () => clearTimeout(t);
    }, [scene]);

    const handleComplete = () => {
        setFadingOut(true);
        setTimeout(() => onComplete?.(), 400);
    };

    /* Scene 7 → 8 (no-tags branch: volume slide auto-advances after 4000ms) */
    useEffect(() => {
        if (scene !== 7 || hasTags) return;
        const t = setTimeout(() => setScene(8), 4000);
        return () => clearTimeout(t);
    }, [scene, hasTags]);

    /* Scene 8 → complete (no-tags branch: pause slide auto-advances after 5000ms) */
    useEffect(() => {
        if (scene !== 8 || hasTags) return;
        const t = setTimeout(handleComplete, 5000);
        return () => clearTimeout(t);
    }, [scene, hasTags]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Scene 6 advances to 7 regardless — tags branch shows tag selection,
       no-tags branch shows the how-to slides (volume + pause) */
    const handleAfterPhoto = () => {
        setScene(7);
    };

    if (!isVisible) return null;

    const s = scene;
    const split = tagSplitRef.current;

    return (
        <>
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
                {s >= 6 && <MockPhotoStep active={s === 6} onDone={handleAfterPhoto} />}
            </div>

            {/* ── Scene 7: Tag selection – Who are you? ── */}
            {hasTags && (
                <div className={`act-scene act-scene-mock${s === 7 ? ' act-scene-active' : ''}`}>
                    {s >= 7 && split && (
                        <MockTagStep
                            active={s === 7}
                            phase="self"
                            allTags={customTags}
                            autoSelected={split.selfTags}
                            selfComplete={false}
                            onDone={() => setScene(8)}
                        />
                    )}
                </div>
            )}

            {/* ── Scene 8: Tag selection – Who do you want to meet? ── */}
            {hasTags && (
                <div className={`act-scene act-scene-mock${s === 8 ? ' act-scene-active' : ''}`}>
                    {s >= 8 && split && (
                        <MockTagStep
                            active={s === 8}
                            phase="desiring"
                            allTags={customTags}
                            autoSelected={split.desiringTags}
                            selfComplete={true}
                            onDone={() => setShowReady(true)}
                        />
                    )}
                </div>
            )}

            {/* ── Scene 7 (no-tags): Volume slide ── */}
            {!hasTags && (
                <div className={`act-scene act-scene-mock act-howto-scene${s === 7 ? ' act-scene-active' : ''}`}>
                    {s >= 7 && (
                        <div className="tutorial-container act-howto-container">
                            <div className="tutorial-slide current">
                                <TutorialSlide2 isActive={s === 7} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Scene 8 (no-tags): Pause slide ── */}
            {!hasTags && (
                <div className={`act-scene act-scene-mock act-howto-scene${s === 8 ? ' act-scene-active' : ''}`}>
                    {s >= 8 && (
                        <div className="tutorial-container act-howto-container">
                            <div className="tutorial-slide current">
                                <TutorialSlide3 isActive={s === 8} onPauseClicked={null} />
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>

        {/* ── "You're ready!" animation — plays after Save in scene 8 ── */}
        <UserIsReadyAnimation
            isVisible={showReady}
            onAnimationEnd={handleComplete}
            mainText="You're ready!"
            subText="You will be paired up soon."
        />
        </>
    );
};

export default AdminCheckinTutorialFull;
