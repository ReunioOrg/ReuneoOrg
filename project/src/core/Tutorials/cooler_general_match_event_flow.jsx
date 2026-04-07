import React, { useState, useEffect, useCallback, useRef } from 'react';
import './cooler_general_match_event_flow.css';

const SCENES = [
    // Act 1: Entrance
    { id: 'enter', duration: 1500 },           // 0
    { id: 'header-in', duration: 1650 },       // 1
    // Act 2: Zoom + match reveal
    { id: 'zoom-in', duration: 1050 },         // 2
    { id: 'phone-kate', duration: 900 },       // 3
    { id: 'find-kate', duration: 1650 },       // 4
    { id: 'swap-out', duration: 600 },         // 5
    { id: 'phone-tony', duration: 900 },       // 6
    { id: 'find-tony', duration: 1650 },       // 7
    { id: 'zoom-out', duration: 1050 },        // 8
    // Act 3: Phone convergence + greetings
    { id: 'phones-big', duration: 1100 },      // 9
    { id: 'phones-shrink', duration: 900 },    // 10
    { id: 'phones-slide', duration: 900 },     // 11
    { id: 'greet-left', duration: 900 },       // 12
    { id: 'greet-right', duration: 1100 },     // 13
    // Act 4: Transition + Event Space
    { id: 'act4-clear', duration: 1100 },      // 14
    { id: 'event-header', duration: 1900 },    // 15
    // Act 5: Circle entry + mixing
    { id: 'first-arrive', duration: 1100 },    // 16
    { id: 'crowd-fill', duration: 950 },       // 17
    { id: 'settle-pairs', duration: 1500 },    // 18
    // Act 6: Phone reveals + conversation
    { id: 'phones-reveal', duration: 1200 },   // 19
    { id: 'convo-overlay', duration: 2800 },   // 20
    { id: 'convo-clear', duration: 1100 },     // 21
    // Act 7: Reshuffles
    { id: 'reshuffle-1', duration: 1000 },     // 22
    { id: 'show-round2', duration: 1900 },     // 23
    { id: 'reshuffle-2', duration: 1000 },     // 24
    { id: 'show-round3', duration: 3400 },     // 25
    // Act 8: Closing
    { id: 'final-fade', duration: 1100 },      // 26
    { id: 'lets-go', duration: 1900 },         // 27
];

const PersonIcon = ({ color = '#3b82f6' }) => (
    <svg viewBox="0 0 32 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="10" r="9" fill={color} />
        <rect x="5" y="26" width="22" height="48" rx="11" fill={color} />
    </svg>
);

const PhoneFrame = ({ imageSrc, className, style }) => (
    <div className={`cmef-phone ${className || ''}`} style={style}>
        <div className="cmef-phone-speaker" />
        <div className="cmef-phone-screen">
            <img src={imageSrc} alt="" className="cmef-phone-photo" />
        </div>
        <div className="cmef-phone-home" />
    </div>
);

const PAIR_GAP = 6;

const PAIR_SET_A = [
    { x: 22, y: 22 }, { x: 48, y: 18 }, { x: 70, y: 28 }, { x: 12, y: 46 },
    { x: 42, y: 46 }, { x: 68, y: 52 }, { x: 22, y: 70 }, { x: 48, y: 78 },
];
const PAIR_SET_B = [
    { x: 30, y: 20 }, { x: 60, y: 22 }, { x: 18, y: 38 }, { x: 48, y: 35 },
    { x: 72, y: 42 }, { x: 28, y: 58 }, { x: 55, y: 62 }, { x: 40, y: 78 },
];
const PAIR_SET_C = [
    { x: 38, y: 18 }, { x: 15, y: 30 }, { x: 62, y: 30 }, { x: 35, y: 42 },
    { x: 65, y: 48 }, { x: 20, y: 62 }, { x: 50, y: 60 }, { x: 38, y: 78 },
];

