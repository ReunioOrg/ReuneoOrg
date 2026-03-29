import React, { useState, useEffect, useCallback, useRef } from 'react';
import './tutorial-general-intro-matching.css';

const SCENES = [
    // Round 1 — Simple pairing (no labels)
    { id: 'enter', duration: 2000 },                    // 0
    { id: 'close-together', duration: 1500 },            // 1
    { id: 'match-text', duration: 1800 },                // 2
    { id: 'move-to-corner', duration: 1500 },            // 3
    // Round 2 — Rapid fill + fade
    { id: 'fill-row', duration: 3400 },                  // 4
    { id: 'fill-fade', duration: 1200 },                 // 5
    // Round 3 — Mechanic / Tire Sales (detailed)
    { id: 'enter-r3', duration: 2000 },                  // 6
    { id: 'labels-ima-r3', duration: 1200 },             // 7
    { id: 'labels-meet-r3', duration: 1200 },            // 8
    { id: 'highlight-mechanic-origin', duration: 800 },  // 9
    { id: 'arrow-mechanic', duration: 300 },             // 10
    { id: 'highlight-mechanic-dest', duration: 1400 },   // 11
    { id: 'highlight-tiresales-origin', duration: 800 }, // 12
    { id: 'arrow-tiresales', duration: 300 },            // 13
    { id: 'highlight-tiresales-dest', duration: 1200 },  // 14
    { id: 'close-together-r3', duration: 2000 },         // 15
    { id: 'labels-fade-r3', duration: 800 },             // 16
    { id: 'match-text-r3', duration: 1800 },             // 17
    { id: 'move-to-corner-r3', duration: 1500 },         // 18
    // Round 4 — Taurus / Planting (detailed, faster)
    { id: 'enter-r4', duration: 1400 },                  // 19
    { id: 'labels-ima-r4', duration: 800 },              // 20
    { id: 'labels-meet-r4', duration: 800 },             // 21
    { id: 'highlight-taurus-origin', duration: 600 },    // 22
    { id: 'arrow-taurus', duration: 300 },               // 23
    { id: 'highlight-taurus-dest', duration: 1000 },     // 24
    { id: 'highlight-planting-origin', duration: 600 },  // 25
    { id: 'arrow-planting', duration: 300 },             // 26
    { id: 'highlight-planting-dest', duration: 800 },    // 27
    { id: 'close-together-r4', duration: 1400 },         // 28
    { id: 'labels-fade-r4', duration: 600 },             // 29
    { id: 'match-text-r4', duration: 1400 },             // 30
    { id: 'move-to-corner-r4', duration: 1200 },         // 31
    // Finale — fill row
    { id: 'fill-row-finale', duration: 3400 },           // 32
];

const R2_FILL_POSITIONS = [85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5];
const R2_FILL_HOPPERS = new Set([85, 75, 65, 55, 45, 35, 25, 15, 5]);

const CHAT_BLURBS = [
    { text: "Favorite hobby?", left: 88, top: 56, delay: 0.15 },
    { text: "How's your day?", left: 67, top: 48, delay: 0.4 },
    { text: "How are you?",    left: 45, top: 60, delay: 0.65 },
    { text: "Love that!",      left: 25, top: 50, delay: 0.9 },
    { text: "Same!",           left: 8,  top: 58, delay: 1.15 },
];

const FINALE_FILL_POSITIONS = [75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5];
const FINALE_FILL_HOPPERS = new Set([75, 65, 55, 45, 35, 25, 15, 5]);

const PersonIcon = ({ color = '#144dff' }) => (
    <svg viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="12" r="9" fill={color} />
        <polygon points="24,14 5,60 43,60" fill={color} />
    </svg>
);

const TutorialGeneralIntroMatching = ({ isVisible, onComplete }) => {
    const [currentScene, setCurrentScene] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);

    const stageRef = useRef(null);
    const mechanicTagLeftRef = useRef(null);
    const mechanicTagRightRef = useRef(null);
    const tiresalesTagLeftRef = useRef(null);
    const tiresalesTagRightRef = useRef(null);
    const taurusTagLeftRef = useRef(null);
    const taurusTagRightRef = useRef(null);
    const plantingTagLeftRef = useRef(null);
    const plantingTagRightRef = useRef(null);

    const [mechanicArrow, setMechanicArrow] = useState(null);
    const [tiresalesArrow, setTiresalesArrow] = useState(null);
    const [taurusArrow, setTaurusArrow] = useState(null);
    const [plantingArrow, setPlantingArrow] = useState(null);
    const [stageDims, setStageDims] = useState({ w: 420, h: 380 });

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
            setMechanicArrow(null);
            setTiresalesArrow(null);
            setTaurusArrow(null);
            setPlantingArrow(null);
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
        const stage = stageRef.current;
        if (!stage) return;

        const compute = () => {
            const sr = stage.getBoundingClientRect();
            setStageDims({ w: sr.width, h: sr.height });

            const ml = mechanicTagLeftRef.current;
            const mr = mechanicTagRightRef.current;
            if (ml && mr) {
                const fromRect = mr.getBoundingClientRect();
                const toRect = ml.getBoundingClientRect();
                setMechanicArrow({
                    x1: fromRect.left - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.right - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }

            const tsl = tiresalesTagLeftRef.current;
            const tsr = tiresalesTagRightRef.current;
            if (tsl && tsr) {
                const fromRect = tsl.getBoundingClientRect();
                const toRect = tsr.getBoundingClientRect();
                setTiresalesArrow({
                    x1: fromRect.right - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.left - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }

            const tal = taurusTagLeftRef.current;
            const tar = taurusTagRightRef.current;
            if (tal && tar) {
                const fromRect = tar.getBoundingClientRect();
                const toRect = tal.getBoundingClientRect();
                setTaurusArrow({
                    x1: fromRect.left - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.right - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }

            const pl = plantingTagLeftRef.current;
            const pr = plantingTagRightRef.current;
            if (pl && pr) {
                const fromRect = pl.getBoundingClientRect();
                const toRect = pr.getBoundingClientRect();
                setPlantingArrow({
                    x1: fromRect.right - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.left - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }
        };

        const timer = setTimeout(compute, 60);
        return () => clearTimeout(timer);
    }, [currentScene]);

    if (!isVisible) return null;

    const sceneIndex = currentScene;

    const renderArrowPath = (arrow, markerId) => {
        if (!arrow) return null;
        const d = `M ${arrow.x1} ${arrow.y1} L ${arrow.x2} ${arrow.y2}`;

        return (
            <>
                <defs>
                    <marker
                        id={markerId}
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                    >
                        <path
                            d="M 1 1 L 7 4 L 1 7"
                            fill="none"
                            stroke="rgba(160, 190, 220, 0.6)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </marker>
                </defs>
                <path
                    d={d}
                    fill="none"
                    stroke="rgba(160, 190, 220, 0.55)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    markerEnd={`url(#${markerId})`}
                />
            </>
        );
    };

    return (
        <div className={`general-intro-tutorial-overlay ${fadingOut ? 'gim-tutorial-fade-out' : ''}`}>
            <div className="gim-stage" ref={stageRef}>

                {/* ── Act 1: R1 simple pair + R2 fill — fades at scene 5 ── */}

                {sceneIndex <= 5 && (
                    <div className={`gim-act-one ${sceneIndex >= 5 ? 'gim-act-fade' : ''}`}>
                        {/* R1 Left person */}
                        <div className={`gim-person gim-person-left ${sceneIndex >= 1 ? 'gim-person-close' : ''} ${sceneIndex >= 3 ? 'gim-person-corner gim-person-behind' : ''}`}>
                            <div className="gim-person-hop">
                                <PersonIcon />
                            </div>
                        </div>

                        {/* R1 Right person */}
                        <div className={`gim-person gim-person-right ${sceneIndex >= 1 ? 'gim-person-close' : ''} ${sceneIndex >= 3 ? 'gim-person-corner' : ''}`}>
                            <div className="gim-person-hop">
                                <PersonIcon />
                            </div>
                        </div>

                        {/* R2 Fill icons */}
                        {sceneIndex >= 4 && R2_FILL_POSITIONS.map((pos, i) => {
                            const isHopper = R2_FILL_HOPPERS.has(pos);
                            return (
                                <div
                                    key={`fill-${pos}`}
                                    className="gim-person gim-person-fill"
                                    style={{
                                        left: `${pos}%`,
                                        animationDelay: `${i * 0.12}s`,
                                    }}
                                >
                                    <div
                                        className={`gim-person-hop ${isHopper ? 'gim-fill-hopper' : ''}`}
                                        style={isHopper ? { animationDelay: `${i * 0.12 + 0.5}s` } : undefined}
                                    >
                                        <PersonIcon />
                                    </div>
                                </div>
                            );
                        })}

                        {/* R2 Chat blurbs */}
                        {sceneIndex >= 4 && CHAT_BLURBS.map((blurb, i) => (
                            <div
                                key={`blurb-${i}`}
                                className="gim-chat-blurb"
                                style={{
                                    left: `${blurb.left}%`,
                                    top: `${blurb.top}%`,
                                    animationDelay: `${blurb.delay}s`,
                                }}
                            >
                                <span
                                    className="gim-blurb-sparkle gim-bsp-a"
                                    style={{ animationDelay: `${blurb.delay + 0.1}s` }}
                                >✦</span>
                                <span
                                    className="gim-blurb-sparkle gim-bsp-b"
                                    style={{ animationDelay: `${blurb.delay + 0.2}s` }}
                                >✧</span>
                                <span className="gim-blurb-text">{blurb.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Match toasts (R1 / R3 / R4) ── */}

                {(sceneIndex === 2 || sceneIndex === 17 || sceneIndex === 30) && (
                    <div className="gim-match-toast" key={sceneIndex}>
                        <span className="gim-sparkle gim-sp-1">✦</span>
                        <span className="gim-sparkle gim-sp-2">✦</span>
                        <span className="gim-sparkle gim-sp-3">✧</span>
                        <span className="gim-sparkle gim-sp-4">✦</span>
                        <span className="gim-sparkle gim-sp-5">✧</span>
                        <span className="gim-sparkle gim-sp-6">✦</span>
                        <span className="gim-match-text">Nice to meet you!</span>
                    </div>
                )}

                {/* ── Round 3 — Mechanic / Tire Sales ── */}

                {/* R3 Left person — Mechanic */}
                {sceneIndex >= 6 && (
                    <div className={`gim-person gim-person-left-r3 ${sceneIndex >= 15 ? 'gim-person-close' : ''} ${sceneIndex >= 18 ? 'gim-person-corner-r3 gim-person-behind' : ''}`}>
                        <div className={`gim-labels ${sceneIndex >= 16 ? 'gim-labels-fade' : ''}`}>
                            {sceneIndex >= 7 && (
                                <div className="gim-label-group gim-label-slide-r3">
                                    <span className="gim-label-text">I'm a:</span>
                                    <span
                                        ref={mechanicTagLeftRef}
                                        className={`gim-label-tag ${sceneIndex >= 11 ? 'gim-tag-highlight' : ''}`}
                                    >
                                        MECHANIC
                                    </span>
                                </div>
                            )}
                            {sceneIndex >= 8 && (
                                <div className="gim-label-group gim-label-slide-r3">
                                    <span className="gim-label-text">I want to meet:</span>
                                    <span
                                        ref={tiresalesTagLeftRef}
                                        className={`gim-label-tag ${sceneIndex >= 12 ? 'gim-tag-highlight-alt' : ''}`}
                                    >
                                        TIRE SALES
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="gim-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* R3 Right person — Tire Sales */}
                {sceneIndex >= 6 && (
                    <div className={`gim-person gim-person-right-r3 ${sceneIndex >= 15 ? 'gim-person-close' : ''} ${sceneIndex >= 18 ? 'gim-person-corner-r3' : ''}`}>
                        <div className={`gim-labels ${sceneIndex >= 16 ? 'gim-labels-fade' : ''}`}>
                            {sceneIndex >= 7 && (
                                <div className="gim-label-group gim-label-slide-r3">
                                    <span className="gim-label-text">I'm a:</span>
                                    <span
                                        ref={tiresalesTagRightRef}
                                        className={`gim-label-tag ${sceneIndex >= 14 ? 'gim-tag-highlight-alt' : ''}`}
                                    >
                                        TIRE SALES
                                    </span>
                                </div>
                            )}
                            {sceneIndex >= 8 && (
                                <div className="gim-label-group gim-label-slide-r3">
                                    <span className="gim-label-text">I want to meet:</span>
                                    <span
                                        ref={mechanicTagRightRef}
                                        className={`gim-label-tag ${sceneIndex >= 9 ? 'gim-tag-highlight' : ''}`}
                                    >
                                        MECHANIC
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="gim-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* Arrow: right MECHANIC → left MECHANIC */}
                {sceneIndex >= 10 && mechanicArrow && (
                    <svg className={`gim-arrow gim-arrow-fade-in ${sceneIndex >= 15 ? 'gim-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(mechanicArrow, 'gim-arrow-mechanic')}
                    </svg>
                )}

                {/* Arrow: left TIRE SALES → right TIRE SALES */}
                {sceneIndex >= 13 && tiresalesArrow && (
                    <svg className={`gim-arrow gim-arrow-fade-in ${sceneIndex >= 15 ? 'gim-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(tiresalesArrow, 'gim-arrow-tiresales')}
                    </svg>
                )}

                {/* ── Round 4 — Taurus / Planting ── */}

                {/* R4 Left person — Taurus */}
                {sceneIndex >= 19 && (
                    <div className={`gim-person gim-person-left-r4 ${sceneIndex >= 28 ? 'gim-person-close' : ''} ${sceneIndex >= 31 ? 'gim-person-corner-r4 gim-person-behind' : ''}`}>
                        <div className={`gim-labels ${sceneIndex >= 29 ? 'gim-labels-fade' : ''}`}>
                            {sceneIndex >= 20 && (
                                <div className="gim-label-group gim-label-slide-r4">
                                    <span className="gim-label-text">I'm a:</span>
                                    <span
                                        ref={taurusTagLeftRef}
                                        className={`gim-label-tag ${sceneIndex >= 24 ? 'gim-tag-highlight-gold' : ''}`}
                                    >
                                        TAURUS
                                    </span>
                                </div>
                            )}
                            {sceneIndex >= 21 && (
                                <div className="gim-label-group gim-label-slide-r4">
                                    <span className="gim-label-text">I want to meet:</span>
                                    <span
                                        ref={plantingTagLeftRef}
                                        className={`gim-label-tag ${sceneIndex >= 25 ? 'gim-tag-highlight-purple' : ''}`}
                                    >
                                        PLANTING
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="gim-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* R4 Right person — Planting */}
                {sceneIndex >= 19 && (
                    <div className={`gim-person gim-person-right-r4 ${sceneIndex >= 28 ? 'gim-person-close' : ''} ${sceneIndex >= 31 ? 'gim-person-corner-r4' : ''}`}>
                        <div className={`gim-labels ${sceneIndex >= 29 ? 'gim-labels-fade' : ''}`}>
                            {sceneIndex >= 20 && (
                                <div className="gim-label-group gim-label-slide-r4">
                                    <span className="gim-label-text">I'm a:</span>
                                    <span
                                        ref={plantingTagRightRef}
                                        className={`gim-label-tag ${sceneIndex >= 27 ? 'gim-tag-highlight-purple' : ''}`}
                                    >
                                        PLANTING
                                    </span>
                                </div>
                            )}
                            {sceneIndex >= 21 && (
                                <div className="gim-label-group gim-label-slide-r4">
                                    <span className="gim-label-text">I want to meet:</span>
                                    <span
                                        ref={taurusTagRightRef}
                                        className={`gim-label-tag ${sceneIndex >= 22 ? 'gim-tag-highlight-gold' : ''}`}
                                    >
                                        TAURUS
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="gim-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* Arrow: right TAURUS → left TAURUS */}
                {sceneIndex >= 23 && taurusArrow && (
                    <svg className={`gim-arrow gim-arrow-fade-in ${sceneIndex >= 28 ? 'gim-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(taurusArrow, 'gim-arrow-taurus')}
                    </svg>
                )}

                {/* Arrow: left PLANTING → right PLANTING */}
                {sceneIndex >= 26 && plantingArrow && (
                    <svg className={`gim-arrow gim-arrow-fade-in ${sceneIndex >= 28 ? 'gim-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(plantingArrow, 'gim-arrow-planting')}
                    </svg>
                )}

                {/* ── Finale — fill row + blurbs ── */}

                {sceneIndex >= 32 && FINALE_FILL_POSITIONS.map((pos, i) => {
                    const isHopper = FINALE_FILL_HOPPERS.has(pos);
                    return (
                        <div
                            key={`finale-${pos}`}
                            className="gim-person gim-person-fill"
                            style={{
                                left: `${pos}%`,
                                animationDelay: `${i * 0.12}s`,
                            }}
                        >
                            <div
                                className={`gim-person-hop ${isHopper ? 'gim-fill-hopper' : ''}`}
                                style={isHopper ? { animationDelay: `${i * 0.12 + 0.5}s` } : undefined}
                            >
                                <PersonIcon />
                            </div>
                        </div>
                    );
                })}

                {sceneIndex >= 32 && CHAT_BLURBS.map((blurb, i) => (
                    <div
                        key={`finale-blurb-${i}`}
                        className="gim-chat-blurb"
                        style={{
                            left: `${blurb.left}%`,
                            top: `${blurb.top}%`,
                            animationDelay: `${blurb.delay}s`,
                        }}
                    >
                        <span
                            className="gim-blurb-sparkle gim-bsp-a"
                            style={{ animationDelay: `${blurb.delay + 0.1}s` }}
                        >✦</span>
                        <span
                            className="gim-blurb-sparkle gim-bsp-b"
                            style={{ animationDelay: `${blurb.delay + 0.2}s` }}
                        >✧</span>
                        <span className="gim-blurb-text">{blurb.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TutorialGeneralIntroMatching;