const MIX_SETS = [
    [
        {x:35,y:20},{x:62,y:25},{x:18,y:38},{x:48,y:32},
        {x:72,y:42},{x:28,y:52},{x:58,y:48},{x:42,y:62},
        {x:68,y:58},{x:22,y:68},{x:52,y:72},{x:32,y:42},
        {x:72,y:32},{x:45,y:75},{x:62,y:65},{x:38,y:55},
    ],
    [
        {x:45,y:25},{x:70,y:35},{x:25,y:30},{x:55,y:42},
        {x:65,y:55},{x:35,y:45},{x:48,y:58},{x:28,y:65},
        {x:72,y:48},{x:18,y:50},{x:42,y:70},{x:58,y:28},
        {x:30,y:35},{x:52,y:52},{x:68,y:68},{x:22,y:42},
    ],
    [
        {x:55,y:22},{x:30,y:28},{x:68,y:38},{x:40,y:35},
        {x:20,y:48},{x:58,y:52},{x:35,y:60},{x:72,y:45},
        {x:48,y:68},{x:25,y:55},{x:65,y:62},{x:42,y:28},
        {x:15,y:38},{x:55,y:75},{x:32,y:72},{x:62,y:42},
    ],
];

const PAIR_REVEAL_ORDER = [1, 0, 4, 3, 6, 7, 5, 2];

const CONVO_TEXTS = [
    { text: 'What do you do?', x: 48, y: 12 },
    { text: 'This is so fun!', x: 18, y: 25 },
    { text: 'Hi!', x: 12, y: 50 },
    { text: 'Nice to meet you!', x: 18, y: 74 },
    { text: 'How is your day so far?', x: 42, y: 88 },
    { text: "I'm meeting so many people!", x: 71, y: 65 },
    { text: 'Its fun getting paired up!', x: 71, y: 26 },
];

function pairSetToCircles(pairSet) {
    const result = [];
    pairSet.forEach((pair, i) => {
        result.push({ id: i * 2, x: pair.x, y: pair.y });
        result.push({ id: i * 2 + 1, x: pair.x + PAIR_GAP, y: pair.y });
    });
    return result;
}

const CoolerGeneralMatchEventFlow = ({ isVisible, onComplete }) => {
    const [currentScene, setCurrentScene] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);
    const [circles, setCircles] = useState([]);
    const [phoneRevealCount, setPhoneRevealCount] = useState(0);
    const [convoRevealCount, setConvoRevealCount] = useState(0);
    const [headerPhase, setHeaderPhase] = useState(-1);
    const [round3HeaderReady, setRound3HeaderReady] = useState(false);
    const headerTimersRef = useRef([]);

    const finishTutorial = useCallback(() => {
        setFadingOut(true);
        setTimeout(() => {
            onComplete?.();
        }, 600);
    }, [onComplete]);

    useEffect(() => {
        if (!isVisible) {
            setCurrentScene(0);
            setFadingOut(false);
            setCircles([]);
            setPhoneRevealCount(0);
            setConvoRevealCount(0);
            setHeaderPhase(-1);
            setRound3HeaderReady(false);
            headerTimersRef.current.forEach(clearTimeout);
            headerTimersRef.current = [];
            return;
        }

        let elapsed = 0;
        const timers = [];

        SCENES.forEach((scene, index) => {
            if (index > 0) {
                const timer = setTimeout(() => setCurrentScene(index), elapsed);
                timers.push(timer);
            }
            elapsed += scene.duration;
        });

        const endTimer = setTimeout(() => finishTutorial(), elapsed);
        timers.push(endTimer);

        return () => timers.forEach(clearTimeout);
    }, [isVisible, finishTutorial]);

    useEffect(() => {
        const timers = [];

        if (currentScene === 15) {
            headerTimersRef.current.forEach(clearTimeout);
            setHeaderPhase(0);
            headerTimersRef.current = [
                setTimeout(() => setHeaderPhase(1), 500),
                setTimeout(() => setHeaderPhase(2), 2200),
                setTimeout(() => setHeaderPhase(3), 2700),
                setTimeout(() => setHeaderPhase(4), 5800),
            ];
        } else if (currentScene === 16) {
            setCircles([
                { id: 0, x: 100, y: 48 },
                { id: 1, x: 106, y: 48 },
            ]);
            timers.push(setTimeout(() => {
                setCircles([
                    { id: 0, x: 63, y: 48 },
                    { id: 1, x: 69, y: 48 },
                ]);
            }, 50));
        } else if (currentScene === 17) {
            setCircles(prev => [
                ...prev.map((c, i) => ({
                    ...c, x: MIX_SETS[0][i].x, y: MIX_SETS[0][i].y,
                })),
                { id: 2, x: 100, y: 48 },
                { id: 3, x: 106, y: 48 },
            ]);
            for (let p = 2; p <= 7; p++) {
                const t = (p - 1) * 120;
                timers.push(setTimeout(() => {
                    setCircles(prev => [
                        ...prev,
                        { id: p * 2, x: 100, y: 48 },
                        { id: p * 2 + 1, x: 106, y: 48 },
                    ]);
                }, t));
                timers.push(setTimeout(() => {
                    const mix = MIX_SETS[p % MIX_SETS.length];
                    setCircles(prev => prev.map((c, i) => ({
                        ...c, x: mix[i]?.x ?? c.x, y: mix[i]?.y ?? c.y,
                    })));
                }, t + 60));
            }
        } else if (currentScene === 18) {
            setCircles(pairSetToCircles(PAIR_SET_A));
        } else if (currentScene === 19) {
            for (let i = 0; i < 8; i++) {
                timers.push(setTimeout(() => setPhoneRevealCount(i + 1), i * 140));
            }
        } else if (currentScene === 20) {
            for (let i = 0; i < 7; i++) {
                timers.push(setTimeout(() => setConvoRevealCount(i + 1), i * 180));
            }
        } else if (currentScene === 21) {
            setConvoRevealCount(0);
        } else if (currentScene === 22) {
            setPhoneRevealCount(0);
            for (let t = 0; t < 3; t++) {
                timers.push(setTimeout(() => {
                    const mix = MIX_SETS[t % MIX_SETS.length];
                    setCircles(prev => prev.map((c, i) => ({
                        ...c, x: mix[i]?.x ?? c.x, y: mix[i]?.y ?? c.y,
                    })));
                }, t * 230));
            }
            timers.push(setTimeout(() => setCircles(pairSetToCircles(PAIR_SET_B)), 750));
        } else if (currentScene === 23) {
            setPhoneRevealCount(8);
        } else if (currentScene === 24) {
            setPhoneRevealCount(0);
            for (let t = 0; t < 3; t++) {
                timers.push(setTimeout(() => {
                    const mix = MIX_SETS[(t + 1) % MIX_SETS.length];
                    setCircles(prev => prev.map((c, i) => ({
                        ...c, x: mix[i]?.x ?? c.x, y: mix[i]?.y ?? c.y,
                    })));
                }, t * 230));
            }
            timers.push(setTimeout(() => setCircles(pairSetToCircles(PAIR_SET_C)), 750));
        } else if (currentScene === 25) {
            setPhoneRevealCount(8);
            setRound3HeaderReady(false);
            timers.push(setTimeout(() => setRound3HeaderReady(true), 250));
        } else if (currentScene === 26) {
            setPhoneRevealCount(0);
        }

        return () => timers.forEach(clearTimeout);
    }, [currentScene]);

    if (!isVisible) return null;

    const s = currentScene;

    const headerText = (s >= 1 && s <= 2)
        ? 'These are two people at your event'
        : null;
    const headerFading = s >= 2;

    const hasEntered = s >= 2;
    const isZoomed = s >= 2 && s <= 7;

    const showCloseup = s >= 2 && s <= 8;
    const closeupVisible = s >= 3 && s <= 7;
    const kateViewVisible = s >= 3 && s <= 4;
    const kateTextVisible = s >= 4;
    const tonyViewVisible = s >= 6 && s <= 7;
    const tonyTextVisible = s >= 7;

    const showFloats = s >= 9 && s <= 15;
    const floatSmall = s >= 10;
    const floatSnug = s >= 11;

    const isAct4 = s >= 14;
    const showAct1 = s <= 15;
    const act1Fading = s >= 14;
    const showEventSpace = s >= 15 && s <= 26;
    const eventSpaceVisible = s >= 15 && s <= 25;
    const showEventLabel = s >= 15 && s <= 16;
    const eventLabelFading = s >= 16;
    const showAct4Header = s >= 15 && s <= 20;
    const showDots = s >= 16 && s <= 26;
    const showNewArrivals = s >= 16 && s <= 25;
    const showConvo = s >= 20 && s <= 21;
    const convoFading = s >= 21;
    const showRound2Convo = s === 23;
    const showRound3Convo = s === 25;
    const blueHeaderText =
        (s >= 23 && (s <= 24 || (s === 25 && !round3HeaderReady)))
            ? "It's a pairing experience that elevates your event!"
        : (s >= 25 && s <= 26 && round3HeaderReady)
            ? 'Creating many, quality connections for everyone!'
        : null;
    const blueHeaderFading = (s === 25 && !round3HeaderReady) || s === 26;

    return (
        <div className={`cmef-overlay ${fadingOut ? 'cmef-fade-out' : ''}`}>
            <div className="cmef-wrapper">
                <div className={`cmef-header-container ${isAct4 ? 'cmef-header-act4' : ''}`}>
                    {headerText && (
                        <span
                            className={`cmef-header-text ${headerFading ? 'cmef-header-fade-out' : ''}`}
                            key={headerText}
                        >
                            {headerText}
                        </span>
                    )}
                    {showAct4Header && headerPhase >= 0 && headerPhase <= 4 && (
                        <span
                            className={`cmef-header-text cmef-act4-header ${headerPhase === 4 ? 'cmef-header-fade-out' : ''}`}
                            key="act4-header"
                        >
                            It works best for:
                            {(headerPhase === 1 || headerPhase === 2) && (
                                <span className={`cmef-act4-rotate cmef-act4-sub ${headerPhase === 2 ? 'cmef-rotate-out' : ''}`} key="r0">
                                    Breaking the ice at the beginning of an event!
                                </span>
                            )}
                            {headerPhase >= 3 && (
                                <span className="cmef-act4-rotate cmef-act4-sub" key="r1">
                                    Or during open networking sessions!
                                </span>
                            )}
                        </span>
                    )}
                    {blueHeaderText && (
                        <span
                            className={`cmef-header-text cmef-blue-header ${blueHeaderFading ? 'cmef-header-fade-out' : ''}`}
                            key={blueHeaderText}
                        >
                            {blueHeaderText}
                        </span>
                    )}
                </div>

                <div className={`cmef-stage ${isAct4 ? 'cmef-stage-act4' : ''}`}>
                    {showAct1 && (
                    <div className={`cmef-act1-content ${act1Fading ? 'cmef-act1-fade' : ''}`}>
                    {/* ── Person Icons ── */}
                    <div className={
                        'cmef-person cmef-person-left'
                        + (hasEntered ? ' cmef-entered' : '')
                        + (isZoomed ? ' cmef-zoomed' : '')
                    }>
                        <div className="cmef-person-hop">
                            <PersonIcon />
                        </div>
                    </div>

                    <div className={
                        'cmef-person cmef-person-right'
                        + (hasEntered ? ' cmef-entered' : '')
                        + (isZoomed ? ' cmef-person-hidden' : '')
                    }>
                        <div className="cmef-person-hop">
                            <PersonIcon />
                        </div>
                    </div>

                    {/* ── Close-Up Overlay (Match Reveal) ── */}
                    {showCloseup && (
                        <div className={
                            'cmef-closeup'
                            + (closeupVisible ? ' cmef-closeup-visible' : '')
                        }>
                            {/* Kate view — phone left, text right */}
                            <div className={
                                'cmef-closeup-view cmef-closeup-kate'
                                + (kateViewVisible ? ' cmef-view-visible' : '')
                            }>
                                <PhoneFrame
                                    imageSrc="/assets/kate_rodriguez.png"
                                    className="cmef-closeup-phone"
                                />
                                <div className={
                                    'cmef-closeup-text'
                                    + (kateTextVisible ? ' cmef-text-visible' : '')
                                }>
                                    <span className="cmef-find-label">Go find</span>
                                    <span className="cmef-find-name">Kate Rodriguez</span>
                                    {kateTextVisible && (
                                        <div className="cmef-confetti-burst">
                                            <span className="cmef-conf cmef-c1" />
                                            <span className="cmef-conf cmef-c2" />
                                            <span className="cmef-conf cmef-c3" />
                                            <span className="cmef-conf cmef-c4" />
                                            <span className="cmef-conf cmef-c5" />
                                            <span className="cmef-conf cmef-c6" />
                                            <span className="cmef-conf cmef-c7" />
                                            <span className="cmef-conf cmef-c8" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tony view — text left, phone right */}
                            <div className={
                                'cmef-closeup-view cmef-closeup-tony'
                                + (tonyViewVisible ? ' cmef-view-visible' : '')
                            }>
                                <div className={
                                    'cmef-closeup-text'
                                    + (tonyTextVisible ? ' cmef-text-visible' : '')
                                }>
                                    <span className="cmef-find-label">Go find</span>
                                    <span className="cmef-find-name">Tony Chopper</span>
                                    {tonyTextVisible && (
                                        <div className="cmef-confetti-burst">
                                            <span className="cmef-conf cmef-c1" />
                                            <span className="cmef-conf cmef-c2" />
                                            <span className="cmef-conf cmef-c3" />
                                            <span className="cmef-conf cmef-c4" />
                                            <span className="cmef-conf cmef-c5" />
                                            <span className="cmef-conf cmef-c6" />
                                            <span className="cmef-conf cmef-c7" />
                                            <span className="cmef-conf cmef-c8" />
                                        </div>
                                    )}
                                </div>
                                <PhoneFrame
                                    imageSrc="/assets/tony_chopper.jpg"
                                    className="cmef-closeup-phone"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Floating Phones (Convergence) ── */}
                    {showFloats && (
                        <>
                            <div className={
                                'cmef-float-phone cmef-float-kate'
                                + (floatSmall ? ' cmef-float-small' : '')
                                + (floatSnug ? ' cmef-float-snug' : '')
                            }>
                                <div className="cmef-float-pop">
                                    <PhoneFrame imageSrc="/assets/kate_rodriguez.png" />
                                </div>
                            </div>

                            <div className={
                                'cmef-float-phone cmef-float-tony'
                                + (floatSmall ? ' cmef-float-small' : '')
                                + (floatSnug ? ' cmef-float-snug' : '')
                            }>
                                <div className="cmef-float-pop">
                                    <PhoneFrame imageSrc="/assets/tony_chopper.jpg" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Greeting Text ── */}
                    {s >= 12 && s <= 15 && (
                        <div className="cmef-greet cmef-greet-left">
                            <span className="cmef-greet-text">Nice to meet you Kate!</span>
                            <div className="cmef-confetti-burst">
                                {[1,2,3,4,5,6,7,8].map(n => (
                                    <span key={n} className={`cmef-conf cmef-c${n}`} />
                                ))}
                            </div>
                        </div>
                    )}
                    {s >= 13 && s <= 15 && (
                        <div className="cmef-greet cmef-greet-right">
                            <span className="cmef-greet-text">Hi Tony!</span>
                            <div className="cmef-confetti-burst">
                                {[1,2,3,4,5,6,7,8].map(n => (
                                    <span key={n} className={`cmef-conf cmef-c${n}`} />
                                ))}
                            </div>
                        </div>
                    )}
                    </div>
                    )}

                    {/* ── Event Space (Act 4+) ── */}
                    {showEventSpace && (
                        <div className={`cmef-event-space ${eventSpaceVisible ? 'cmef-es-visible' : ''}`}>
                            <div className="cmef-event-circle">
                                {showEventLabel && (
                                    <span className={`cmef-event-label ${eventLabelFading ? 'cmef-label-fade' : ''}`}>
                                        Event Space
                                    </span>
                                )}
                                {showDots && circles.map(c => (
                                    <div
                                        key={c.id}
                                        className="cmef-dot"
                                        style={{ left: `${c.x}%`, top: `${c.y}%` }}
                                    />
                                ))}
                                {phoneRevealCount > 0 && circles.map(c => {
                                    const pairIdx = Math.floor(c.id / 2);
                                    const revealPos = PAIR_REVEAL_ORDER.indexOf(pairIdx);
                                    if (revealPos >= phoneRevealCount) return null;
                                    const imgSrc = c.id % 2 === 0
                                        ? '/assets/tony_chopper.jpg'
                                        : '/assets/kate_rodriguez.png';
                                    return (
                                        <div
                                            key={`dp-${c.id}`}
                                            className="cmef-dot-phone"
                                            style={{ left: `${c.x}%`, top: `${c.y}%` }}
                                        >
                                            <PhoneFrame imageSrc={imgSrc} />
                                        </div>
                                    );
                                })}
                            </div>
                            {showNewArrivals && (
                                <div className="cmef-new-arrivals">
                                    <span className="cmef-arrivals-text">NEW<br />ARRIVALS</span>
                                    <div className="cmef-arrivals-arrow" />
                                </div>
                            )}
                            {showConvo && (
                                <div className={`cmef-convo-overlay ${convoFading ? 'cmef-convo-fade' : ''}`}>
                                    {CONVO_TEXTS.map((item, i) => (
                                        i < convoRevealCount && (
                                            <div
                                                key={`convo-${i}`}
                                                className="cmef-convo-text"
                                                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                            >
                                                <span className="cmef-convo-word">{item.text}</span>
                                                <div className="cmef-confetti-burst">
                                                    {[1,2,3,4,5,6,7,8].map(n => (
                                                        <span key={n} className={`cmef-conf cmef-c${n}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                            {showRound2Convo && (
                                <div className="cmef-convo-overlay cmef-convo-light">
                                    {CONVO_TEXTS.map((item, i) => (
                                        <div
                                            key={`r2convo-${i}`}
                                            className="cmef-convo-text"
                                            style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                        >
                                            <span className="cmef-convo-word">{item.text}</span>
                                            <div className="cmef-confetti-burst">
                                                {[1,2,3,4,5,6,7,8].map(n => (
                                                    <span key={n} className={`cmef-conf cmef-c${n}`} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showRound3Convo && (
                                <div className="cmef-convo-overlay cmef-convo-light">
                                    {CONVO_TEXTS.map((item, i) => (
                                        <div
                                            key={`r3convo-${i}`}
                                            className="cmef-convo-text"
                                            style={{ left: `${item.x}%`, top: `${item.y}%` }}
                                        >
                                            <span className="cmef-convo-word">{item.text}</span>
                                            <div className="cmef-confetti-burst">
                                                {[1,2,3,4,5,6,7,8].map(n => (
                                                    <span key={n} className={`cmef-conf cmef-c${n}`} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Let's Get Started (Final) ── */}
                    {s >= 27 && (
                        <div className="cmef-lets-go">
                            {"Let's get started!".split('').map((char, i) => (
                                <span
                                    key={i}
                                    className="cmef-lets-go-char"
                                    style={{ animationDelay: `${i * 0.04}s` }}
                                >
                                    {char === ' ' ? '\u00A0' : char}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoolerGeneralMatchEventFlow;
